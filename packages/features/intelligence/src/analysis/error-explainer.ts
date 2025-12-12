import * as vscode from 'vscode';
import { LlamaInference } from '../engines/llama-engine';
import { Logger } from '@inline/shared';

export interface ErrorExplanation {
    error: string;
    explanation: string;
    suggestedFixes: string[];
    severity: vscode.DiagnosticSeverity;
    resources?: string[];
}

export class ErrorExplainer {
    private inference: LlamaInference;
    private logger: Logger;
    private explanationCache: Map<string, ErrorExplanation> = new Map();

    constructor(inference: LlamaInference) {
        this.inference = inference;
        this.logger = new Logger('ErrorExplainer');
    }

    /**
     * Explain a compiler/interpreter error
     */
    public async explainError(
        diagnostic: vscode.Diagnostic,
        document: vscode.TextDocument
    ): Promise<ErrorExplanation> {
        const errorText = diagnostic.message;
        const cacheKey = `${document.languageId}:${errorText}`;

        // Check cache first
        if (this.explanationCache.has(cacheKey)) {
            this.logger.info('Using cached explanation');
            return this.explanationCache.get(cacheKey)!;
        }

        const code = document.getText(diagnostic.range);
        const context = this.getErrorContext(document, diagnostic.range);

        const prompt = this.buildExplanationPrompt(
            errorText,
            code,
            context,
            document.languageId
        );

        try {
            const response = await this.inference.generateCompletion(prompt, {
                maxTokens: 512,
                temperature: 0.2
            });

            const explanation = this.parseExplanation(response, diagnostic);
            
            // Cache the explanation
            this.explanationCache.set(cacheKey, explanation);

            return explanation;
        } catch (error) {
            this.logger.error(`Error explanation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Build prompt for error explanation
     */
    private buildExplanationPrompt(
        errorMessage: string,
        code: string,
        context: string,
        languageId: string
    ): string {
        return `Explain this ${languageId} error in simple terms and suggest fixes.

Error: ${errorMessage}

Code with error:
\`\`\`${languageId}
${code}
\`\`\`

Context:
\`\`\`${languageId}
${context}
\`\`\`

Provide:
1. EXPLANATION: What the error means in simple terms
2. FIXES: 2-3 specific ways to fix it
3. EXAMPLE: Show corrected code if applicable

Response:`;
    }

    /**
     * Get surrounding context for an error
     */
    private getErrorContext(document: vscode.TextDocument, range: vscode.Range): string {
        const startLine = Math.max(0, range.start.line - 3);
        const endLine = Math.min(document.lineCount - 1, range.end.line + 3);
        
        const contextRange = new vscode.Range(
            new vscode.Position(startLine, 0),
            new vscode.Position(endLine, document.lineAt(endLine).text.length)
        );

        return document.getText(contextRange);
    }

    /**
     * Parse explanation from LLM response
     */
    private parseExplanation(response: string, diagnostic: vscode.Diagnostic): ErrorExplanation {
        const lines = response.split('\n');
        let explanation = '';
        const suggestedFixes: string[] = [];
        const resources: string[] = [];

        let currentSection = '';

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.match(/^(EXPLANATION|Explanation):/i)) {
                currentSection = 'explanation';
                continue;
            } else if (trimmed.match(/^(FIXES?|Suggested Fixes?):/i)) {
                currentSection = 'fixes';
                continue;
            } else if (trimmed.match(/^(EXAMPLE|Example):/i)) {
                currentSection = 'example';
                continue;
            }

            if (currentSection === 'explanation' && trimmed) {
                explanation += trimmed + ' ';
            } else if (currentSection === 'fixes' && trimmed) {
                // Extract numbered or bulleted fixes
                const fixMatch = trimmed.match(/^[\d\-\*\.]+\s*(.+)$/);
                if (fixMatch) {
                    suggestedFixes.push(fixMatch[1]);
                } else if (trimmed.length > 10) {
                    suggestedFixes.push(trimmed);
                }
            }
        }

        return {
            error: diagnostic.message,
            explanation: explanation.trim() || 'Error explanation not available',
            suggestedFixes: suggestedFixes.length > 0 ? suggestedFixes : ['Review the code and error message'],
            severity: diagnostic.severity || vscode.DiagnosticSeverity.Error,
            resources
        };
    }

    /**
     * Generate fix code for an error
     */
    public async generateFix(
        diagnostic: vscode.Diagnostic,
        document: vscode.TextDocument
    ): Promise<string> {
        const code = document.getText(diagnostic.range);
        const context = this.getErrorContext(document, diagnostic.range);

        const prompt = `Fix this ${document.languageId} error:

Error: ${diagnostic.message}

Code with error:
\`\`\`${document.languageId}
${code}
\`\`\`

Provide ONLY the corrected code, no explanation:`;

        try {
            const fix = await this.inference.generateCompletion(prompt, {
                maxTokens: 256,
                temperature: 0.1
            });

            return this.cleanFixCode(fix);
        } catch (error) {
            this.logger.error(`Fix generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Clean generated fix code
     */
    private cleanFixCode(code: string): string {
        let cleaned = code.trim();
        
        // Remove markdown code fences
        cleaned = cleaned.replace(/```[\w]*\n?/g, '');
        
        // Remove common prefixes
        cleaned = cleaned.replace(/^(Here is the fix:?|Fixed code:?)\s*/i, '');
        
        return cleaned.trim();
    }

    /**
     * Explain multiple errors in a file
     */
    public async explainDiagnostics(
        diagnostics: vscode.Diagnostic[],
        document: vscode.TextDocument
    ): Promise<ErrorExplanation[]> {
        const explanations: ErrorExplanation[] = [];

        for (const diagnostic of diagnostics) {
            try {
                const explanation = await this.explainError(diagnostic, document);
                explanations.push(explanation);
            } catch (error) {
                this.logger.error(`Failed to explain diagnostic: ${error}`);
            }
        }

        return explanations;
    }

    /**
     * Get common error patterns for a language
     */
    private getCommonErrorPatterns(languageId: string): Map<RegExp, string> {
        const patterns = new Map<RegExp, string>();

        if (languageId === 'typescript' || languageId === 'javascript') {
            patterns.set(/cannot find name/i, 'Variable or function not defined. Check spelling and imports.');
            patterns.set(/property .* does not exist/i, 'Property doesn\'t exist on this type. Check the object structure.');
            patterns.set(/type .* is not assignable/i, 'Type mismatch. The value doesn\'t match the expected type.');
        } else if (languageId === 'python') {
            patterns.set(/NameError/i, 'Variable not defined. Check spelling and scope.');
            patterns.set(/TypeError/i, 'Wrong type used. Check the types of your variables.');
            patterns.set(/AttributeError/i, 'Object doesn\'t have this attribute. Check the object type.');
        }

        return patterns;
    }

    /**
     * Quick explanation for common errors
     */
    public getQuickExplanation(errorMessage: string, languageId: string): string | null {
        const patterns = this.getCommonErrorPatterns(languageId);

        for (const [pattern, explanation] of patterns) {
            if (pattern.test(errorMessage)) {
                return explanation;
            }
        }

        return null;
    }

    /**
     * Clear explanation cache
     */
    public clearCache(): void {
        this.explanationCache.clear();
        this.logger.info('Explanation cache cleared');
    }
}
