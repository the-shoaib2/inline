import * as vscode from 'vscode';

/**
 * Semantic Validator
 * Validates semantic errors in code
 */
export class SemanticValidator {
    
    async validateSemantics(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        // Check for unreachable code
        diagnostics.push(...this.findUnreachableCode(text, document));
        
        // Check for duplicate declarations
        diagnostics.push(...this.findDuplicateDeclarations(text, document));
        
        // Check for unused parameters
        diagnostics.push(...this.findUnusedParameters(text, document));

        return diagnostics;
    }

    private findUnreachableCode(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith('return') || line.startsWith('throw')) {
                // Check if next non-empty line is not a closing brace
                let nextIndex = i + 1;
                while (nextIndex < lines.length && !lines[nextIndex].trim()) {
                    nextIndex++;
                }
                
                if (nextIndex < lines.length && !lines[nextIndex].trim().startsWith('}')) {
                    const range = new vscode.Range(nextIndex, 0, nextIndex, lines[nextIndex].length);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        'Unreachable code detected',
                        vscode.DiagnosticSeverity.Warning
                    ));
                }
            }
        }

        return diagnostics;
    }

    private findDuplicateDeclarations(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const declarations = new Map<string, number>();
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            const match = line.match(/(?:const|let|var|function|class)\s+(\w+)/);
            if (match) {
                const name = match[1];
                if (declarations.has(name)) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        `Duplicate declaration of '${name}'`,
                        vscode.DiagnosticSeverity.Error
                    ));
                } else {
                    declarations.set(name, index);
                }
            }
        });

        return diagnostics;
    }

    private findUnusedParameters(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            const funcMatch = line.match(/function\s+\w+\s*\(([^)]+)\)/);
            if (funcMatch) {
                const params = funcMatch[1].split(',').map(p => p.trim().split(/[:\s]/)[0]);
                
                // Check if parameters are used in function body (simple check)
                const functionBody = text.substring(text.indexOf(line));
                params.forEach(param => {
                    if (param && !new RegExp(`\\b${param}\\b`).test(functionBody.substring(line.length))) {
                        const range = new vscode.Range(index, 0, index, line.length);
                        diagnostics.push(new vscode.Diagnostic(
                            range,
                            `Parameter '${param}' is never used`,
                            vscode.DiagnosticSeverity.Hint
                        ));
                    }
                });
            }
        });

        return diagnostics;
    }
}
