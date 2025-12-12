import * as vscode from 'vscode';
export declare class DependencyChecker implements vscode.Disposable {
    private logger;
    private fileWatcher;
    private lastPackageJsonTime;
    private lastNodeModulesTime;
    constructor();
    private startWatching;
    private checkInitialState;
    private checkDependencies;
    private suggestInstall;
    private runInstall;
    private fileExists;
    dispose(): void;
}
//# sourceMappingURL=dependency-checker.d.ts.map