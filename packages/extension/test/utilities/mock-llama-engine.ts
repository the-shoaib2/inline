import { InferenceOptions, TokenCallback } from '@intelligence/engines/llama-engine';
import * as vscode from 'vscode';

/**
 * Mock implementation of LlamaInference for E2E testing.
 * Provides realistic completions without requiring actual GGUF models.
 */
export class MockLlamaEngine {
    private isLoaded: boolean = false;
    private currentModelPath: string | null = null;

    async loadModel(modelPath: string, options: {
        threads?: number;
        gpuLayers?: number;
        contextSize?: number;
        fimTemplate?: string;
    } = {}): Promise<void> {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 10));
        
        this.isLoaded = true;
        this.currentModelPath = modelPath;
        console.log(`[MockLlamaEngine] Model "loaded": ${modelPath}`);
    }

    async unloadModel(): Promise<void> {
        this.isLoaded = false;
        this.currentModelPath = null;
        console.log('[MockLlamaEngine] Model unloaded');
    }

    async generateCompletion(
        prompt: string,
        options: InferenceOptions = {},
        onToken?: TokenCallback,
        cancellationToken?: vscode.CancellationToken
    ): Promise<string> {
        if (!this.isLoaded) {
            throw new Error('Model not loaded. Please load a model first.');
        }

        // Simulate generation delay
        await new Promise(resolve => setTimeout(resolve, 50));

        // Detect language from prompt
        const language = this.detectLanguage(prompt);
        
        // Detect intent from prompt
        const intent = this.detectIntent(prompt);

        // Generate realistic completion
        const completion = this.generateResponse(language, intent, prompt);

        // Simulate streaming if callback provided
        if (onToken) {
            const tokens = completion.split('');
            for (let i = 0; i < tokens.length; i++) {
                if (cancellationToken?.isCancellationRequested) {
                    break;
                }
                onToken(tokens[i], i + 1);
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }

        return completion;
    }

    async generateImprovement(code: string, instruction: string, options: InferenceOptions = {}): Promise<string> {
        if (!this.isLoaded) {
            throw new Error('Model not loaded');
        }

        // Simple mock improvement
        return `// Improved based on: ${instruction}\n${code}`;
    }

    isModelLoaded(): boolean {
        return this.isLoaded;
    }

    getModelPath(): string | null {
        return this.currentModelPath;
    }

    getModelStatus(): { loaded: boolean; modelPath: string | null } {
        return {
            loaded: this.isLoaded,
            modelPath: this.currentModelPath
        };
    }

    private detectLanguage(prompt: string): string {
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('function') || lowerPrompt.includes('const') || lowerPrompt.includes('interface')) {
            return 'typescript';
        }
        if (lowerPrompt.includes('def ') || lowerPrompt.includes('import ') || lowerPrompt.includes('#')) {
            return 'python';
        }
        if (lowerPrompt.includes('class') && lowerPrompt.includes('public')) {
            return 'java';
        }
        if (lowerPrompt.includes('func ') || lowerPrompt.includes('package main')) {
            return 'go';
        }
        
        return 'typescript'; // Default
    }

    private detectIntent(prompt: string): string {
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('// create') || lowerPrompt.includes('# create')) {
            return 'function';
        }
        if (lowerPrompt.includes('class ')) {
            return 'class';
        }
        if (lowerPrompt.includes('import')) {
            return 'import';
        }
        if (lowerPrompt.includes('test') || lowerPrompt.includes('spec')) {
            return 'test';
        }
        
        return 'general';
    }

    private generateResponse(language: string, intent: string, prompt: string): string {
        // Extract context from prompt
        const lines = prompt.split('\n');
        const lastLine = lines[lines.length - 1] || '';
        
        switch (language) {
            case 'typescript':
                return this.generateTypeScriptCompletion(intent, lastLine, prompt);
            case 'python':
                return this.generatePythonCompletion(intent, lastLine, prompt);
            case 'java':
                return this.generateJavaCompletion(intent, lastLine, prompt);
            case 'go':
                return this.generateGoCompletion(intent, lastLine, prompt);
            default:
                return this.generateGenericCompletion(intent, lastLine);
        }
    }

    private generateTypeScriptCompletion(intent: string, lastLine: string, prompt: string): string {
        if (intent === 'function') {
            // Check if it's from a comment
            if (prompt.includes('adds two numbers')) {
                return 'function add(a: number, b: number): number {\n  return a + b;\n}';
            }
            if (prompt.includes('async function')) {
                return 'async function fetchData(url: string): Promise<any> {\n  const response = await fetch(url);\n  return response.json();\n}';
            }
            return 'function example() {\n  // TODO: Implement\n}';
        }
        
        if (intent === 'class') {
            if (lastLine.includes('Calculator')) {
                return 'add(a: number, b: number): number {\n    return a + b;\n  }';
            }
            return 'constructor() {\n    // Initialize\n  }';
        }
        
        if (intent === 'import') {
            return "{ useState } from 'react';";
        }
        
        return 'const result = true;';
    }

    private generatePythonCompletion(intent: string, lastLine: string, prompt: string): string {
        if (intent === 'function') {
            if (prompt.includes('sorts a list')) {
                return 'def sort_list(items: list) -> list:\n    return sorted(items)';
            }
            return 'def example():\n    pass';
        }
        
        if (intent === 'class') {
            return 'def __init__(self):\n        pass';
        }
        
        if (intent === 'import') {
            return 'numpy as np';
        }
        
        return 'result = True';
    }

    private generateJavaCompletion(intent: string, lastLine: string, prompt: string): string {
        if (intent === 'function') {
            return 'public void example() {\n    // TODO: Implement\n}';
        }
        
        if (intent === 'class') {
            return 'public Calculator() {\n    // Constructor\n}';
        }
        
        return 'int result = 0;';
    }

    private generateGoCompletion(intent: string, lastLine: string, prompt: string): string {
        if (intent === 'function') {
            return 'func example() {\n\t// TODO: Implement\n}';
        }
        
        return 'result := true';
    }

    private generateGenericCompletion(intent: string, lastLine: string): string {
        if (intent === 'function') {
            return 'function example() {\n  return true;\n}';
        }
        
        return 'const result = true;';
    }

    // Additional methods for compatibility
    cachePrefix(key: string, tokens: any[]): void {
        // Mock implementation
    }

    getCachedPrefix(key: string): any[] | null {
        return null;
    }

    clearPrefixCache(): void {
        // Mock implementation
    }

    getCacheStats(): { size: number; maxSize: number } {
        return { size: 0, maxSize: 100 };
    }
}
