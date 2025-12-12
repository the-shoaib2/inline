import * as vscode from 'vscode';
import { CompilationManager } from '@language/compilation/compilation-manager';
import { BuildStateTracker } from '@language/compilation/build-state-tracker';
export declare class CompilationSuggestionProvider implements vscode.CodeActionProvider, vscode.Disposable {
    private compilationManager;
    private buildTracker;
    private statusBarItem;
    private disposables;
    constructor(compilationManager: CompilationManager, buildTracker: BuildStateTracker);
    private updateStatusBar;
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]>;
    dispose(): void;
}
//# sourceMappingURL=compilation-suggestion-provider.d.ts.map