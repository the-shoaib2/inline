import * as vscode from 'vscode';
import { ASTParser } from '@inline/language';
import { Logger } from '@inline/shared';
import { CodeContext } from '@inline/context';

/**
 * Function boundary detection result
 */
export interface FunctionBoundary {
    isFunctionStart: boolean;
    functionName?: string;
    functionType: 'function' | 'method' | 'arrow' | 'class' | 'unknown';
    indentLevel: number;
    needsClosing: boolean;
    expectedEndPattern?: string;
}

/**
 * Function completer - generates complete functions instead of partial code
 */
export class FunctionCompleter {
    private logger: Logger;
    private astParser: ASTParser;

    constructor() {
        this.logger = new Logger('FunctionCompleter');
        this.astParser = new ASTParser();
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

        // Detect function patterns by language
        const patterns = this.getFunctionPatterns(language);

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

        // Check if we're inside a function (opening brace without closing)
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
     * Get function patterns for a language
     */
    private getFunctionPatterns(language: string): Array<{
        regex: RegExp;
        type: 'function' | 'method' | 'arrow' | 'class';
        nameGroup: number;
        endPattern: string;
    }> {
        const patterns: Record<string, any[]> = {
            typescript: [
                {
                    regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
                    type: 'function',
                    nameGroup: 1,
                    endPattern: '}'
                },
                {
                    regex: /^(?:export\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*:\s*\w+\s*{$/,
                    type: 'method',
                    nameGroup: 1,
                    endPattern: '}'
                },
                {
                    regex: /^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/,
                    type: 'arrow',
                    nameGroup: 1,
                    endPattern: '}'
                },
                {
                    regex: /^(?:export\s+)?class\s+(\w+)/,
                    type: 'class',
                    nameGroup: 1,
                    endPattern: '}'
                }
            ],
            javascript: [
                {
                    regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
                    type: 'function',
                    nameGroup: 1,
                    endPattern: '}'
                },
                {
                    regex: /^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/,
                    type: 'arrow',
                    nameGroup: 1,
                    endPattern: '}'
                },
                {
                    regex: /^class\s+(\w+)/,
                    type: 'class',
                    nameGroup: 1,
                    endPattern: '}'
                }
            ],
            python: [
                {
                    regex: /^(?:async\s+)?def\s+(\w+)\s*\(/,
                    type: 'function',
                    nameGroup: 1,
                    endPattern: 'dedent'
                },
                {
                    regex: /^class\s+(\w+)/,
                    type: 'class',
                    nameGroup: 1,
                    endPattern: 'dedent'
                }
            ]
        };

        return patterns[language] || patterns.typescript;
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

        // Check if completion already has proper closing
        if (this.isComplete(complete, boundary, language)) {
            return complete;
        }

        // Add missing closing based on language
        if (language === 'python') {
            // Python uses indentation
            complete = this.completePythonFunction(complete, boundary);
        } else {
            // C-style languages use braces
            complete = this.completeBracedFunction(complete, boundary);
        }

        return complete;
    }

    /**
     * Check if function is complete
     */
    private isComplete(completion: string, boundary: FunctionBoundary, language: string): boolean {
        if (language === 'python') {
            // Check if there's proper dedentation
            const lines = completion.split('\n');
            if (lines.length < 2) return false;

            const lastLine = lines[lines.length - 1];
            const lastIndent = lastLine.length - lastLine.trimStart().length;

            return lastIndent <= boundary.indentLevel;
        } else {
            // Check bracket balance
            const openBraces = (completion.match(/{/g) || []).length;
            const closeBraces = (completion.match(/}/g) || []).length;

            return openBraces === closeBraces;
        }
    }

    /**
     * Complete Python function with proper indentation
     */
    private completePythonFunction(completion: string, boundary: FunctionBoundary): string {
        const lines = completion.split('\n');
        
        // If last line is not dedented, add a pass statement and dedent
        const lastLine = lines[lines.length - 1];
        const lastIndent = lastLine.length - lastLine.trimStart().length;

        if (lastIndent > boundary.indentLevel) {
            // Still inside function, add pass if empty
            if (lastLine.trim().length === 0) {
                const indent = ' '.repeat(boundary.indentLevel + 4);
                lines[lines.length - 1] = `${indent}pass`;
            }
        }

        return lines.join('\n');
    }

    /**
     * Complete braced function (JS/TS/Java/C++)
     */
    private completeBracedFunction(completion: string, boundary: FunctionBoundary): string {
        const openBraces = (completion.match(/{/g) || []).length;
        const closeBraces = (completion.match(/}/g) || []).length;

        if (openBraces > closeBraces) {
            const missing = openBraces - closeBraces;
            const indent = ' '.repeat(boundary.indentLevel);
            
            // Add closing braces with proper indentation
            const closings = Array(missing).fill(indent + '}').join('\n');
            return completion + '\n' + closings;
        }

        return completion;
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
