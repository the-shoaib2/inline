
import * as vscode from 'vscode';
import { Logger } from '@inline/shared';
import { CodeContext } from '@inline/context';
import { FunctionStrategy, FunctionBoundary } from './strategies/function/function-strategy.interface';
import { BracedFunctionStrategy } from './strategies/function/braced-function-strategy';
import { PythonFunctionStrategy } from './strategies/function/python-function-strategy';

export { FunctionBoundary };

/**
 * Function completer - generates complete functions instead of partial code
 */
export class FunctionCompleter {
    private logger: Logger;
    private strategies: FunctionStrategy[];
    private defaultStrategy: FunctionStrategy;

    constructor() {
        this.logger = new Logger('FunctionCompleter');
        this.defaultStrategy = new BracedFunctionStrategy();
        this.strategies = [
            this.defaultStrategy,
            new PythonFunctionStrategy()
        ];
    }

    public registerStrategy(strategy: FunctionStrategy): void {
        this.strategies.push(strategy);
    }
    
    private getStrategy(languageId: string): FunctionStrategy {
        return this.strategies.find(s => s.supports(languageId)) || this.defaultStrategy;
    }

    /**
     * Detect if we're at the start of a function
     */
    public detectFunctionBoundary(prefix: string, language: string): FunctionBoundary {
        const lines = prefix.split('\n');
        const lastLine = lines[lines.length - 1] || '';
        const trimmedLast = lastLine.trim();

        // Calculate indent level
        const indentLevel = lastLine.length - lastLine.trimStart().length;

        // Detect function patterns by strategy
        const strategy = this.getStrategy(language);
        const patterns = strategy.getPatterns();

        for (const pattern of patterns) {
            const match = trimmedLast.match(pattern.regex);
            if (match) {
                return {
                    isFunctionStart: true,
                    functionName: match[pattern.nameGroup] || 'anonymous',
                    functionType: pattern.type,
                    indentLevel,
                    needsClosing: true,
                    expectedEndPattern: pattern.endPattern
                };
            }
        }

        // Check if we're inside a function (opening brace without closing) - This logic is primarily for braced languages
        // For python this might be different, but strategy can handle "isComplete" logic.
        // The original code had generic brace check here. It should belong to strategy if specific.
        // However, "detectFunctionBoundary" mainly checks START.
        // The generic brace check for "inside unknown function" is a fallback.
        
        // Let's rely on basic brace check for fallback or ask strategy?
        // Strategy interface doesn't have "areWeInside".
        // Use generic fallbacks similar to original implementation but slightly smarter?
        const openBraces = prefix.split('{').length - 1;
        const closeBraces = prefix.split('}').length - 1;

        if (openBraces > closeBraces) {
            return {
                isFunctionStart: false,
                functionType: 'unknown',
                indentLevel,
                needsClosing: true
            };
        }

        return {
            isFunctionStart: false,
            functionType: 'unknown',
            indentLevel,
            needsClosing: false
        };
    }

    /**
     * Ensure completion is a complete function
     */
    public ensureComplete(
        completion: string,
        boundary: FunctionBoundary,
        language: string
    ): string {
        if (!boundary.needsClosing) {
            return completion;
        }

        let complete = completion;
        const strategy = this.getStrategy(language);

        // Check if completion already has proper closing
        if (strategy.isComplete(complete, boundary)) {
            return complete;
        }

        // Add missing closing based on language strategy
        return strategy.completeFunction(complete, boundary);
    }

    /**
     * Enhance completion to be a complete function
     */
    public async enhanceCompletion(
        completion: string,
        context: CodeContext,
        maxTokens: number = 512
    ): Promise<string> {
        try {
            // Detect if we're starting a function
            const boundary = this.detectFunctionBoundary(context.prefix, context.language);

            if (!boundary.isFunctionStart) {
                return completion;
            }

            this.logger.info(`Detected ${boundary.functionType} start: ${boundary.functionName}`);

            // Ensure completion is complete
            const enhanced = this.ensureComplete(completion, boundary, context.language);

            return enhanced;
        } catch (error) {
            this.logger.error('Function enhancement failed:', error as Error);
            return completion;
        }
    }
}
