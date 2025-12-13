import * as vscode from 'vscode';
import { Logger } from '@inline/shared/platform/system/logger';

export enum CompilationState {
    IDLE = 'idle',
    COMPILING = 'compiling',
    SUCCESS = 'success',
    FAILED = 'failed'
}

export interface CompilationResult {
    success: boolean;
    duration: number;
    error?: string;
}

export class CompilationManager implements vscode.Disposable {
    private logger: Logger;
    private _currentState: CompilationState = CompilationState.IDLE;
    private _onStateChange = new vscode.EventEmitter<CompilationState>();
    public readonly onStateChange = this._onStateChange.event;

    private buildTaskName: string = 'build'; // Default, should be configurable
    private currentExecution: vscode.TaskExecution | undefined;

    constructor() {
        this.logger = new Logger('CompilationManager');
        
        // Listen for task end events to update state
        vscode.tasks.onDidEndTaskProcess((e) => {
            if (e.execution === this.currentExecution) {
                const success = e.exitCode === 0;
                this.updateState(success ? CompilationState.SUCCESS : CompilationState.FAILED);
                this.currentExecution = undefined;
                this.logger.info(`Compilation finished: ${success ? 'Success' : 'Failed'}`);
            }
        });
    }

    public get currentState(): CompilationState {
        return this._currentState;
    }

    /**
     * Start compilation task
     */
    public async compile(options: { force?: boolean } = {}): Promise<boolean> {
        if (this._currentState === CompilationState.COMPILING && !options.force) {
            this.logger.info('Compilation already directly in progress');
            return false;
        }

        const task = await this.findBuildTask();
        if (!task) {
            this.logger.warn('No build task found');
            return false;
        }

        try {
            this.updateState(CompilationState.COMPILING);
            this.currentExecution = await vscode.tasks.executeTask(task);
            return true;
        } catch (error) {
            this.logger.error('Failed to start compilation', error as Error);
            this.updateState(CompilationState.FAILED);
            return false;
        }
    }

    public async findBuildTask(): Promise<vscode.Task | undefined> {
        const tasks = await vscode.tasks.fetchTasks();
        // 1. Try to find a task explicitly named 'build'
        let buildTask = tasks.find(t => t.name.toLowerCase() === this.buildTaskName);
        
        // 2. If not found, look for a task in the 'build' group
        if (!buildTask) {
            buildTask = tasks.find(t => t.group === vscode.TaskGroup.Build);
        }

        return buildTask;
    }

    private updateState(newState: CompilationState) {
        if (this._currentState !== newState) {
            this._currentState = newState;
            this._onStateChange.fire(newState);
        }
        
        // Auto-reset info states to IDLE after a delay if needed, 
        // but keeping SUCCESS/FAILED allows UI to show result until next action.
    }

    public dispose() {
        this._onStateChange.dispose();
    }
}
