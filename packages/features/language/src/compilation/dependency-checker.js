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
exports.DependencyChecker = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const logger_1 = require("@platform/system/logger");
class DependencyChecker {
    constructor() {
        this.lastPackageJsonTime = 0;
        this.lastNodeModulesTime = 0;
        this.logger = new logger_1.Logger('DependencyChecker');
        this.startWatching();
        this.checkInitialState();
    }
    startWatching() {
        const watcher = vscode.workspace.createFileSystemWatcher('**/package.json');
        watcher.onDidChange(uri => this.checkDependencies(uri));
        watcher.onDidCreate(uri => this.checkDependencies(uri));
        this.fileWatcher = watcher;
    }
    async checkInitialState() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return;
        for (const folder of workspaceFolders) {
            const packageJson = vscode.Uri.file(path.join(folder.uri.fsPath, 'package.json'));
            this.checkDependencies(packageJson);
        }
    }
    async checkDependencies(uri) {
        if (uri.fsPath.includes('node_modules'))
            return;
        try {
            const packageStat = await vscode.workspace.fs.stat(uri);
            this.lastPackageJsonTime = packageStat.mtime;
            const nodeModulesPath = path.join(path.dirname(uri.fsPath), 'node_modules');
            const nodeModulesUri = vscode.Uri.file(nodeModulesPath);
            try {
                const modulesStat = await vscode.workspace.fs.stat(nodeModulesUri);
                this.lastNodeModulesTime = modulesStat.mtime;
                if (this.lastPackageJsonTime > this.lastNodeModulesTime) {
                    this.suggestInstall(uri);
                }
            }
            catch (e) {
                // node_modules does not exist
                this.suggestInstall(uri, true);
            }
        }
        catch (e) {
            // No package.json
        }
    }
    async suggestInstall(uri, isMissing = false) {
        const message = isMissing
            ? 'Dependencies not installed. Run install?'
            : 'Dependencies changed. Update now?';
        const selection = await vscode.window.showWarningMessage(message, 'Install', 'Ignore');
        if (selection === 'Install') {
            this.runInstall(uri);
        }
    }
    async runInstall(uri) {
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        if (!folder)
            return;
        const terminal = vscode.window.createTerminal({
            name: 'Dependency Install',
            cwd: folder.uri.fsPath
        });
        terminal.show();
        // Simple heuristic: check for pnpm-lock, yarn.lock, or default to npm
        // In a real app we would read the lockfiles.
        // For inline ext we know it uses pnpm, but let's be generic or default to npm if unk.
        // Actually, we can check for lock files.
        const hasPnpm = await this.fileExists(folder.uri, 'pnpm-lock.yaml');
        const hasYarn = await this.fileExists(folder.uri, 'yarn.lock');
        if (hasPnpm) {
            terminal.sendText('pnpm install');
        }
        else if (hasYarn) {
            terminal.sendText('yarn install');
        }
        else {
            terminal.sendText('npm install');
        }
    }
    async fileExists(base, name) {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.joinPath(base, name));
            return true;
        }
        catch {
            return false;
        }
    }
    dispose() {
        this.fileWatcher?.dispose();
    }
}
exports.DependencyChecker = DependencyChecker;
//# sourceMappingURL=dependency-checker.js.map