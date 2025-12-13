"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockLlamaEngine = void 0;
/**
 * Mock implementation of LlamaInference for E2E testing.
 * Provides realistic completions without requiring actual GGUF models.
 */
class MockLlamaEngine {
    constructor() {
        this.isLoaded = false;
        this.currentModelPath = null;
    }
    async loadModel(modelPath, options = {}) {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 10));
        this.isLoaded = true;
        this.currentModelPath = modelPath;
        console.log(`[MockLlamaEngine] Model "loaded": ${modelPath}`);
    }
    async unloadModel() {
        this.isLoaded = false;
        this.currentModelPath = null;
        console.log('[MockLlamaEngine] Model unloaded');
    }
    async generateCompletion(prompt, options = {}, onToken, cancellationToken) {
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
    async generateImprovement(code, instruction, options = {}) {
        if (!this.isLoaded) {
            throw new Error('Model not loaded');
        }
        // Simple mock improvement
        return `// Improved based on: ${instruction}\n${code}`;
    }
    isModelLoaded() {
        return this.isLoaded;
    }
    getModelPath() {
        return this.currentModelPath;
    }
    getModelStatus() {
        return {
            loaded: this.isLoaded,
            modelPath: this.currentModelPath
        };
    }
    detectLanguage(prompt) {
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
    detectIntent(prompt) {
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
    generateResponse(language, intent, prompt) {
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
    generateTypeScriptCompletion(intent, lastLine, prompt) {
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
    generatePythonCompletion(intent, lastLine, prompt) {
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
    generateJavaCompletion(intent, lastLine, prompt) {
        if (intent === 'function') {
            return 'public void example() {\n    // TODO: Implement\n}';
        }
        if (intent === 'class') {
            return 'public Calculator() {\n    // Constructor\n}';
        }
        return 'int result = 0;';
    }
    generateGoCompletion(intent, lastLine, prompt) {
        if (intent === 'function') {
            return 'func example() {\n\t// TODO: Implement\n}';
        }
        return 'result := true';
    }
    generateGenericCompletion(intent, lastLine) {
        if (intent === 'function') {
            return 'function example() {\n  return true;\n}';
        }
        return 'const result = true;';
    }
    // Additional methods for compatibility
    cachePrefix(key, tokens) {
        // Mock implementation
    }
    getCachedPrefix(key) {
        return null;
    }
    clearPrefixCache() {
        // Mock implementation
    }
    getCacheStats() {
        return { size: 0, maxSize: 100 };
    }
}
exports.MockLlamaEngine = MockLlamaEngine;
//# sourceMappingURL=mock-llama-engine.js.map