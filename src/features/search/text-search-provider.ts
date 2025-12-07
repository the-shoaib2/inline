import * as vscode from 'vscode';

/**
 * Text Search Provider
 * Enhanced find/replace functionality
 */
export class TextSearchProvider {
    
    async findInFiles(
        query: string,
        options: {
            caseSensitive?: boolean;
            wholeWord?: boolean;
            regex?: boolean;
            include?: string;
            exclude?: string;
        } = {}
    ): Promise<Array<{ file: string; line: number; column: number; text: string }>> {
        const results: Array<{ file: string; line: number; column: number; text: string }> = [];
        
        const files = await vscode.workspace.findFiles(
            options.include || '**/*',
            options.exclude || '**/node_modules/**'
        );

        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const matches = this.searchInDocument(document, query, options);
                results.push(...matches.map(m => ({
                    file: file.fsPath,
                    line: m.line,
                    column: m.column,
                    text: m.text
                })));
            } catch (error) {
                // Skip files that can't be opened
            }
        }

        return results;
    }

    private searchInDocument(
        document: vscode.TextDocument,
        query: string,
        options: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean }
    ): Array<{ line: number; column: number; text: string }> {
        const results: Array<{ line: number; column: number; text: string }> = [];
        const text = document.getText();
        const lines = text.split('\n');

        let searchRegex: RegExp;
        if (options.regex) {
            searchRegex = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
        } else {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = options.wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
            searchRegex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
        }

        lines.forEach((line, lineIndex) => {
            let match;
            while ((match = searchRegex.exec(line)) !== null) {
                results.push({
                    line: lineIndex + 1,
                    column: match.index + 1,
                    text: line
                });
            }
        });

        return results;
    }

    async replaceInFiles(
        query: string,
        replacement: string,
        options: {
            caseSensitive?: boolean;
            wholeWord?: boolean;
            regex?: boolean;
            include?: string;
            exclude?: string;
        } = {}
    ): Promise<number> {
        let replacementCount = 0;
        const files = await vscode.workspace.findFiles(
            options.include || '**/*',
            options.exclude || '**/node_modules/**'
        );

        const edit = new vscode.WorkspaceEdit();

        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const edits = this.getReplaceEdits(document, query, replacement, options);
                
                edits.forEach(e => edit.replace(file, e.range, e.newText));
                replacementCount += edits.length;
            } catch (error) {
                // Skip files that can't be opened
            }
        }

        await vscode.workspace.applyEdit(edit);
        return replacementCount;
    }

    private getReplaceEdits(
        document: vscode.TextDocument,
        query: string,
        replacement: string,
        options: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean }
    ): vscode.TextEdit[] {
        const edits: vscode.TextEdit[] = [];
        const text = document.getText();

        let searchRegex: RegExp;
        if (options.regex) {
            searchRegex = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
        } else {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = options.wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
            searchRegex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
        }

        let match;
        while ((match = searchRegex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            edits.push(vscode.TextEdit.replace(range, replacement));
        }

        return edits;
    }
}
