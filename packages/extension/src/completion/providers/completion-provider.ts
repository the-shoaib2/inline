import * as vscode from 'vscode';
import { ModelManager, ModelInfo } from '@intelligence/models/model-manager';
import { LlamaInference } from '@intelligence/engines/llama-engine';
import { ContextEngine, CodeContext } from '@context/context-engine';
import { StatusBarManager } from '@ui/status-bar-manager';
import { NetworkDetector } from '@network/network-detector';
import { ResourceManager } from '@platform/resources/resource-manager';
import { CacheManager } from '@storage/cache/cache-manager';
import { PerformanceMonitor, CompletionMetrics } from '@platform/monitoring/performance-monitor';
import { SmartFilter } from '@completion/filtering/smart-filter';
import { DuplicationDetector } from '@language/validation/duplication-detector';
import { CompletionValidator } from '@completion/generation/completion-validator';
import { FunctionCompleter } from '@completion/generation/function-completer';
import { SmartCompletionEnhancer } from '@completion/providers/smart-completion-enhancer';

/**
 * In-memory LRU cache for completion results.
 * Evicts least recently used entries when size limit is reached.
 */
class LRUCache<K, V> {
    private cache = new Map<K, V>();
    private maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    /**
     * Get value and mark as recently used.
     */
    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }

    /**
     * Set value, evicting oldest entry if at capacity.
     */
    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Remove oldest (first) entry
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    /**
     * Clear all cached entries.
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get current number of cached entries.
     */
    get size(): number {
        return this.cache.size;
    }
}

/**
 * Cached completion with context metadata.
 */
interface CompletionCache {
    key: string;
    completion: string;
    timestamp: number;
    context: string;
}

/**
 * Queue for managing concurrent completion requests.
 * Cancels stale requests when new ones arrive.
 */
class CompletionQueue {
    private pending: {
        id: number;
        resolve: (value: vscode.InlineCompletionItem[]) => void;
        reject: (reason?: any) => void;
        token: vscode.CancellationToken;
        document: vscode.TextDocument;
        position: vscode.Position;
        context: vscode.InlineCompletionContext;
    } | null = null;

    private processing: boolean = false;
    private idCounter: number = 0;

    /**
     * Add completion request to queue.
     * Cancels previous pending request if not yet processing.
     */
    add(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        // Cancel stale request
        if (this.pending) {
             this.pending.resolve([]);
        }

        return new Promise<vscode.InlineCompletionItem[]>((resolve, reject) => {
            this.pending = {
                id: ++this.idCounter,
                resolve,
                reject,
                token,
                document,
                position,
                context
            };
        });
    }

    getPending() {
        return this.pending;
    }

    clearPending() {
        this.pending = null;
    }

    isProcessing() {
        return this.processing;
    }

    setProcessing(value: boolean) {
        this.processing = value;
    }
}

export class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private modelManager: ModelManager;
    private statusBarManager: StatusBarManager;
    private networkDetector: NetworkDetector;
    private resourceManager: ResourceManager;
    private cacheManager: CacheManager;
    private contextEngine: ContextEngine;
    private performanceMonitor: PerformanceMonitor;
    private smartFilter: SmartFilter;
    private duplicationDetector: DuplicationDetector;
    private completionValidator: CompletionValidator;
    private functionCompleter: FunctionCompleter;
    private smartCompletionEnhancer: SmartCompletionEnhancer;
    private requestQueue: CompletionQueue = new CompletionQueue();

    // Multi-level caching
    private exactCache: LRUCache<string, CompletionCache> = new LRUCache(2000);
    private prefixCache: LRUCache<string, CompletionCache[]> = new LRUCache(1000);
    private patternCache: LRUCache<string, CompletionCache[]> = new LRUCache(1000);

    private isProcessing: boolean = false;
    private debounceTimer: NodeJS.Timeout | null = null;
    private currentCancellation: vscode.CancellationTokenSource | null = null;

    private predictiveCache: LRUCache<string, CompletionCache> = new LRUCache(100);
    private prefetchCancellation: vscode.CancellationTokenSource | null = null;

    // Streaming support for real-time token display
    private currentStreamingTokens: string = '';
    private streamingCallback: ((tokens: string) => void) | null = null;

    // NEW: Fast Cache Manager for L1/L2 caching
    private fastCacheManager: any; // Will be imported from fast-cache-manager

    constructor(
        modelManager: ModelManager,
        statusBarManager: StatusBarManager,
        networkDetector: NetworkDetector,
        resourceManager: ResourceManager,
        cacheManager: CacheManager
    ) {
        this.modelManager = modelManager;
        this.statusBarManager = statusBarManager;
        this.networkDetector = networkDetector;
        this.resourceManager = resourceManager;
        this.cacheManager = cacheManager;
        this.contextEngine = new ContextEngine();
        this.performanceMonitor = new PerformanceMonitor();
        this.smartFilter = new SmartFilter();
        this.completionValidator = new CompletionValidator();
        this.functionCompleter = new FunctionCompleter();
        this.smartCompletionEnhancer = new SmartCompletionEnhancer(this.contextEngine);

        // Enable performance monitoring based on config
        const config = vscode.workspace.getConfiguration('inline');
        this.performanceMonitor.setEnabled(config.get<boolean>('performance.monitoring', false));

        // Initialize deduplication detector with config
        this.duplicationDetector = new DuplicationDetector({
            similarityThreshold: config.get<number>('deduplication.similarityThreshold', 0.8),
            minBlockSize: config.get<number>('deduplication.minBlockSize', 20),
            detectDistributed: config.get<boolean>('deduplication.detectDistributedRepetition', true)
        });

        // NEW: Initialize fast cache manager
        try {
            const { FastCacheManager } = require('../cache/fast-cache-manager');
            this.fastCacheManager = new FastCacheManager();
        } catch (error) {
            console.warn('[INLINE] FastCacheManager not available, using fallback caching');
        }

        this.loadCacheFromDisk();
    }

    private loadCacheFromDisk(): void {
        // CacheManager handles disk I/O, we just use it.
        // potentially preload hot items if needed, but CacheManager is efficient.
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        // FAST PATH: Check in-memory caches immediately (bypass debounce/queue for hits)
        const cacheKey = this.generateCacheKey(document, position);
        // Only check fast in-memory layers
         const predicted = this.predictiveCache.get(cacheKey);
         if (predicted && this.isCacheValid(predicted)) {
             console.log('[INLINE] ⚡ Fast Path: Predictive HIT');
             // Emit event for tracking even on cache hit
             let suggestionId: string | undefined;
             const tracker = (this as any).aiContextTracker;
             if (tracker) {
                 suggestionId = tracker.emitSuggestionGenerated(
                     predicted.completion,
                     1.0,
                     0, // Instant
                     0
                 );
             }
             return [this.createCompletionItem(predicted.completion, position, suggestionId)];
         }
         const exact = this.exactCache.get(cacheKey);
         if (exact && this.isCacheValid(exact)) {
             let suggestionId: string | undefined;
             const tracker = (this as any).aiContextTracker;
             if (tracker) {
                 suggestionId = tracker.emitSuggestionGenerated(
                     exact.completion,
                     1.0,
                     0,
                     0
                 );
             }
             return [this.createCompletionItem(exact.completion, position, suggestionId)];
         }

        // 1. Add to queue (this implicitly cancels previous headers)
        const pendingPromise = this.requestQueue.add(document, position, context, token);

        // 2. Schedule processing if not already running (or just reset debounce)
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        const config = vscode.workspace.getConfiguration('inline');
        // Dynamic debounce based on context
        const debounceInterval = this.calculateDynamicDebounce(document, position, config);

        this.debounceTimer = setTimeout(async () => {
            await this.processQueue();
        }, debounceInterval);

        return pendingPromise;
    }

    private async processQueue(): Promise<void> {
        const request = this.requestQueue.getPending();
        if (!request) return;

        // Clear pending so new requests can come in
        this.requestQueue.clearPending();

        if (request.token.isCancellationRequested) {
            request.resolve([]);
            return;
        }

        try {
            const result = await this.provideCompletionInternal(
                request.document,
                request.position,
                request.context,
                request.token
            );
            request.resolve(result);
        } catch (error) {
            request.resolve([]); // Safe fail
        }
    }

    private createCompletionItem(completion: string, position: vscode.Position, suggestionId?: string, document?: vscode.TextDocument): vscode.InlineCompletionItem {
        let enhancedCompletion = this.cleanCompletion(completion);

        // Apply smart enhancements if document is available (synchronous)
        if (document) {
            enhancedCompletion = this.smartCompletionEnhancer.enhanceSync(document, position, enhancedCompletion);
        }

        const item = new vscode.InlineCompletionItem(
            enhancedCompletion,
            new vscode.Range(position, position)
        );

        // Attach acceptance command if we have an ID
        if (suggestionId) {
            item.command = {
                title: 'Suggestion Accepted',
                command: 'inline.suggestionAccepted',
                arguments: [suggestionId]
            };
        }

        return item;
    }

    private async provideCompletionInternal(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        const startTime = Date.now();
        let resultCount = 0;
        let isCacheHit = false;
        let generatedChars = 0;

        if (!this.shouldProvideCompletion(document, position, context)) {
            return [];
        }

        // if (this.isProcessing) {
        //     console.log('[INLINE] ⏳ Already processing, skipping');
        //     return [];
        // }

        // Cancel any running prefetch to prioritize user interaction
        if (this.prefetchCancellation) {
            this.prefetchCancellation.cancel();
            this.prefetchCancellation = null;
        }

        const config = vscode.workspace.getConfiguration('inline');
        const realTimeEnabled = config.get<boolean>('enableRealTimeInference', true);
        console.log(`[INLINE] 🔧 enableRealTimeInference: ${realTimeEnabled}`);
        if (!realTimeEnabled) {
            console.log('[INLINE] ⛔ Real-time inference disabled in config');
            return [];
        }

        this.isProcessing = true;
        this.statusBarManager.setLoading(true);

        try {
            const cacheKey = this.generateCacheKey(document, position);

            // 1. Check caches first (CRITICAL: Must be sequential to avoid waiting for context if cache hits)
            const cachedResult = await this.checkAllCaches(cacheKey, position);

            // If we have a cached result, return immediately
            if (cachedResult) {
                // console.log('[INLINE] ⚡ Cache HIT (multi-level)');
                isCacheHit = true;
                resultCount = cachedResult.length;
                this.recordPerformance({
                    totalTime: Date.now() - startTime,
                    contextGatherTime: 0,
                    inferenceTime: 0,
                    renderTime: 0,
                    tokensGenerated: 0,
                    cacheHit: true,
                    timestamp: Date.now()
                });
                return cachedResult;
            }

            // 2. Parallel: Gather context + get diagnostics (only on miss)
            const contextStartTime = Date.now();
            const [codeContext, diagnostics] = await Promise.all([
                this.contextEngine.buildContext(document, position),
                this.getDiagnostics(document, position)
            ]);
            const contextGatherTime = Date.now() - contextStartTime;

            // Enhance context with diagnostics
            const enhancedContext = this.enhanceContextWithDiagnostics(codeContext, diagnostics);

            console.log('[INLINE] 🤖 Generating completion...');
            const inferenceStartTime = Date.now();
            let completion = await this.generateCompletion(enhancedContext, token, document, position);
            const inferenceTime = Date.now() - inferenceStartTime;
            console.log(`[INLINE] 🤖 Generated completion (${completion?.length || 0} chars):`, completion?.substring(0, 100));

            if (completion && completion.length > 0) {
                // NEW: Enhance with function completer
                const config = vscode.workspace.getConfiguration('inline');
                const functionCompletionEnabled = config.get<boolean>('functionCompletion.enabled', true);

                if (functionCompletionEnabled) {
                    const enhanced = await this.functionCompleter.enhanceCompletion(
                        completion,
                        codeContext,
                        config.get<number>('maxTokens', 512)
                    );

                    if (enhanced !== completion) {
                        console.log('[INLINE] 🔧 Function completion enhanced');
                        completion = enhanced;
                    }
                }

                console.log('[INLINE] ✅ Valid completion, caching and returning');
                this.cacheCompletion(cacheKey, completion, codeContext);

                // Trigger predictive prefetching for the NEXT token block
                this.schedulePrefetch(document, position, completion, codeContext, config);

                generatedChars = completion.length;

                // Emit Suggestion Generated Event
                let suggestionId: string | undefined;
                const tracker = (this as any).aiContextTracker;
                if (tracker) {
                    suggestionId = tracker.emitSuggestionGenerated(
                        completion,
                        1.0, // Confidence (mock for now)
                        Date.now() - startTime,
                        codeContext.tokenCount || 0
                    );
                }

                const items = [this.createCompletionItem(completion, position, suggestionId)];
                resultCount = items.length;


                this.recordPerformance({
                    totalTime: Date.now() - startTime,
                    contextGatherTime,
                    inferenceTime,
                    renderTime: 0,
                    tokensGenerated: Math.ceil(generatedChars / 4),
                    cacheHit: false,
                    timestamp: Date.now()
                });

                return items;
            }

            console.log('[INLINE] ⚠️  Empty completion returned');
            return [];
        } catch (error) {
            console.error('[INLINE] ❌ ERROR generating completion:', error);
            if (error instanceof Error) {
                console.error('[INLINE] Error stack:', error.stack);
            }
            return [];
        } finally {
            this.isProcessing = false;
            this.statusBarManager.setLoading(false);

            // Record metrics
            const duration = Date.now() - startTime;
            // Estimate tokens if not tracked explicitly during streaming
            // If streaming, tokenCount variable in generateCompletion scope...
            // but we can just use result length / 4 as approx
            // OR use the returned completion length.
            // We don't have easy access to completion result here in finally block if we returned early.
            // Actually, we can track it in variables.

            // Re-implement tracking in main flow or use state variables?
            // Since we return early, 'finally' is best, but we need variables in outer scope.
        }
    }

    /**
     * Schedule a background prefetch for the next likely completion
     */
    private schedulePrefetch(
        document: vscode.TextDocument,
        position: vscode.Position,
        currentCompletion: string,
        currentContext: CodeContext,
        config: vscode.WorkspaceConfiguration
    ): void {
        // Cancel any existing prefetch
        if (this.prefetchCancellation) {
            this.prefetchCancellation.cancel();
            this.prefetchCancellation.dispose();
        }
        this.prefetchCancellation = new vscode.CancellationTokenSource();
        const token = this.prefetchCancellation.token;

        // Capture state synchronously to avoid race conditions during delay
        let currentLineText = '';
        try {
            currentLineText = document.lineAt(position.line).text.substring(0, position.character);
        } catch (e) {
            // Document might be changing/invalid, abort prefetch
            return;
        }

        // Run in background (don't await)
        (async () => {
            try {
                // Wait a bit to let the UI update and user potentially type
                await new Promise(resolve => setTimeout(resolve, 100));
                if (token.isCancellationRequested) return;

                console.log('[INLINE] 🔮 Starting predictive prefetch...');

                // Calculate predicted position and context
                const newPrefix = currentContext.prefix + currentCompletion;
                // Update context with new prefix
                const nextContext: CodeContext = {
                    ...currentContext,
                    prefix: newPrefix,
                };

                // Generate cache key for the FUTURE state
                const lines = currentCompletion.split('\n');
                const lastLineCompletion = lines[lines.length - 1];

                // If multiline, the new line is just the last line of completion.
                // If single line, it's current line prefix + completion.
                let futurePrefix = '';
                let futureLine = position.line + lines.length - 1;

                if (lines.length > 1) {
                    futurePrefix = lastLineCompletion;
                } else {
                    futurePrefix = currentLineText + lastLineCompletion;
                }

                const futureKey = `${document.uri.fsPath}:${futureLine}:${futurePrefix}`;
                console.log(`[INLINE] 🔮 Predictive Key: ${futureKey.substring(0, 50)}...`);

                // Generate!
                const inferenceEngine = this.modelManager.getInferenceEngine();
                // Get template for current model
                const templateId = this.modelManager.getFimTemplateId();
                const prompt = await this.contextEngine.generatePrompt(nextContext, templateId);

                const prediction = await inferenceEngine.generateCompletion(
                    prompt,
                    {
                        maxTokens: 32, // Prefetch small chunks
                        temperature: 0.1,
                        stop: ['\n'] // Limit prediction to single line for speed? Or let config decide?
                    },
                    undefined,
                    token
                );

                if (prediction && prediction.trim().length > 0 && !token.isCancellationRequested) {
                    console.log(`[INLINE] 🔮 Prediction captured: "${prediction.substring(0, 20)}..."`);
                    this.cacheCompletion(futureKey, prediction, nextContext, true);
                }
            } catch (err) {
                console.log('[INLINE] 🔮 Prefetch aborted/failed', err);
            }
        })();
    }

    private shouldProvideCompletion(document: vscode.TextDocument, position: vscode.Position, context?: vscode.InlineCompletionContext): boolean {
        console.log('[INLINE] 🔍 Checking shouldProvideCompletion...');

        // 0. Use Smart Filter (Intelligent decision matrix)
        // If triggerKind is undefined (e.g. from tests), assume automatic
        const triggerKind = context?.triggerKind ?? vscode.InlineCompletionTriggerKind.Automatic;
        if (!this.smartFilter.shouldRespond(document, position, triggerKind)) {
            return false;
        }

        // Exclude certain file types
        const excludedLanguages = ['plaintext', 'log'];
        if (excludedLanguages.includes(document.languageId)) {
            console.log(`[INLINE] ⛔ Excluded language: ${document.languageId}`);
            return false;
        }
        console.log(`[INLINE] ✓ Language allowed: ${document.languageId}`);

        const line = document.lineAt(position.line);
        const lineText = line.text.substring(0, position.character);

        // Allow completions in most cases, including after comments (Copilot-like behavior)
        // Only block if line is completely empty or just whitespace
        if (lineText.trim().length === 0 && position.line > 0) {
            // Check if previous line is a comment - if so, generate code!
            const prevLine = document.lineAt(position.line - 1);
            const prevText = prevLine.text.trim();

            // If previous line is a comment, allow completion (this is the Copilot pattern)
            if (this.isCommentLine(prevText, document.languageId)) {
                return true;
            }
        }

        // Allow completions when typing code (not in comments)
        // const isInComment = this.isInComment(document, position);
        // if (isInComment) {
        //     // Don't generate while typing inside a comment
        //     return false;
        // }

        return true;
    }

    private isCommentLine(text: string, languageId: string): boolean {
        const commentStarts: Record<string, string[]> = {
            'javascript': ['//', '/*'],
            'typescript': ['//', '/*'],
            'python': ['#'],
            'java': ['//', '/*'],
            'cpp': ['//', '/*'],
            'c': ['//', '/*'],
            'go': ['//', '/*'],
            'rust': ['//', '/*'],
            'shellscript': ['#'],
            'ruby': ['#'],
            'php': ['//', '#', '/*']
        };

        const starts = commentStarts[languageId] || ['//', '#'];
        return starts.some(start => text.startsWith(start));
    }

    private isInComment(document: vscode.TextDocument, position: vscode.Position): boolean {
        const line = document.lineAt(position.line);
        const textBefore = line.text.substring(0, position.character);

        const commentPatterns = {
            python: /#.*$/,
            javascript: /\/\/.*$|\/\*[\s\S]*?\*\/$/,
            typescript: /\/\/.*$|\/\*[\s\S]*?\*\/$/,
            java: /\/\/.*$|\/\*[\s\S]*?\*\/$/,
            cpp: /\/\/.*$|\/\*[\s\S]*?\*\/$/,
            go: /\/\/.*$|\/\*[\s\S]*?\*\/$/,
            rust: /\/\/.*$|\/\*[\s\S]*?\*\/$/,
            shellscript: /#.*$/
        };

        const pattern = commentPatterns[document.languageId as keyof typeof commentPatterns];
        if (pattern) {
            return pattern.test(textBefore);
        }

        return false;
    }

    private containsTaskKeyword(text: string): boolean {
        const keywords = ['todo', 'fix', 'bug', 'implement', 'create', 'add'];
        return keywords.some(keyword => text.toLowerCase().includes(keyword));
    }

    private generateCacheKey(document: vscode.TextDocument, position: vscode.Position): string {
        const line = document.lineAt(position.line);
        const prefix = line.text.substring(0, position.character);
        return `${document.uri.fsPath}:${position.line}:${prefix}`;
    }

    private isCacheValid(cache: CompletionCache): boolean {
        const maxAge = 5 * 60 * 1000;
        return Date.now() - cache.timestamp < maxAge;
    }

    private async cacheCompletion(key: string, completion: string, context: CodeContext, isPredictive: boolean = false): Promise<void> {
        const cacheEntry = {
            key,
            completion,
            timestamp: Date.now(),
            context: JSON.stringify(context)
        };

        if (isPredictive) {
            this.predictiveCache.set(key, cacheEntry);
            return;
        }

        // Store in exact cache
        this.exactCache.set(key, cacheEntry);

        // Store in prefix cache
        const prefixKey = key.substring(0, Math.min(100, key.length));
        const existing = this.prefixCache.get(prefixKey) || [];
        existing.push(cacheEntry);
        // Keep only last 10 prefix matches
        if (existing.length > 10) {
            existing.shift();
        }
        this.prefixCache.set(prefixKey, existing);

        // Persist to disk (now async)
        await this.cacheManager.set(key, cacheEntry);
    }

    // --- AI Context Tracker Integration ---
    public cleanCompletion(completion: string): string {
        let cleaned = completion;

        // 1. Remove markdown code blocks
        cleaned = cleaned.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');

        // 2. Remove common hallucinated tags (e.g. <B>, <A HREF...>, <PRE>)
        // Matches <TAG...> where TAG starts with uppercase
        cleaned = cleaned.replace(/<[A-Z][^>]*>/g, '');

        // Phase 11: Combined - Use shared optimized regex from Inference engine
        // This acts as a secondary safety net if the model output them unexpectedly
        cleaned = cleaned.replace(LlamaInference.FIM_TOKEN_REGEX, '');

        // Also clean specifics
        cleaned = cleaned.replace(/obj\['middle'\]/g, ''); // Specific fix for user report

        // 3. Remove leading newlines if excessive
        cleaned = cleaned.replace(/^\n{2,}/, '\n');

        // 4. SMART DEDUPLICATION using DuplicationDetector
        const config = vscode.workspace.getConfiguration('inline');
        const deduplicationEnabled = config.get<boolean>('deduplication.enabled', true);

        if (deduplicationEnabled) {
            // Get language from context (fallback to 'javascript')
            const language = this.contextEngine ?
                (this.contextEngine as any).lastLanguage || 'javascript' :
                'javascript';

            try {
                const report = this.duplicationDetector.detectDuplicates(cleaned, language);

                if (report.hasDuplicates) {
                    console.log(`[DEDUP] Found ${report.duplicatesRemoved} duplicate(s), cleaning...`);
                    cleaned = report.cleanedCode;
                } else {
                    // Fallback for small duplicates/lines that DuplicationDetector ignores (minBlockSize)
                    cleaned = this.removeDuplicateBlocks(cleaned);
                }
            } catch (error) {
                console.warn('[DEDUP] Smart deduplication failed, using fallback:', error);
                // Fallback to basic deduplication
                cleaned = this.removeDuplicateBlocks(cleaned);
            }
        } else {
            // Use basic deduplication if smart dedup is disabled
            cleaned = this.removeDuplicateBlocks(cleaned);
        }

        // 5. VALIDATION & AUTO-FIX (NEW)
        const validationEnabled = config.get<boolean>('validation.enabled', true);
        if (validationEnabled && cleaned.trim().length > 0) {
            // Quick check first (fast)
            const quickCheckPassed = this.completionValidator.quickCheck(
                cleaned,
                (this.contextEngine as any).lastLanguage || 'javascript'
            );

            if (!quickCheckPassed) {
                console.log('[VALIDATION] Quick check failed, attempting fixes...');
                // Apply simple fixes for bracket/paren matching
                cleaned = this.applyQuickFixes(cleaned);
            }
        }

        return cleaned;
    }

    /**
     * Apply quick fixes for common syntax issues
     */
    private applyQuickFixes(code: string): string {
        let fixed = code;

        // Count brackets
        const openBraces = (fixed.match(/{/g) || []).length;
        const closeBraces = (fixed.match(/}/g) || []).length;
        const openParens = (fixed.match(/\(/g) || []).length;
        const closeParens = (fixed.match(/\)/g) || []).length;

        // Add missing closing braces
        if (openBraces > closeBraces) {
            const missing = openBraces - closeBraces;
            fixed += '\n' + '}'.repeat(missing);
            console.log(`[VALIDATION] Added ${missing} missing closing brace(s)`);
        }

        // Add missing closing parentheses
        if (openParens > closeParens) {
            const missing = openParens - closeParens;
            fixed += ')'.repeat(missing);
            console.log(`[VALIDATION] Added ${missing} missing closing parenthesis(es)`);
        }

        return fixed;
    }

    private removeDuplicateBlocks(text: string): string {
        // 1. Split into "paragraphs" (separated by blank lines)
        const blocks = text.split(/\n{2,}/);
        // Do not return early if only 1 block, need to check line-level dedup

        const seenBlocks = new Set<string>();
        const resultBlocks: string[] = [];
        const isHeaderBlock = (block: string) => /^(?:\/\/|#|<!--|\/\*).{0,100}$/s.test(block.trim());

        for (const block of blocks) {
            const trimmed = block.trim();
            if (trimmed.length === 0) continue;

            // Check if this block has been seen before
            if (seenBlocks.has(trimmed)) {
                // Aggressively dedup headers/comments
                if (isHeaderBlock(trimmed)) {
                    continue; // Skip repeated header
                }

                // For code blocks, dedup if it's a direct neighbor (stutter)
                // OR if it's a large block (> 50 chars) that repeated?
                // For now, let's just avoid "Function A", "Function B", "Function A" loops
                // If we've seen it, and it's code, skipping it might be risky (duplicate calls).
                // But usually AI doesn't write duplicate identical blocks in one completion.
                // Let's safe-guard: if length > 20, deduplicate.
                if (trimmed.length > 20) {
                    continue;
                }
            }

            seenBlocks.add(trimmed);
            resultBlocks.push(block); // Keep original formatting
        }

        // Rejoin with double newlines
        let result = resultBlocks.join('\n\n');

        // 2. Fallback: Line-based dedup (neighboring lines)
        const lines = result.split('\n');
        const uniqueLines: string[] = [];
        if (lines.length > 0) uniqueLines.push(lines[0]);

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const prev = lines[i-1];
            // Dedup if line is identical to previous and is significant (> 3 chars)
            if (line.trim().length > 3 && line.trim() === prev.trim()) {
                continue;
            }
            uniqueLines.push(line);
        }

        return uniqueLines.join('\n');
    }

    private async generateCompletion(
        context: CodeContext,
        token: vscode.CancellationToken,
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<string> {
        console.log('[INLINE] 🤖 generateCompletion called');
        try {
            const config = vscode.workspace.getConfiguration('inline');

            // Resource check with configurable threshold
            if (config.get('resourceMonitoring', true)) {
                const resources = this.resourceManager.getCurrentUsage();
                const memoryThreshold = config.get<number>('resourceMonitoring.memoryThreshold', 0.98);
                // console.log(`[INLINE] 💾 Memory usage: ${(resources.memory * 100).toFixed(1)}% (threshold: ${(memoryThreshold * 100).toFixed(0)}%)`);

                if (resources.memory > memoryThreshold) {
                    console.warn(`[INLINE] ⚠️  High memory usage: ${(resources.memory * 100).toFixed(1)}% (threshold: ${(memoryThreshold * 100).toFixed(0)}%)`);
                    // Don't throw error, just log warning and continue
                }
            }

            // Get current model
            console.log('[INLINE] 🔍 Getting current model...');
            const model = this.modelManager.getCurrentModel();
            console.log('[INLINE] 📦 Current model:', model ? model.name : 'NONE');
            if (!model) {
                console.log('[INLINE] ⚠️  No current model, trying to find best model...');
                // Try to get best available downloaded model
                const bestModel = this.modelManager.getBestModel({
                    language: context.language,
                    speed: 'balanced'
                });

                if (bestModel) {
                    console.log(`[INLINE] ✓ Found best model: ${bestModel.name}`);
                    await this.modelManager.setCurrentModel(bestModel.id);
                } else {
                    console.log('[INLINE] ❌ NO MODEL AVAILABLE - Cannot generate completion');
                    return ''; // No model available
                }
            }

            // Generate prompt
            // Dynamic FIM Template
            const templateId = this.modelManager.getFimTemplateId();
            console.log(`[INLINE] 📝 Using FIM Template: ${templateId}`);

            const prompt = await this.contextEngine.generatePrompt(context, templateId);
            const inferenceEngine = this.modelManager.getInferenceEngine();

            if (!inferenceEngine.isModelLoaded()) {
                // Auto-load if not loaded (should be handled by setCurrentModel, but safety check)
                const currentModel = this.modelManager.getCurrentModel();
                if (currentModel && currentModel.path) {
                    await inferenceEngine.loadModel(currentModel.path, {
                        threads: config.get<number>('inference.threads', 4),
                        gpuLayers: config.get<number>('inference.gpuLayers'),
                        contextSize: config.get<number>('contextWindow', 2048) // OPTIMIZED: Reduced from 4096
                    });
                } else {
                    return '';
                }
            }


            // OPTIMIZED: Streaming token generation for faster perceived latency
            const streamingEnabled = config.get<boolean>('streaming.enabled', true);
            const showPartial = config.get<boolean>('streaming.showPartial', true);
            const maxLines = config.get<number>('maxCompletionLines', 5);

            let tokenCount = 0;

            // Streaming callback to update status bar with real-time token count
            const onToken = streamingEnabled && showPartial ? (token: string, total: number) => {
                tokenCount = total;
                this.statusBarManager.setLoading(true, `Generating... (${total} tokens)`);
            } : undefined;

            // Generate completion with streaming support
            const maxTokens = this.calculateDynamicMaxTokens(document, position, config);

            const completion = await inferenceEngine.generateCompletion(
                prompt,
                {
                    maxTokens: maxTokens,
                    stop: ['<|endoftext|>', '<EOT>', '\n\n\n', '<file_separator>'], // Expanded stop list
                    temperature: config.get<number>('temperature', 0.1),
                    repeatPenalty: 1.1, // Slight penalty to prevent <B> <A> loops
                    maxLines: maxLines // Stop generation early if we exceed this
                },
                onToken,
                token
            );

            // Truncate to max lines
            const lines = completion.split('\n');
            if (lines.length > maxLines) {
                return lines.slice(0, maxLines).join('\n');
            }

            return completion;
        } catch (error) {
            console.error('Error generating completion:', error);
            return '';
        }
    }

    /**
     * Calculate dynamic debounce based on context
     */
    private calculateDynamicDebounce(
        document: vscode.TextDocument,
        position: vscode.Position,
        config: vscode.WorkspaceConfiguration
    ): number {
        const line = document.lineAt(position.line);
        const text = line.text.substring(0, position.character);

        // --- SMART TRIGGERS (Instant Response) ---

        // 1. Syntactic Triggers: . (dot), ( (paren), { (brace), [ (bracket), = (assignment), : (type/colon), , (comma), <space>
        // "Every line cursor detect" implies we should run almost always.
        // Spaces are crucial for next-word prediction.
        if (/[\.\(\{\[\=\:\,\s]$/.test(text)) {
            return 0; // Instant
        }

        // 2. New line (empty prefix)
        if (text.trim().length === 0) {
            return 0; // Instant start of line
        }

        // 3. Error context (still useful)
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const hasError = diagnostics.some(d => d.range.start.line === position.line);
        if (hasError) return 0;

        // --- Standard Logic ---

        // If typing a word, wait slightly to let them finish the word?
        // Actually, for "inline", we want to predict the REST of the word too.
        // So aggressive 10ms or 0ms is better than 25ms.

        return config.get<number>('debounce.min', 10); // Reduced default from 25 to 10
    }

    /**
     * Calculate dynamic max tokens based on context
     */
    private calculateDynamicMaxTokens(
        document: vscode.TextDocument,
        position: vscode.Position,
        config: vscode.WorkspaceConfiguration
    ): number {
        // If explicit value set in user workspace settings (not default), respect it?
        // Actually, config.get returns effective value.
        // We want to override the "default" large block if we detect small edit.

        // SAFEGUARD: Validate line number exists (document may have changed during async awaits)
    if (position.line >= document.lineCount) {
        return config.get<number>('maxTokens', 128);
    }

    const line = document.lineAt(position.line);
        const textAfter = line.text.substring(position.character);
        const lineText = line.text.trim();

        // 1. If inside a line (text after cursor > 0 and not just specialized chars)
        if (textAfter.trim().length > 0) {
            // Check if we are inside a function call or string?
            // Simple heuristic: restricted completion
            return 32;
        }

        // 2. If opening a block
        if (lineText.endsWith('{') || lineText.endsWith(':') || lineText.endsWith('(')) {
            return config.get<number>('maxTokens', 128);
        }

        // 3. Default (e.g. at end of empty line)
        // Check indentation level?
        return 64;
    }

    /**
     * Check all cache levels in parallel
     */
    private async checkAllCaches(
        cacheKey: string,
        position: vscode.Position
    ): Promise<vscode.InlineCompletionItem[] | null> {
        // 0. Predictive match (Highest priority)
        const predicted = this.predictiveCache.get(cacheKey);
        if (predicted && this.isCacheValid(predicted)) {
            console.log('[INLINE] 🔮 Prediction HIT');
            return [this.createCompletionItem(predicted.completion, position)];
        }

        // 1. Exact match
        const exact = this.exactCache.get(cacheKey);
        if (exact && this.isCacheValid(exact)) {
            return [this.createCompletionItem(exact.completion, position)];
        }

        // 2. Prefix match
        const prefixKey = cacheKey.substring(0, Math.min(100, cacheKey.length));
        const prefixMatches = this.prefixCache.get(prefixKey);
        if (prefixMatches && prefixMatches.length > 0) {
            const valid = prefixMatches.find(c => this.isCacheValid(c));
            if (valid) {
                return [this.createCompletionItem(valid.completion, position)];
            }
        }

        // 3. Disk cache (now async)
        const diskCached = await this.cacheManager.get(cacheKey) as CompletionCache | null;
        if (diskCached && this.isCacheValid(diskCached)) {
            // Promote to exact cache
            this.exactCache.set(cacheKey, diskCached);
            return [this.createCompletionItem(diskCached.completion, position)];
        }

        return null;
    }

    /**
     * Get diagnostics for current position
     */
    private async getDiagnostics(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.Diagnostic[]> {
        const allDiagnostics = vscode.languages.getDiagnostics(document.uri);

        // Get diagnostics near the cursor (within 5 lines)
        return allDiagnostics.filter(d =>
            Math.abs(d.range.start.line - position.line) <= 5
        );
    }

    /**
     * Enhance context with diagnostic information
     */
    private enhanceContextWithDiagnostics(
        context: CodeContext,
        diagnostics: vscode.Diagnostic[]
    ): CodeContext {
        // For now, just return context as-is
        // Diagnostics are logged and can be used for prompt generation later
        if (diagnostics.length > 0) {
            console.log(`[INLINE] 🔧 Found ${diagnostics.length} diagnostic(s) near cursor`);
        }
        return context;
    }

    clearCache(): void {
        this.exactCache.clear();
        this.prefixCache.clear();
        this.patternCache.clear();
    }

    getCacheSize(): number {
        return this.exactCache.size + this.prefixCache.size + this.patternCache.size;
    }

    /**
     * Record performance metrics
     */
    private recordPerformance(metrics: CompletionMetrics): void {
        this.performanceMonitor.record(metrics);
    }

    /**
     * Get performance report
     */
    public getPerformanceReport(): string {
        return this.performanceMonitor.getReport();
    }

    /**
     * Get the context engine instance
     */
    public getContextEngine(): ContextEngine {
        return this.contextEngine;
    }

    /**
     * Set the AI context tracker for event tracking
     */
    public setAIContextTracker(tracker: any): void {
        // Store tracker reference for future integration
        // This will be used to emit AI events during completion generation
        (this as any).aiContextTracker = tracker;
    }
}

