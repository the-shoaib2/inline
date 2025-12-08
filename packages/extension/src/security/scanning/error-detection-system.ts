import * as vscode from 'vscode';
import { ASTParser } from '@language/parsers/ast-parser';

interface UnusedVariable {
    name: string;
    line: number;
    range: vscode.Range;
}

interface DeadCodeBlock {
    type: 'unreachable' | 'unused-function' | 'unused-import';
    range: vscode.Range;
    reason: string;
}

export class ErrorDetectionSystem {
    private astParser: ASTParser;

    constructor() {
        this.astParser = new ASTParser();
    }

    /**
     * Detect unused variables in a document
     */
    async detectUnusedVariables(document: vscode.TextDocument): Promise<UnusedVariable[]> {
        const unused: UnusedVariable[] = [];
        const text = document.getText();
        const languageId = document.languageId;

        // Get all variable declarations
        const declarations = this.extractVariableDeclarations(text, languageId);
        
        for (const decl of declarations) {
            // Check if variable is used anywhere after declaration
            const afterDeclaration = text.substring(decl.endOffset);
            const usageRegex = new RegExp(`\\b${decl.name}\\b`, 'g');
            const matches = afterDeclaration.match(usageRegex);
            
            // If only one match (the declaration itself) or no matches, it's unused
            if (!matches || matches.length === 0) {
                unused.push({
                    name: decl.name,
                    line: decl.line,
                    range: decl.range
                });
            }
        }

        return unused;
    }

    /**
     * Detect dead code blocks
     */
    async detectDeadCode(document: vscode.TextDocument): Promise<DeadCodeBlock[]> {
        const deadCode: DeadCodeBlock[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // Detect unreachable code after return/throw/break/continue
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.match(/^(return|throw|break|continue)\b/)) {
                // Check if there's code after this in the same block
                let j = i + 1;
                while (j < lines.length) {
                    const nextLine = lines[j].trim();
                    
                    // Stop at block end or new block start
                    if (nextLine.startsWith('}') || nextLine.startsWith('function') || 
                        nextLine.startsWith('class') || nextLine.startsWith('if') ||
                        nextLine.startsWith('for') || nextLine.startsWith('while')) {
                        break;
                    }
                    
                    // Found unreachable code
                    if (nextLine.length > 0 && !nextLine.startsWith('//') && !nextLine.startsWith('/*')) {
                        deadCode.push({
                            type: 'unreachable',
                            range: new vscode.Range(j, 0, j, lines[j].length),
                            reason: `Unreachable code after ${line.split(/\s+/)[0]}`
                        });
                    }
                    
                    j++;
                }
            }
        }

        // Detect unused functions
        const unusedFunctions = await this.detectUnusedFunctions(document);
        deadCode.push(...unusedFunctions);

        return deadCode;
    }

    /**
     * Detect unused functions
     */
    private async detectUnusedFunctions(document: vscode.TextDocument): Promise<DeadCodeBlock[]> {
        const unused: DeadCodeBlock[] = [];
        const text = document.getText();
        const languageId = document.languageId;

        // Extract function declarations
        const functionRegex = languageId === 'python' 
            ? /def\s+(\w+)\s*\(/g
            : /function\s+(\w+)\s*\(|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;

        let match;
        while ((match = functionRegex.exec(text)) !== null) {
            const funcName = match[1] || match[2];
            if (!funcName) continue;

            // Check if function is called anywhere
            const usageRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
            const usages = text.match(usageRegex);
            
            // If only one usage (the declaration), it's unused
            if (!usages || usages.length === 1) {
                const line = text.substring(0, match.index).split('\n').length - 1;
                unused.push({
                    type: 'unused-function',
                    range: new vscode.Range(line, 0, line, 100),
                    reason: `Function '${funcName}' is never called`
                });
            }
        }

        return unused;
    }

    /**
     * Extract variable declarations from text
     */
    private extractVariableDeclarations(text: string, languageId: string): Array<{
        name: string;
        line: number;
        range: vscode.Range;
        endOffset: number;
    }> {
        const declarations: Array<any> = [];
        
        if (languageId === 'typescript' || languageId === 'javascript') {
            const regex = /(?:const|let|var)\s+(\w+)\s*[=:]/g;
            let match;
            
            while ((match = regex.exec(text)) !== null) {
                const name = match[1];
                const line = text.substring(0, match.index).split('\n').length - 1;
                const lineText = text.split('\n')[line];
                const charIndex = lineText.indexOf(name);
                
                declarations.push({
                    name,
                    line,
                    range: new vscode.Range(line, charIndex, line, charIndex + name.length),
                    endOffset: match.index + match[0].length
                });
            }
        } else if (languageId === 'python') {
            const regex = /^(\s*)(\w+)\s*=/gm;
            let match;
            
            while ((match = regex.exec(text)) !== null) {
                const name = match[2];
                const line = text.substring(0, match.index).split('\n').length - 1;
                
                declarations.push({
                    name,
                    line,
                    range: new vscode.Range(line, match[1].length, line, match[1].length + name.length),
                    endOffset: match.index + match[0].length
                });
            }
        }

        return declarations;
    }

    /**
     * Create diagnostics for unused variables
     */
    createUnusedVariableDiagnostics(unused: UnusedVariable[]): vscode.Diagnostic[] {
        return unused.map(u => {
            const diagnostic = new vscode.Diagnostic(
                u.range,
                `Variable '${u.name}' is declared but never used`,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.code = 'unused-variable';
            diagnostic.source = 'inline';
            return diagnostic;
        });
    }

    /**
     * Create diagnostics for dead code
     */
    createDeadCodeDiagnostics(deadCode: DeadCodeBlock[]): vscode.Diagnostic[] {
        return deadCode.map(dc => {
            const diagnostic = new vscode.Diagnostic(
                dc.range,
                dc.reason,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.code = dc.type;
            diagnostic.source = 'inline';
            return diagnostic;
        });
    }
}
