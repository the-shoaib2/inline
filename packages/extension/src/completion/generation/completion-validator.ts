import * as vscode from 'vscode';
import { ASTParser } from '@language/parsers/ast-parser';
import { Logger } from '@platform/system/logger';

/**
 * Complete validation report for a code completion.
 * Includes errors, warnings, and suggested fixes.
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: CodeFix[];
    canAutoFix: boolean;
}

/**
 * Syntax or semantic error found during validation.
 */
export interface ValidationError {
    message: string;
    line: number;
    column: number;
    severity: 'error' | 'warning';
    code?: string;
}

/**
 * Non-critical issue found during validation.
 */
export interface ValidationWarning {
    message: string;
    line: number;
    column: number;
}

/**
 * Suggested code fix with edit ranges.
 */
export interface CodeFix {
    description: string;
    edits: Array<{
        range: vscode.Range;
        newText: string;
    }>;
}

/**
 * Validates code completions for syntax errors and issues.
 *
 * Responsibilities:
 * - Parse completion with surrounding context
 * - Detect syntax errors and semantic issues
 * - Suggest fixes where possible
 * - Provide line/column information for errors
 */
export class CompletionValidator {
    private logger: Logger;
    private astParser: ASTParser;

    constructor() {
        this.logger = new Logger('CompletionValidator');
        this.astParser = new ASTParser();
    }

    /**
     * Validate a code completion against syntax rules.
     * Combines completion with prefix/suffix context for accurate parsing.
     *
     * @param completion The generated code to validate
     * @param language Programming language for syntax rules
     * @param context Optional prefix/suffix context
     * @returns Validation report with errors and suggestions
     */
    public async validateCompletion(
        completion: string,
        language: string,
        context?: {
            prefix?: string;
            suffix?: string;
        }
    ): Promise<ValidationResult> {
        try {
            // Reconstruct full code for accurate parsing
            const fullCode = this.buildFullCode(completion, context);

            // Parse AST to detect syntax errors
            const parseResult = this.astParser.parse(fullCode, language);

            if (!parseResult) {
                return {
                    valid: true,
                    errors: [],
                    warnings: [],
                    suggestions: [],
                    canAutoFix: false
                };
            }

            // Extract errors
            const errors = this.extractErrors(parseResult, completion.split('\n').length);
            const warnings = this.extractWarnings(parseResult);

            // Generate fixes
            const suggestions = this.generateFixes(errors, completion, language);

            return {
                valid: errors.length === 0,
                errors,
                warnings,
                suggestions,
                canAutoFix: suggestions.length > 0
            };
        } catch (error) {
            this.logger.error('Validation failed:', error as Error);
            return {
                valid: false,
                errors: [{
                    message: 'Validation failed: ' + (error as Error).message,
                    line: 0,
                    column: 0,
                    severity: 'error'
                }],
                warnings: [],
                suggestions: [],
                canAutoFix: false
            };
        }
    }

    /**
     * Build full code for validation
     */
    private buildFullCode(completion: string, context?: { prefix?: string; suffix?: string }): string {
        if (!context) {
            return completion;
        }

        const prefix = context.prefix || '';
        const suffix = context.suffix || '';

        return `${prefix}${completion}${suffix}`;
    }

    /**
     * Extract errors from parse result
     */
    private extractErrors(parseResult: any, completionLineCount: number): ValidationError[] {
        const errors: ValidationError[] = [];

        if (parseResult.errors && Array.isArray(parseResult.errors)) {
            for (const error of parseResult.errors) {
                // Only include errors in the completion range
                if (error.line && error.line <= completionLineCount) {
                    errors.push({
                        message: error.message || 'Syntax error',
                        line: error.line,
                        column: error.column || 0,
                        severity: 'error',
                        code: error.code
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Extract warnings from parse result
     */
    private extractWarnings(parseResult: any): ValidationWarning[] {
        const warnings: ValidationWarning[] = [];

        if (parseResult.warnings && Array.isArray(parseResult.warnings)) {
            for (const warning of parseResult.warnings) {
                warnings.push({
                    message: warning.message || 'Warning',
                    line: warning.line || 0,
                    column: warning.column || 0
                });
            }
        }

        return warnings;
    }

    /**
     * Generate fix suggestions
     */
    private generateFixes(errors: ValidationError[], completion: string, language: string): CodeFix[] {
        const fixes: CodeFix[] = [];

        for (const error of errors) {
            const fix = this.generateFixForError(error, completion, language);
            if (fix) {
                fixes.push(fix);
            }
        }

        return fixes;
    }

    /**
     * Generate fix for a specific error
     */
    private generateFixForError(error: ValidationError, completion: string, language: string): CodeFix | null {
        const lines = completion.split('\n');

        // Common fixes
        if (error.message.includes('missing semicolon')) {
            const line = lines[error.line - 1];
            if (line && !line.trim().endsWith(';')) {
                return {
                    description: 'Add missing semicolon',
                    edits: [{
                        range: new vscode.Range(
                            error.line - 1,
                            line.length,
                            error.line - 1,
                            line.length
                        ),
                        newText: ';'
                    }]
                };
            }
        }

        // Missing closing brace
        if (error.message.includes('missing }') || error.message.includes('expected }')) {
            return {
                description: 'Add missing closing brace',
                edits: [{
                    range: new vscode.Range(
                        lines.length,
                        0,
                        lines.length,
                        0
                    ),
                    newText: '\n}'
                }]
            };
        }

        // Missing closing parenthesis
        if (error.message.includes('missing )') || error.message.includes('expected )')) {
            const line = lines[error.line - 1];
            if (line) {
                return {
                    description: 'Add missing closing parenthesis',
                    edits: [{
                        range: new vscode.Range(
                            error.line - 1,
                            line.length,
                            error.line - 1,
                            line.length
                        ),
                        newText: ')'
                    }]
                };
            }
        }

        return null;
    }

    /**
     * Quick syntax check (lightweight)
     */
    public quickCheck(completion: string, language: string): boolean {
        try {
            // Basic bracket matching
            const openBraces = (completion.match(/{/g) || []).length;
            const closeBraces = (completion.match(/}/g) || []).length;
            const openParens = (completion.match(/\(/g) || []).length;
            const closeParens = (completion.match(/\)/g) || []).length;
            const openBrackets = (completion.match(/\[/g) || []).length;
            const closeBrackets = (completion.match(/\]/g) || []).length;

            // Check balance
            if (openBraces !== closeBraces) return false;
            if (openParens !== closeParens) return false;
            if (openBrackets !== closeBrackets) return false;

            // Language-specific checks
            if (language === 'typescript' || language === 'javascript') {
                // Check for unterminated strings
                const singleQuotes = (completion.match(/'/g) || []).length;
                const doubleQuotes = (completion.match(/"/g) || []).length;
                const backticks = (completion.match(/`/g) || []).length;

                if (singleQuotes % 2 !== 0) return false;
                if (doubleQuotes % 2 !== 0) return false;
                if (backticks % 2 !== 0) return false;
            }

            return true;
        } catch (error) {
            this.logger.error('Quick check failed:', error as Error);
            return true; // Assume valid if check fails
        }
    }
}
