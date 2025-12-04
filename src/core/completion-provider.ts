import * as vscode from 'vscode';
import { ModelManager, ModelInfo } from './model-manager';
import { ContextEngine, CodeContext } from './context-engine';
import { StatusBarManager } from '../ui/status-bar-manager';
import { NetworkDetector } from '../utils/network-detector';
import { ResourceManager } from '../utils/resource-manager';

interface CompletionCache {
    key: string;
    completion: string;
    timestamp: number;
    context: string;
}

export class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private modelManager: ModelManager;
    private statusBarManager: StatusBarManager;
    private networkDetector: NetworkDetector;
    private resourceManager: ResourceManager;
    private contextEngine: ContextEngine;
    private cache: Map<string, CompletionCache> = new Map();
    private maxCacheSize: number = 50;
    private isProcessing: boolean = false;
    private debounceTimer: NodeJS.Timeout | null = null;
    private debounceDelay: number = 300; // Increased debounce for real inference

    constructor(
        modelManager: ModelManager,
        statusBarManager: StatusBarManager,
        networkDetector: NetworkDetector,
        resourceManager: ResourceManager
    ) {
        this.modelManager = modelManager;
        this.statusBarManager = statusBarManager;
        this.networkDetector = networkDetector;
        this.resourceManager = resourceManager;
        this.contextEngine = new ContextEngine();

        this.loadCacheFromDisk();
    }

    private loadCacheFromDisk(): void {
        setTimeout(() => {
            try {
                // Implementation would load from workspace storage
            } catch (error) {
                console.error('Failed to load cache:', error);
            }
        }, 1000);
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        return new Promise((resolve) => {
            this.debounceTimer = setTimeout(async () => {
                const result = await this.provideCompletionInternal(document, position, context, token);
                resolve(result);
            }, this.debounceDelay);
        });
    }

    private async provideCompletionInternal(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        if (!this.shouldProvideCompletion(document, position)) {
            return [];
        }

        if (this.isProcessing) {
            return [];
        }

        const config = vscode.workspace.getConfiguration('inline');
        if (!config.get<boolean>('enableRealTimeInference', true)) {
            return [];
        }

        this.isProcessing = true;
        this.statusBarManager.setLoading(true);

        try {
            const cacheKey = this.generateCacheKey(document, position);
            const cached = this.cache.get(cacheKey);
            if (cached && this.isCacheValid(cached)) {
                return [this.createCompletionItem(cached.completion, position)];
            }

            const codeContext = await this.contextEngine.buildContext(document, position);
            const completion = await this.generateCompletion(codeContext, token);

            if (completion && completion.trim().length > 0) {
                this.cacheCompletion(cacheKey, completion, codeContext);
                return [this.createCompletionItem(completion, position)];
            }

            return [];
        } catch (error) {
            console.error('Error generating completion:', error);
            return [];
        } finally {
            this.isProcessing = false;
            this.statusBarManager.setLoading(false);
        }
    }

    private shouldProvideCompletion(document: vscode.TextDocument, position: vscode.Position): boolean {
        const excludedLanguages = ['plaintext', 'markdown', 'json', 'log'];
        if (excludedLanguages.includes(document.languageId)) {
            return false;
        }

        const line = document.lineAt(position.line);
        const lineText = line.text.substring(0, position.character);
        const isInComment = this.isInComment(document, position);

        if (isInComment && !this.containsTaskKeyword(lineText)) {
            return false;
        }

        return true;
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

    private cacheCompletion(key: string, completion: string, context: CodeContext): void {
        if (this.cache.size >= this.maxCacheSize) {
            const entries = Array.from(this.cache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);

            const toRemove = Math.ceil(this.maxCacheSize * 0.2);
            for (let i = 0; i < toRemove && i < entries.length; i++) {
                this.cache.delete(entries[i][0]);
            }
        }

        this.cache.set(key, {
            key,
            completion,
            timestamp: Date.now(),
            context: JSON.stringify(context)
        });
    }

    private createCompletionItem(completion: string, position: vscode.Position): vscode.InlineCompletionItem {
        const cleanedCompletion = this.cleanCompletion(completion);
        return new vscode.InlineCompletionItem(
            cleanedCompletion,
            new vscode.Range(position, position)
        );
    }

    private cleanCompletion(completion: string): string {
        let cleaned = completion;

        // Remove markdown code blocks if present
        cleaned = cleaned.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');

        // Remove leading newlines if excessive
        cleaned = cleaned.replace(/^\n{2,}/, '\n');

        return cleaned;
    }

    private async generateCompletion(context: CodeContext, token: vscode.CancellationToken): Promise<string> {
        try {
            const config = vscode.workspace.getConfiguration('inline');

            // Resource check
            if (config.get('resourceMonitoring', true)) {
                const resources = this.resourceManager.getCurrentUsage();
                if (resources.memory > 0.9) {
                    throw new Error('High memory usage, skipping completion');
                }
            }

            // Get current model
            const model = this.modelManager.getCurrentModel();
            if (!model) {
                // Try to get best available downloaded model
                const bestModel = this.modelManager.getBestModel({
                    language: context.language,
                    speed: 'balanced'
                });

                if (bestModel) {
                    await this.modelManager.setCurrentModel(bestModel.id);
                } else {
                    return ''; // No model available
                }
            }

            // Generate prompt
            const prompt = await this.contextEngine.generatePrompt(context);
            const inferenceEngine = this.modelManager.getInferenceEngine();

            if (!inferenceEngine.isModelLoaded()) {
                // Auto-load if not loaded (should be handled by setCurrentModel, but safety check)
                const currentModel = this.modelManager.getCurrentModel();
                if (currentModel && currentModel.path) {
                    await inferenceEngine.loadModel(currentModel.path);
                } else {
                    return '';
                }
            }

            // Generate completion
            const maxLines = config.get<number>('maxCompletionLines', 5);
            const completion = await inferenceEngine.generateCompletion(prompt, {
                maxTokens: 128,
                stop: ['<|endoftext|>', '<EOT>', '\n\n\n'], // Stop at multiple newlines
                temperature: config.get<number>('temperature', 0.1)
            });

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

    clearCache(): void {
        this.cache.clear();
    }

    getCacheSize(): number {
        return this.cache.size;
    }
}
