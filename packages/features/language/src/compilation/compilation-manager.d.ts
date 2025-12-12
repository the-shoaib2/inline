import * as vscode from 'vscode';
export declare enum CompilationState {
    IDLE = "idle",
    COMPILING = "compiling",
    SUCCESS = "success",
    FAILED = "failed"
}
export interface CompilationResult {
    success: boolean;
    duration: number;
    error?: string;
}
export declare class CompilationManager implements vscode.Disposable {
    private logger;
    private _currentState;
    private _onStateChange;
    readonly onStateChange: vscode.Event<CompilationState>;
    private buildTaskName;
    private currentExecution;
    constructor();
    get currentState(): CompilationState;
    /**
     * Start compilation task
     */
    compile(options?: {
        force?: boolean;
    }): Promise<boolean>;
    findBuildTask(): Promise<vscode.Task | undefined>;
    private updateState;
    dispose(): void;
}
//# sourceMappingURL=compilation-manager.d.ts.map