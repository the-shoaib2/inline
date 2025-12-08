import * as vscode from 'vscode';
import * as path from 'path';
import { Logger } from '@platform/system/logger';

export class DependencyChecker implements vscode.Disposable {
    private logger: Logger;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    
    private lastPackageJsonTime: number = 0;
    private lastNodeModulesTime: number = 0;

    constructor() {
        this.logger = new Logger('DependencyChecker');
        this.startWatching();
        this.checkInitialState();
    }

    private startWatching() {
        const watcher = vscode.workspace.createFileSystemWatcher('**/package.json');
        watcher.onDidChange(uri => this.checkDependencies(uri));
        watcher.onDidCreate(uri => this.checkDependencies(uri));
        this.fileWatcher = watcher;
    }

    private async checkInitialState() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

        for (const folder of workspaceFolders) {
            const packageJson = vscode.Uri.file(path.join(folder.uri.fsPath, 'package.json'));
            this.checkDependencies(packageJson);
        }
    }

    private async checkDependencies(uri: vscode.Uri) {
        if (uri.fsPath.includes('node_modules')) return;

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
            } catch (e) {
                // node_modules does not exist
                this.suggestInstall(uri, true);
            }

        } catch (e) {
            // No package.json
        }
    }

    private async suggestInstall(uri: vscode.Uri, isMissing: boolean = false) {
        const message = isMissing 
            ? 'Dependencies not installed. Run install?' 
            : 'Dependencies changed. Update now?';

        const selection = await vscode.window.showWarningMessage(message, 'Install', 'Ignore');
        
        if (selection === 'Install') {
            this.runInstall(uri);
        }
    }

    private async runInstall(uri: vscode.Uri) {
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        if (!folder) return;

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
        } else if (hasYarn) {
            terminal.sendText('yarn install');
        } else {
            terminal.sendText('npm install');
        }
    }

    private async fileExists(base: vscode.Uri, name: string): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.joinPath(base, name));
            return true;
        } catch {
            return false;
        }
    }

    public dispose() {
        this.fileWatcher?.dispose();
    }
}
