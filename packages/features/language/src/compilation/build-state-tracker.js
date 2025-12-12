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
exports.BuildStateTracker = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("@platform/system/logger");
class BuildStateTracker {
    constructor() {
        // Configurable paths
        this.sourcePatterns = ['**/*.ts', '**/*.cpp', '**/*.c', '**/*.go', '**/*.rs'];
        this.outputPatterns = ['**/out/**', '**/bin/**', '**/dist/**'];
        this.latestSourceTime = 0;
        this.latestBuildTime = 0;
        this._onBuildOutdated = new vscode.EventEmitter();
        this.onBuildOutdated = this._onBuildOutdated.event;
        this.logger = new logger_1.Logger('BuildStateTracker');
        this.startWatching();
    }
    startWatching() {
        // Watch source files
        const watcher = vscode.workspace.createFileSystemWatcher('**/*');
        watcher.onDidChange(uri => this.checkFile(uri));
        watcher.onDidCreate(uri => this.checkFile(uri));
        watcher.onDidDelete(uri => this.checkFile(uri));
        this.fileWatcher = watcher;
    }
    async checkFile(uri) {
        // Ignore node_modules and .git
        if (uri.fsPath.includes('node_modules') || uri.fsPath.includes('.git')) {
            return;
        }
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            const isSource = this.isSourceFile(uri.fsPath);
            const isOutput = this.isOutputFile(uri.fsPath);
            if (isSource) {
                if (stat.mtime > this.latestSourceTime) {
                    this.latestSourceTime = stat.mtime;
                    this.checkOutdatedStatus();
                }
            }
            else if (isOutput) {
                if (stat.mtime > this.latestBuildTime) {
                    this.latestBuildTime = stat.mtime;
                }
            }
        }
        catch (e) {
            // File might have been deleted quickly
        }
    }
    isSourceFile(fsPath) {
        // Simplified check - strictly should use minimatch against patterns
        // For now, checking common extensions
        return /\.(ts|js|cpp|c|go|rs|java|py)$/.test(fsPath);
    }
    isOutputFile(fsPath) {
        // Initial heuristic
        return fsPath.includes('/out/') || fsPath.includes('/dist/') || fsPath.includes('/build/');
    }
    checkOutdatedStatus() {
        // If source is newer than last known build time (plus a small buffer)
        // AND we actually have a build time registered (meaning a build exists)
        if (this.latestBuildTime > 0 && this.latestSourceTime > this.latestBuildTime + 2000) {
            this.logger.info('Build detected as outdated');
            this._onBuildOutdated.fire();
        }
    }
    updateBuildTime() {
        this.latestBuildTime = Date.now();
    }
    isOutdated() {
        return this.latestBuildTime > 0 && this.latestSourceTime > this.latestBuildTime;
    }
    dispose() {
        this.fileWatcher?.dispose();
        this._onBuildOutdated.dispose();
    }
}
exports.BuildStateTracker = BuildStateTracker;
//# sourceMappingURL=build-state-tracker.js.map