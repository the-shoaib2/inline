import * as vscode from 'vscode';
import { LlamaInference } from './llama-inference';
import { Logger } from '../utils/logger';

export type RefactoringType = 
    | 'extract-method'
    | 'extract-variable'
    | 'rename'
    | 'inline'
    | 'convert-to-arrow'
    | 'add-null-checks'
    | 'simplify-conditional'
    | 'remove-dead-code'
    | 'optimize-imports';

export interface RefactoringResult {
    type: RefactoringType;
    originalCode: string;
    refactoredCode: string;
    description: string;
    confidence: number; // 0-1
}

export interface RefactoringSuggestion {
    type: RefactoringType;
    description: string;
    range: vscode.Range;
    priority: 'high' | 'medium' | 'low';
}

export class RefactoringEngine {
    private inference: LlamaInference;
    private logger: Logger;

    constructor(inference: LlamaInference) {
        this.inference = inference;
        this.logger = new Logger('RefactoringEngine');
    }

    /**
     * Suggest refactorings for code
     */
    public async suggestRefactorings(
        document: vscode.TextDocument,
        range: vscode.Range
    ): Promise<RefactoringSuggestion[]> {
        const code = document.getText(range);
        const suggestions: RefactoringSuggestion[] = [];

        // Pattern-based suggestions
        suggestions.push(...this.detectPatternBasedRefactorings(code, range));

        // LLM-based suggestions
        try {
            const llmSuggestions = await this.getLLMRefactoringSuggestions(code, document.languageId);
            suggestions.push(...llmSuggestions.map(s => ({
                ...s,
                range
            })));
        } catch (error) {
            this.logger.error(`LLM refactoring suggestions failed: ${error}`);
        }

        return suggestions;
    }

    /**
     * Detect pattern-based refactoring opportunities
     */
    private detectPatternBasedRefactorings(code: string, range: vscode.Range): RefactoringSuggestion[] {
        const suggestions: RefactoringSuggestion[] = [];

        // Long method detection
        const lineCount = code.split('\n').length;
        if (lineCount > 50) {
            suggestions.push({
                type: 'extract-method',
                description: 'This method is long. Consider extracting smaller methods.',
                range,
                priority: 'high'
            });
        }

        // Nested conditionals
        const nestedIfCount = (code.match(/if\s*\(/g) || []).length;
        if (nestedIfCount > 3) {
            suggestions.push({
                type: 'simplify-conditional',
                description: 'Complex nested conditionals detected. Consider simplifying.',
                range,
                priority: 'medium'
            });
        }

        // Function expressions that could be arrows
        if (code.match(/function\s*\(/)) {
            suggestions.push({
                type: 'convert-to-arrow',
                description: 'Convert to arrow function for cleaner syntax.',
                range,
                priority: 'low'
            });
        }

        // Repeated code patterns
        const lines = code.split('\n');
        const lineMap = new Map<string, number>();
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 10) {
                lineMap.set(trimmed, (lineMap.get(trimmed) || 0) + 1);
            }
        }
        for (const [line, count] of lineMap) {
            if (count >= 3) {
                suggestions.push({
                    type: 'extract-method',
                    description: 'Repeated code detected. Consider extracting to a method.',
                    range,
                    priority: 'high'
                });
                break;
            }
        }

        return suggestions;
    }

    /**
     * Get LLM-based refactoring suggestions
     */
    private async getLLMRefactoringSuggestions(
        code: string,
        languageId: string
    ): Promise<Omit<RefactoringSuggestion, 'range'>[]> {
        const prompt = `Analyze this ${languageId} code and suggest refactorings:

\`\`\`${languageId}
${code}
\`\`\`

Suggest improvements for:
- Code organization
- Readability
- Performance
- Best practices

Format each suggestion as:
TYPE: extract-method|simplify-conditional|etc
DESCRIPTION: what to improve
PRIORITY: high|medium|low

Suggestions:`;

        try {
            const response = await this.inference.generateCompletion(prompt, {
                maxTokens: 256,
                temperature: 0.3
            });

            return this.parseRefactoringSuggestions(response);
        } catch (error) {
            this.logger.error(`LLM suggestions failed: ${error}`);
            return [];
        }
    }

    /**
     * Parse refactoring suggestions from LLM response
     */
    private parseRefactoringSuggestions(response: string): Omit<RefactoringSuggestion, 'range'>[] {
        const suggestions: Omit<RefactoringSuggestion, 'range'>[] = [];
        const lines = response.split('\n');

        let currentType: RefactoringType | null = null;
        let currentDescription = '';
        let currentPriority: 'high' | 'medium' | 'low' = 'medium';

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.match(/^TYPE:/i)) {
                if (currentType && currentDescription) {
                    suggestions.push({
                        type: currentType,
                        description: currentDescription,
                        priority: currentPriority
                    });
                }
                currentType = trimmed.replace(/^TYPE:\s*/i, '').trim() as RefactoringType;
                currentDescription = '';
                currentPriority = 'medium';
            } else if (trimmed.match(/^DESCRIPTION:/i)) {
                currentDescription = trimmed.replace(/^DESCRIPTION:\s*/i, '').trim();
            } else if (trimmed.match(/^PRIORITY:/i)) {
                currentPriority = trimmed.replace(/^PRIORITY:\s*/i, '').trim() as any;
            }
        }

        if (currentType && currentDescription) {
            suggestions.push({
                type: currentType,
                description: currentDescription,
                priority: currentPriority
            });
        }

        return suggestions;
    }

    /**
     * Apply refactoring
     */
    public async applyRefactoring(
        document: vscode.TextDocument,
        range: vscode.Range,
        type: RefactoringType
    ): Promise<RefactoringResult> {
        const code = document.getText(range);

        const prompt = this.buildRefactoringPrompt(code, type, document.languageId);

        try {
            const refactoredCode = await this.inference.generateCompletion(prompt, {
                maxTokens: 512,
                temperature: 0.1
            });

            const cleaned = this.cleanRefactoredCode(refactoredCode);

            return {
                type,
                originalCode: code,
                refactoredCode: cleaned,
                description: this.getRefactoringDescription(type),
                confidence: 0.8
            };
        } catch (error) {
            this.logger.error(`Refactoring failed: ${error}`);
            throw error;
        }
    }

    /**
     * Build refactoring prompt
     */
    private buildRefactoringPrompt(code: string, type: RefactoringType, languageId: string): string {
        const instructions: Record<RefactoringType, string> = {
            'extract-method': 'Extract repeated or complex code into separate methods',
            'extract-variable': 'Extract complex expressions into named variables',
            'rename': 'Rename variables/functions to be more descriptive',
            'inline': 'Inline unnecessary variables or methods',
            'convert-to-arrow': 'Convert function expressions to arrow functions',
            'add-null-checks': 'Add null/undefined checks for safety',
            'simplify-conditional': 'Simplify complex conditional logic',
            'remove-dead-code': 'Remove unused code',
            'optimize-imports': 'Optimize and organize imports'
        };

        return `Refactor this ${languageId} code: ${instructions[type]}

Original code:
\`\`\`${languageId}
${code}
\`\`\`

Provide ONLY the refactored code, no explanation:`;
    }

    /**
     * Clean refactored code
     */
    private cleanRefactoredCode(code: string): string {
        let cleaned = code.trim();
        
        // Remove markdown code fences
        cleaned = cleaned.replace(/```[\w]*\n?/g, '');
        
        // Remove common prefixes
        cleaned = cleaned.replace(/^(Here is the refactored code:?|Refactored:)\s*/i, '');
        
        return cleaned.trim();
    }

    /**
     * Get refactoring description
     */
    private getRefactoringDescription(type: RefactoringType): string {
        const descriptions: Record<RefactoringType, string> = {
            'extract-method': 'Extracted code into separate method',
            'extract-variable': 'Extracted expression into variable',
            'rename': 'Renamed for better clarity',
            'inline': 'Inlined unnecessary abstraction',
            'convert-to-arrow': 'Converted to arrow function',
            'add-null-checks': 'Added null safety checks',
            'simplify-conditional': 'Simplified conditional logic',
            'remove-dead-code': 'Removed unused code',
            'optimize-imports': 'Optimized imports'
        };

        return descriptions[type];
    }

    /**
     * Extract method refactoring
     */
    public async extractMethod(
        document: vscode.TextDocument,
        range: vscode.Range,
        methodName: string
    ): Promise<string> {
        const code = document.getText(range);

        const prompt = `Extract this code into a method named "${methodName}":

\`\`\`${document.languageId}
${code}
\`\`\`

Provide the extracted method definition:`;

        try {
            const method = await this.inference.generateCompletion(prompt, {
                maxTokens: 256,
                temperature: 0.1
            });

            return this.cleanRefactoredCode(method);
        } catch (error) {
            this.logger.error(`Extract method failed: ${error}`);
            throw error;
        }
    }

    /**
     * Simplify conditional logic
     */
    public async simplifyConditional(
        document: vscode.TextDocument,
        range: vscode.Range
    ): Promise<string> {
        const code = document.getText(range);

        const prompt = `Simplify this conditional logic:

\`\`\`${document.languageId}
${code}
\`\`\`

Make it more readable and maintainable. Provide only the simplified code:`;

        try {
            const simplified = await this.inference.generateCompletion(prompt, {
                maxTokens: 256,
                temperature: 0.1
            });

            return this.cleanRefactoredCode(simplified);
        } catch (error) {
            this.logger.error(`Simplify conditional failed: ${error}`);
            throw error;
        }
    }
}
