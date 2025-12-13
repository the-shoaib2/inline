"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilationManager = exports.CompilationState = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("@inline/shared/platform/system/logger");
var CompilationState;
(function (CompilationState) {
    CompilationState["IDLE"] = "idle";
    CompilationState["COMPILING"] = "compiling";
    CompilationState["SUCCESS"] = "success";
    CompilationState["FAILED"] = "failed";
})(CompilationState || (exports.CompilationState = CompilationState = {}));
class CompilationManager {
    constructor() {
        this._currentState = CompilationState.IDLE;
        this._onStateChange = new vscode.EventEmitter();
        this.onStateChange = this._onStateChange.event;
        this.buildTaskName = 'build'; // Default, should be configurable
        this.logger = new logger_1.Logger('CompilationManager');
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
    get currentState() {
        return this._currentState;
    }
    /**
     * Start compilation task
     */
    async compile(options = {}) {
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
        }
        catch (error) {
            this.logger.error('Failed to start compilation', error);
            this.updateState(CompilationState.FAILED);
            return false;
        }
    }
    async findBuildTask() {
        const tasks = await vscode.tasks.fetchTasks();
        // 1. Try to find a task explicitly named 'build'
        let buildTask = tasks.find(t => t.name.toLowerCase() === this.buildTaskName);
        // 2. If not found, look for a task in the 'build' group
        if (!buildTask) {
            buildTask = tasks.find(t => t.group === vscode.TaskGroup.Build);
        }
        return buildTask;
    }
    updateState(newState) {
        if (this._currentState !== newState) {
            this._currentState = newState;
            this._onStateChange.fire(newState);
        }
        // Auto-reset info states to IDLE after a delay if needed, 
        // but keeping SUCCESS/FAILED allows UI to show result until next action.
    }
    dispose() {
        this._onStateChange.dispose();
    }
}
exports.CompilationManager = CompilationManager;
//# sourceMappingURL=compilation-manager.js.map