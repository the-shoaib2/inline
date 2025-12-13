import * as vscode from 'vscode';
import { CompilationManager, CompilationState } from '@inline/language/compilation/compilation-manager';
import { BuildStateTracker } from '@inline/language/compilation/build-state-tracker';
import { Logger } from '@inline/shared/platform/system/logger';
import { EventBus } from '@inline/events';
import { VCSEventType, SyntaxSemanticEventType } from '@inline/events';

export class TriggerEngine implements vscode.Disposable {
    private logger: Logger;
    private disposables: vscode.Disposable[] = [];
    private debounceTimer: NodeJS.Timeout | undefined;

    constructor(
        private compilationManager: CompilationManager,
        private buildTracker: BuildStateTracker,
        private eventBus?: EventBus
    ) {
        this.logger = new Logger('TriggerEngine');
        this.setupListeners();
    }

    private setupListeners() {
        // 1. On Save Trigger
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(async (doc) => {
                const config = vscode.workspace.getConfiguration('inline.compilation');
                if (config.get('autoBuildOnSave', false) && !this.isIgnored(doc)) {
                    this.logger.info('Auto-build triggered by save');
                    await this.compilationManager.compile();
                }
            })
        );

        // 2. Idle Trigger (Debounced type handling)
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument((e) => {
                const config = vscode.workspace.getConfiguration('inline.compilation');
                if (config.get('backgroundIdleBuild', false) && !this.isIgnored(e.document)) {
                    this.handleIdleChange();
                }
            })
        );

        // 3. Outdated Build Trigger
        this.disposables.push(
            this.buildTracker.onBuildOutdated(() => {
                const config = vscode.workspace.getConfiguration('inline.compilation');
                if (config.get('suggestOnOutdated', true)) {
                    vscode.window.showInformationMessage(
                        'Binary is outdated. Rebuild now?',
                        'Build', 'Ignore'
                    ).then(selection => {
                        if (selection === 'Build') {
                            this.compilationManager.compile();
                        }
                    });
                }
            })
        );
        
        // Listen to compilation success to update tracker
        this.disposables.push(
            this.compilationManager.onStateChange(state => {
                if (state === CompilationState.SUCCESS) {
                    this.buildTracker.updateBuildTime();
                }
            })
        );
        
        // 4. VCS Integration (warn if committing broken build)
        if (this.eventBus) {
            this.eventBus.subscribe(
                async () => {
                    const config = vscode.workspace.getConfiguration('inline.compilation');
                    if (config.get('warnOnBrokenCommit', true)) {
                        if (this.compilationManager.currentState === CompilationState.FAILED) {
                            vscode.window.showWarningMessage('Warning: You just committed code that failed to compile.');
                        } else if (this.buildTracker.isOutdated()) {
                            const selection = await vscode.window.showWarningMessage(
                                'Warning: Committed code was not compiled recently.', 
                                'Compile Now', 'Ignore'
                            );
                            if (selection === 'Compile Now') {
                                this.compilationManager.compile();
                            }
                        }
                    }
                },
                { types: [VCSEventType.COMMIT_CREATED] }
            );

            // 5. Syntax Error Integration (prevent idle builds on broken code)
            this.eventBus.subscribe(
                async (event: any) => {
                    // If we have syntax errors, we might want to pause idle compilation
                    // For now, let's just log it or maybe cancel pending debounced build
                    if (this.debounceTimer) {
                        clearTimeout(this.debounceTimer);
                        this.debounceTimer = undefined;
                        this.logger.info('Idle build cancelled due to syntax errors');
                    }
                },
                { types: [SyntaxSemanticEventType.SYNTAX_ERROR] }
            );
        }

    }


    private handleIdleChange() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Wait 5 seconds of idle time
        this.debounceTimer = setTimeout(() => {
            if (this.compilationManager.currentState === CompilationState.IDLE) {
                this.logger.info('Auto-build triggered by idle');
                this.compilationManager.compile();
            }
        }, 5000);
    }

    private isIgnored(doc: vscode.TextDocument): boolean {
        // Don't auto-compile for non-code files or git files
        return doc.fileName.includes('.git') || doc.languageId === 'plaintext' || doc.languageId === 'log';
    }

    public dispose() {
        this.disposables.forEach(d => d.dispose());
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }
}
