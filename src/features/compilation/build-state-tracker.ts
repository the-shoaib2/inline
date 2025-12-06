import * as vscode from 'vscode';
import * as path from 'path';
import { Logger } from '../../system/logger';

export class BuildStateTracker implements vscode.Disposable {
    private logger: Logger;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    
    // Configurable paths
    private sourcePatterns: string[] = ['**/*.ts', '**/*.cpp', '**/*.c', '**/*.go', '**/*.rs'];
    private outputPatterns: string[] = ['**/out/**', '**/bin/**', '**/dist/**'];
    
    private latestSourceTime: number = 0;
    private latestBuildTime: number = 0;

    private _onBuildOutdated = new vscode.EventEmitter<void>();
    public readonly onBuildOutdated = this._onBuildOutdated.event;

    constructor() {
        this.logger = new Logger('BuildStateTracker');
        this.startWatching();
    }

    private startWatching() {
        // Watch source files
        const watcher = vscode.workspace.createFileSystemWatcher('**/*');
        watcher.onDidChange(uri => this.checkFile(uri));
        watcher.onDidCreate(uri => this.checkFile(uri));
        watcher.onDidDelete(uri => this.checkFile(uri));
        
        this.fileWatcher = watcher;
    }

    private async checkFile(uri: vscode.Uri) {
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
            } else if (isOutput) {
                if (stat.mtime > this.latestBuildTime) {
                    this.latestBuildTime = stat.mtime;
                }
            }
        } catch (e) {
            // File might have been deleted quickly
        }
    }

    private isSourceFile(fsPath: string): boolean {
        // Simplified check - strictly should use minimatch against patterns
        // For now, checking common extensions
        return /\.(ts|js|cpp|c|go|rs|java|py)$/.test(fsPath);
    }

    private isOutputFile(fsPath: string): boolean {
        // Initial heuristic
        return fsPath.includes('/out/') || fsPath.includes('/dist/') || fsPath.includes('/build/');
    }

    private checkOutdatedStatus() {
        // If source is newer than last known build time (plus a small buffer)
        // AND we actually have a build time registered (meaning a build exists)
        if (this.latestBuildTime > 0 && this.latestSourceTime > this.latestBuildTime + 2000) {
            this.logger.info('Build detected as outdated');
            this._onBuildOutdated.fire();
        }
    }

    public updateBuildTime() {
        this.latestBuildTime = Date.now();
    }

    public isOutdated(): boolean {
        return this.latestBuildTime > 0 && this.latestSourceTime > this.latestBuildTime;
    }

    public dispose() {
        this.fileWatcher?.dispose();
        this._onBuildOutdated.dispose();
    }
}
