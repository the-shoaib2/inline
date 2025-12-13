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
exports.CompilationSuggestionProvider = void 0;
const vscode = __importStar(require("vscode"));
const compilation_manager_1 = require("@inline/language/compilation/compilation-manager");
class CompilationSuggestionProvider {
    constructor(compilationManager, buildTracker) {
        this.compilationManager = compilationManager;
        this.buildTracker = buildTracker;
        this.disposables = [];
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'inline.triggerBuild';
        this.updateStatusBar(compilation_manager_1.CompilationState.IDLE);
        this.statusBarItem.show();
        // Listen for state changes
        this.disposables.push(this.compilationManager.onStateChange(state => this.updateStatusBar(state)));
        this.disposables.push(this.buildTracker.onBuildOutdated(() => {
            this.statusBarItem.text = '$(alert) Build Outdated';
            this.statusBarItem.tooltip = 'Binary is older than source. Click to rebuild.';
            this.statusBarItem.color = new vscode.ThemeColor('errorForeground');
        }));
    }
    updateStatusBar(state) {
        switch (state) {
            case compilation_manager_1.CompilationState.IDLE:
                this.statusBarItem.text = '$(check) Build Ready';
                this.statusBarItem.tooltip = 'Click to run build';
                this.statusBarItem.color = undefined; // Default
                break;
            case compilation_manager_1.CompilationState.COMPILING:
                this.statusBarItem.text = '$(sync~spin) Building...';
                this.statusBarItem.tooltip = 'Build in progress';
                this.statusBarItem.color = undefined;
                break;
            case compilation_manager_1.CompilationState.SUCCESS:
                this.statusBarItem.text = '$(check) Build Success';
                this.statusBarItem.tooltip = 'Last build successful';
                this.statusBarItem.color = undefined;
                break;
            case compilation_manager_1.CompilationState.FAILED:
                this.statusBarItem.text = '$(error) Build Failed';
                this.statusBarItem.tooltip = 'Last build failed. Click to retry.';
                this.statusBarItem.color = new vscode.ThemeColor('errorForeground');
                break;
        }
    }
    provideCodeActions(document, range) {
        // If we detect the file is modified but not compiled, offer a quick fix
        if (this.buildTracker.isOutdated()) {
            const fix = new vscode.CodeAction('Rebuild Project', vscode.CodeActionKind.QuickFix);
            fix.command = { command: 'inline.triggerBuild', title: 'Rebuild Project' };
            fix.isPreferred = true;
            return [fix];
        }
        return [];
    }
    dispose() {
        this.statusBarItem.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}
exports.CompilationSuggestionProvider = CompilationSuggestionProvider;
//# sourceMappingURL=compilation-suggestion-provider.js.map