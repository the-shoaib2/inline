import * as vscode from 'vscode';

/**
 * Signature Help Provider
 * Provides parameter hints for functions
 */
export class SignatureHelpProvider implements vscode.SignatureHelpProvider {
    
    provideSignatureHelp(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.SignatureHelpContext
    ): vscode.SignatureHelp | undefined {
        const lineText = document.lineAt(position.line).text;
        const textBefore = lineText.substring(0, position.character);
        
        // Find function call
        const funcMatch = textBefore.match(/(\w+)\s*\([^)]*$/);
        if (!funcMatch) {
            return undefined;
        }

        const funcName = funcMatch[1];
        const signature = this.findFunctionSignature(funcName, document);
        
        if (!signature) {
            return undefined;
        }

        const signatureHelp = new vscode.SignatureHelp();
        signatureHelp.signatures = [signature];
        signatureHelp.activeSignature = 0;
        
        // Determine active parameter
        const paramIndex = this.getActiveParameterIndex(textBefore);
        signatureHelp.activeParameter = paramIndex;

        return signatureHelp;
    }

    private findFunctionSignature(
        funcName: string,
        document: vscode.TextDocument
    ): vscode.SignatureInformation | undefined {
        const text = document.getText();
        
        // Match function declarations
        const patterns = [
            new RegExp(`function\\s+${funcName}\\s*\\(([^)]*)\\)`, 'g'),
            new RegExp(`${funcName}\\s*[:=]\\s*(?:async\\s*)?\\(([^)]*)\\)\\s*=>`, 'g'),
            new RegExp(`def\\s+${funcName}\\s*\\(([^)]*)\\)`, 'g'),
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(text);
            if (match) {
                const params = match[1].split(',').map(p => p.trim()).filter(p => p);
                const label = `${funcName}(${params.join(', ')})`;
                
                const signature = new vscode.SignatureInformation(label);
                signature.parameters = params.map(p => new vscode.ParameterInformation(p));
                
                return signature;
            }
        }

        return undefined;
    }

    private getActiveParameterIndex(text: string): number {
        const lastParen = text.lastIndexOf('(');
        if (lastParen === -1) return 0;
        
        const afterParen = text.substring(lastParen + 1);
        const commas = (afterParen.match(/,/g) || []).length;
        
        return commas;
    }
}
