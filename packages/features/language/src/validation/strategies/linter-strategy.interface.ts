import * as vscode from 'vscode';

export interface LinterStrategy {
    supports(languageId: string): boolean;
    checkNamingConventions(text: string, document: vscode.TextDocument): vscode.Diagnostic[];
    checkBestPractices(text: string, document: vscode.TextDocument): vscode.Diagnostic[];
}
