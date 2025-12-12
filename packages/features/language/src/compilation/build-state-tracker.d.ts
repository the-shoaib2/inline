import * as vscode from 'vscode';
export declare class BuildStateTracker implements vscode.Disposable {
    private logger;
    private fileWatcher;
    private sourcePatterns;
    private outputPatterns;
    private latestSourceTime;
    private latestBuildTime;
    private _onBuildOutdated;
    readonly onBuildOutdated: vscode.Event<void>;
    constructor();
    private startWatching;
    private checkFile;
    private isSourceFile;
    private isOutputFile;
    private checkOutdatedStatus;
    updateBuildTime(): void;
    isOutdated(): boolean;
    dispose(): void;
}
//# sourceMappingURL=build-state-tracker.d.ts.map