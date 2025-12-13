import * as vscode from 'vscode';
import { CompilationManager, CompilationState } from '@inline/language/compilation/compilation-manager';
import { BuildStateTracker } from '@inline/language/compilation/build-state-tracker';

export class CompilationSuggestionProvider implements vscode.CodeActionProvider, vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];

    constructor(
        private compilationManager: CompilationManager,
        private buildTracker: BuildStateTracker
    ) {
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'inline.triggerBuild';
        this.updateStatusBar(CompilationState.IDLE);
        this.statusBarItem.show();

        // Listen for state changes
        this.disposables.push(
            this.compilationManager.onStateChange(state => this.updateStatusBar(state))
        );
        
        this.disposables.push(
            this.buildTracker.onBuildOutdated(() => {
                this.statusBarItem.text = '$(alert) Build Outdated';
                this.statusBarItem.tooltip = 'Binary is older than source. Click to rebuild.';
                this.statusBarItem.color = new vscode.ThemeColor('errorForeground');
            })
        );
    }

    private updateStatusBar(state: CompilationState) {
        switch (state) {
            case CompilationState.IDLE:
                this.statusBarItem.text = '$(check) Build Ready';
                this.statusBarItem.tooltip = 'Click to run build';
                this.statusBarItem.color = undefined; // Default
                break;
            case CompilationState.COMPILING:
                this.statusBarItem.text = '$(sync~spin) Building...';
                this.statusBarItem.tooltip = 'Build in progress';
                this.statusBarItem.color = undefined;
                break;
            case CompilationState.SUCCESS:
                this.statusBarItem.text = '$(check) Build Success';
                this.statusBarItem.tooltip = 'Last build successful';
                this.statusBarItem.color = undefined;
                break;
            case CompilationState.FAILED:
                this.statusBarItem.text = '$(error) Build Failed';
                this.statusBarItem.tooltip = 'Last build failed. Click to retry.';
                this.statusBarItem.color = new vscode.ThemeColor('errorForeground');
                break;
        }
    }

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
        // If we detect the file is modified but not compiled, offer a quick fix
        if (this.buildTracker.isOutdated()) {
            const fix = new vscode.CodeAction('Rebuild Project', vscode.CodeActionKind.QuickFix);
            fix.command = { command: 'inline.triggerBuild', title: 'Rebuild Project' };
            fix.isPreferred = true;
            return [fix];
        }
        return [];
    }

    public dispose() {
        this.statusBarItem.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}
