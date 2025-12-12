import * as vscode from 'vscode';

export interface CompletionContext {
    triggerKind: vscode.InlineCompletionTriggerKind;
    selectedCompletionInfo?: vscode.SelectedCompletionInfo;
}
