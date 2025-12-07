import * as vscode from 'vscode';

/**
 * Auto-Fix Provider
 * Automatically fixes all fixable issues in a file
 */
export class AutoFixProvider {
    
    async fixAllInFile(document: vscode.TextDocument): Promise<vscode.WorkspaceEdit> {
        const edit = new vscode.WorkspaceEdit();
        const fixes: vscode.TextEdit[] = [];

        // Fix common issues
        fixes.push(...this.fixMissingSemicolons(document));
        fixes.push(...this.fixIndentation(document));
        fixes.push(...this.fixTrailingWhitespace(document));
        fixes.push(...this.fixUnusedImports(document));

        fixes.forEach(fix => {
            edit.replace(document.uri, fix.range, fix.newText);
        });

        return edit;
    }

    private fixMissingSemicolons(document: vscode.TextDocument): vscode.TextEdit[] {
        const fixes: vscode.TextEdit[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            if (this.needsSemicolon(line)) {
                const range = new vscode.Range(index, line.length, index, line.length);
                fixes.push(vscode.TextEdit.insert(range.start, ';'));
            }
        });

        return fixes;
    }

    private needsSemicolon(line: string): boolean {
        const trimmed = line.trim();
        return trimmed.length > 0 &&
            !trimmed.endsWith(';') &&
            !trimmed.endsWith('{') &&
            !trimmed.endsWith('}') &&
            !trimmed.endsWith(',') &&
            !trimmed.startsWith('//') &&
            /^(const|let|var|return)\s/.test(trimmed);
    }

    private fixIndentation(document: vscode.TextDocument): vscode.TextEdit[] {
        const fixes: vscode.TextEdit[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        let indentLevel = 0;

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Decrease indent for closing braces
            if (trimmed.startsWith('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            const expectedIndent = '    '.repeat(indentLevel);
            const currentIndent = line.match(/^\s*/)?.[0] || '';

            if (currentIndent !== expectedIndent) {
                const range = new vscode.Range(index, 0, index, currentIndent.length);
                fixes.push(vscode.TextEdit.replace(range, expectedIndent));
            }

            // Increase indent for opening braces
            if (trimmed.endsWith('{')) {
                indentLevel++;
            }
        });

        return fixes;
    }

    private fixTrailingWhitespace(document: vscode.TextDocument): vscode.TextEdit[] {
        const fixes: vscode.TextEdit[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            const match = line.match(/\s+$/);
            if (match) {
                const start = line.length - match[0].length;
                const range = new vscode.Range(index, start, index, line.length);
                fixes.push(vscode.TextEdit.delete(range));
            }
        });

        return fixes;
    }

    private fixUnusedImports(document: vscode.TextDocument): vscode.TextEdit[] {
        const fixes: vscode.TextEdit[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
            if (importMatch) {
                const imports = importMatch[1].split(',').map(i => i.trim());
                const usedImports = imports.filter(imp => {
                    const regex = new RegExp(`\\b${imp}\\b`);
                    return regex.test(text.substring(text.indexOf(line) + line.length));
                });

                if (usedImports.length === 0) {
                    // Remove entire import line
                    const range = new vscode.Range(index, 0, index + 1, 0);
                    fixes.push(vscode.TextEdit.delete(range));
                } else if (usedImports.length < imports.length) {
                    // Update import list
                    const newImport = line.replace(importMatch[1], usedImports.join(', '));
                    const range = new vscode.Range(index, 0, index, line.length);
                    fixes.push(vscode.TextEdit.replace(range, newImport));
                }
            }
        });

        return fixes;
    }
}
