import * as vscode from 'vscode';
import { LinterRegistry } from './linter-registry';
import { TypeScriptLinterStrategy } from './strategies/typescript-linter-strategy';
import { PythonLinterStrategy } from './strategies/python-linter-strategy';

/**
 * Linter
 * Checks code style and best practices using Strategy Pattern
 */
export class Linter {
    private registry: LinterRegistry;

    constructor() {
        this.registry = LinterRegistry.getInstance();
        this.registerDefaultStrategies();
    }

    private registerDefaultStrategies() {
        // Register default strategies if not already registered
        // Ideally these should be registered at package activation, but for safety:
        this.registry.register(new TypeScriptLinterStrategy());
        this.registry.register(new PythonLinterStrategy());
    }

    async lint(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const languageId = document.languageId;
        const strategy = this.registry.getStrategy(languageId);

        // Common linting rules (language agnostic)
        diagnostics.push(...this.checkLineLength(text, document));
        diagnostics.push(...this.checkComplexity(text, document));

        // Language specific rules via Strategy
        if (strategy) {
            diagnostics.push(...strategy.checkNamingConventions(text, document));
            diagnostics.push(...strategy.checkBestPractices(text, document));
        }

        return diagnostics;
    }

    private checkLineLength(text: string, document: vscode.TextDocument, maxLength: number = 120): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            if (line.length > maxLength) {
                const range = new vscode.Range(index, maxLength, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `Line exceeds maximum length of ${maxLength} characters`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        });

        return diagnostics;
    }

    private checkComplexity(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');
        let functionStart = -1;
        let complexity = 0;

        lines.forEach((line, index) => {
            if (/function\s+\w+|=>\s*{/.test(line)) {
                functionStart = index;
                complexity = 1;
            }

            if (functionStart !== -1) {
                // Count complexity indicators
                if (/\b(if|else|for|while|case|catch|\?|&&|\|\|)\b/.test(line)) {
                    complexity++;
                }

                if (line.includes('}') && functionStart !== -1) {
                    if (complexity > 10) {
                        const range = new vscode.Range(functionStart, 0, index, line.length);
                        diagnostics.push(new vscode.Diagnostic(
                            range,
                            `Function has cyclomatic complexity of ${complexity} (threshold: 10)`,
                            vscode.DiagnosticSeverity.Warning
                        ));
                    }
                    functionStart = -1;
                }
            }
        });

        return diagnostics;
    }
}

