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
    private maxCacheSize: number = 100;
    private isProcessing: boolean = false;

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
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        // Check if we should provide completions
        if (!this.shouldProvideCompletion(document, position)) {
            return [];
        }

        // Check if already processing
        if (this.isProcessing) {
            return [];
        }

        // Check if offline mode is active and we have a model
        if (this.networkDetector.isOffline()) {
            const currentModel = this.modelManager.getCurrentModel();
            if (!currentModel) {
                return [];
            }
        }

        this.isProcessing = true;
        this.statusBarManager.setLoading(true);

        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(document, position);
            const cached = this.cache.get(cacheKey);
            if (cached && this.isCacheValid(cached)) {
                return [this.createCompletionItem(cached.completion)];
            }

            // Build context
            const codeContext = await this.contextEngine.buildContext(document, position);
            
            // Generate completion
            const completion = await this.generateCompletion(codeContext, token);
            
            if (completion && completion.trim().length > 0) {
                // Cache the result
                this.cacheCompletion(cacheKey, completion, codeContext);
                
                return [this.createCompletionItem(completion)];
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
        // Don't provide completions in certain file types
        const excludedLanguages = ['plaintext', 'markdown', 'json'];
        if (excludedLanguages.includes(document.languageId)) {
            return false;
        }

        // Don't provide completions in comments (unless they contain TODO/FIXME)
        const line = document.lineAt(position.line);
        const lineText = line.text.substring(0, position.character);
        const isInComment = this.isInComment(document, position);
        
        if (isInComment && !this.containsTaskKeyword(lineText)) {
            return false;
        }

        // Don't provide completions if the user is typing quickly (to avoid interruptions)
        if (this.isTypingQuickly()) {
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
            cpp: /\/\/.*$|\/\*[\s\S]*?\*\/$/
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

    private isTypingQuickly(): boolean {
        // TODO: Implement typing speed detection
        return false;
    }

    private generateCacheKey(document: vscode.TextDocument, position: vscode.Position): string {
        const line = document.lineAt(position.line);
        const prefix = line.text.substring(0, position.character);
        const suffix = line.text.substring(position.character);
        return `${document.uri.fsPath}:${position.line}:${prefix}:${suffix}`;
    }

    private isCacheValid(cache: CompletionCache): boolean {
        const maxAge = 5 * 60 * 1000; // 5 minutes
        return Date.now() - cache.timestamp < maxAge;
    }

    private cacheCompletion(key: string, completion: string, context: CodeContext): void {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = Array.from(this.cache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            key,
            completion,
            timestamp: Date.now(),
            context: JSON.stringify(context)
        });
    }

    private createCompletionItem(completion: string): vscode.InlineCompletionItem {
        // Clean up the completion
        const cleanedCompletion = this.cleanCompletion(completion);
        
        return new vscode.InlineCompletionItem(cleanedCompletion, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)));
    }

    private cleanCompletion(completion: string): string {
        // Remove common artifacts from model output
        let cleaned = completion.trim();
        
        // Remove code block markers
        cleaned = cleaned.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
        
        // Remove explanatory text
        cleaned = cleaned.replace(/^(Here|This|The).+\n/, '');
        
        // Ensure proper indentation
        const lines = cleaned.split('\n');
        if (lines.length > 1) {
            const firstLineIndent = lines[0].match(/^\s*/)?.[0] || '';
            cleaned = lines.map(line => {
                if (line.startsWith(firstLineIndent)) {
                    return line.substring(firstLineIndent.length);
                }
                return line;
            }).join('\n');
        }
        
        return cleaned;
    }

    private async generateCompletion(context: CodeContext, token: vscode.CancellationToken): Promise<string> {
        try {
            // Check system resources
            const resources = this.resourceManager.getCurrentUsage();
            if (resources.memory > 0.9) {
                throw new Error('High memory usage, skipping completion');
            }

            // Get the best model for this context
            const model = this.modelManager.getBestModel({
                language: context.language,
                speed: 'balanced'
            });

            if (!model) {
                throw new Error('No suitable model available');
            }

            // Generate prompt
            const prompt = await this.contextEngine.generatePrompt(context);

            // Simulate model inference (replace with actual model call)
            const completion = await this.simulateModelInference(prompt, model, token);

            return completion;
        } catch (error) {
            console.error('Error generating completion:', error);
            throw error;
        }
    }

    private async simulateModelInference(prompt: string, model: ModelInfo, token: vscode.CancellationToken): Promise<string> {
        // Simulate inference delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        // Check for cancellation
        if (token.isCancellationRequested) {
            throw new Error('Completion cancelled');
        }

        // Generate a simple completion based on the context
        const lines = prompt.split('\n');
        const lastLine = lines[lines.length - 1];
        
        // Simple heuristic-based completion
        if (lastLine.includes('function') || lastLine.includes('def')) {
            return this.generateFunctionCompletion(lastLine);
        } else if (lastLine.includes('class')) {
            return this.generateClassCompletion(lastLine);
        } else if (lastLine.includes('import') || lastLine.includes('from')) {
            return this.generateImportCompletion(lastLine);
        } else if (lastLine.trim().endsWith('{')) {
            return this.generateBlockCompletion(lastLine);
        }

        // Default completion
        return this.generateDefaultCompletion(lastLine);
    }

    private generateFunctionCompletion(line: string): string {
        if (line.includes('def ')) {
            return '    pass';
        } else if (line.includes('function')) {
            return '    // TODO: implement function';
        }
        return '';
    }

    private generateClassCompletion(line: string): string {
        return '\n    constructor() {\n        // TODO: initialize\n    }\n';
    }

    private generateImportCompletion(line: string): string {
        return '';
    }

    private generateBlockCompletion(line: string): string {
        return '\n    // TODO: implement\n}';
    }

    private generateDefaultCompletion(line: string): string {
        const trimmed = line.trim();
        if (trimmed.endsWith('.') || trimmed.endsWith(';')) {
            return '';
        }
        
        // Simple completions based on common patterns
        if (trimmed.startsWith('const ')) {
            return ' = ';
        } else if (trimmed.startsWith('let ')) {
            return ' = ';
        } else if (trimmed.startsWith('var ')) {
            return ' = ';
        }
        
        return '';
    }

    clearCache(): void {
        this.cache.clear();
    }

    getCacheSize(): number {
        return this.cache.size;
    }
}
