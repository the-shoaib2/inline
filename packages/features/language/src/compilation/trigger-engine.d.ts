import * as vscode from 'vscode';
import { CompilationManager } from '@inline/language/compilation/compilation-manager';
import { BuildStateTracker } from '@inline/language/compilation/build-state-tracker';
import { EventBus } from '@inline/events';
export declare class TriggerEngine implements vscode.Disposable {
    private compilationManager;
    private buildTracker;
    private eventBus?;
    private logger;
    private disposables;
    private debounceTimer;
    constructor(compilationManager: CompilationManager, buildTracker: BuildStateTracker, eventBus?: EventBus | undefined);
    private setupListeners;
    private handleIdleChange;
    private isIgnored;
    dispose(): void;
}
//# sourceMappingURL=trigger-engine.d.ts.map