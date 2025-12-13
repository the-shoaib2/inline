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
exports.TriggerEngine = void 0;
const vscode = __importStar(require("vscode"));
const compilation_manager_1 = require("@inline/language/compilation/compilation-manager");
const logger_1 = require("@inline/shared/platform/system/logger");
const events_1 = require("@inline/events");
class TriggerEngine {
    constructor(compilationManager, buildTracker, eventBus) {
        this.compilationManager = compilationManager;
        this.buildTracker = buildTracker;
        this.eventBus = eventBus;
        this.disposables = [];
        this.logger = new logger_1.Logger('TriggerEngine');
        this.setupListeners();
    }
    setupListeners() {
        // 1. On Save Trigger
        this.disposables.push(vscode.workspace.onDidSaveTextDocument(async (doc) => {
            const config = vscode.workspace.getConfiguration('inline.compilation');
            if (config.get('autoBuildOnSave', false) && !this.isIgnored(doc)) {
                this.logger.info('Auto-build triggered by save');
                await this.compilationManager.compile();
            }
        }));
        // 2. Idle Trigger (Debounced type handling)
        this.disposables.push(vscode.workspace.onDidChangeTextDocument((e) => {
            const config = vscode.workspace.getConfiguration('inline.compilation');
            if (config.get('backgroundIdleBuild', false) && !this.isIgnored(e.document)) {
                this.handleIdleChange();
            }
        }));
        // 3. Outdated Build Trigger
        this.disposables.push(this.buildTracker.onBuildOutdated(() => {
            const config = vscode.workspace.getConfiguration('inline.compilation');
            if (config.get('suggestOnOutdated', true)) {
                vscode.window.showInformationMessage('Binary is outdated. Rebuild now?', 'Build', 'Ignore').then(selection => {
                    if (selection === 'Build') {
                        this.compilationManager.compile();
                    }
                });
            }
        }));
        // Listen to compilation success to update tracker
        this.disposables.push(this.compilationManager.onStateChange(state => {
            if (state === compilation_manager_1.CompilationState.SUCCESS) {
                this.buildTracker.updateBuildTime();
            }
        }));
        // 4. VCS Integration (warn if committing broken build)
        if (this.eventBus) {
            this.eventBus.subscribe(async () => {
                const config = vscode.workspace.getConfiguration('inline.compilation');
                if (config.get('warnOnBrokenCommit', true)) {
                    if (this.compilationManager.currentState === compilation_manager_1.CompilationState.FAILED) {
                        vscode.window.showWarningMessage('Warning: You just committed code that failed to compile.');
                    }
                    else if (this.buildTracker.isOutdated()) {
                        const selection = await vscode.window.showWarningMessage('Warning: Committed code was not compiled recently.', 'Compile Now', 'Ignore');
                        if (selection === 'Compile Now') {
                            this.compilationManager.compile();
                        }
                    }
                }
            }, { types: [events_1.VCSEventType.COMMIT_CREATED] });
            // 5. Syntax Error Integration (prevent idle builds on broken code)
            this.eventBus.subscribe(async (event) => {
                // If we have syntax errors, we might want to pause idle compilation
                // For now, let's just log it or maybe cancel pending debounced build
                if (this.debounceTimer) {
                    clearTimeout(this.debounceTimer);
                    this.debounceTimer = undefined;
                    this.logger.info('Idle build cancelled due to syntax errors');
                }
            }, { types: [events_1.SyntaxSemanticEventType.SYNTAX_ERROR] });
        }
    }
    handleIdleChange() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        // Wait 5 seconds of idle time
        this.debounceTimer = setTimeout(() => {
            if (this.compilationManager.currentState === compilation_manager_1.CompilationState.IDLE) {
                this.logger.info('Auto-build triggered by idle');
                this.compilationManager.compile();
            }
        }, 5000);
    }
    isIgnored(doc) {
        // Don't auto-compile for non-code files or git files
        return doc.fileName.includes('.git') || doc.languageId === 'plaintext' || doc.languageId === 'log';
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }
}
exports.TriggerEngine = TriggerEngine;
//# sourceMappingURL=trigger-engine.js.map