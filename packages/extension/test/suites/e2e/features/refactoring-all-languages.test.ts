/**
 * Refactoring Tests - All Languages
 * Tests refactoring features: Rename, Extract, Inline
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { E2ETestFramework, TestCase, TestSuite } from '../framework/test-framework';
import { LanguageTestGenerator } from '../framework/language-test-generator';
import { FeatureTestMatrix } from '../framework/feature-test-matrix';

export class RefactoringAllLanguagesTest {
    private framework: E2ETestFramework;
    private generator: LanguageTestGenerator;
    private matrix: FeatureTestMatrix;

    constructor(workspacePath: string, languagesJsonPath: string) {
        this.framework = new E2ETestFramework(workspacePath);
        this.generator = new LanguageTestGenerator(languagesJsonPath);
        this.matrix = new FeatureTestMatrix(languagesJsonPath);
    }

    /**
     * Generate test suite for Rename Symbol
     */
    generateRenameTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('refactor-rename');

        for (const expectation of expectations) {
            tests.push({
                name: `Rename Symbol - ${expectation.language}`,
                language: expectation.language,
                feature: 'refactor-rename',
                
                setup: async () => {
                   const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `rename${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'rename');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    const position = new vscode.Position(0, 5); // 'oldName'
                    
                    // Trigger rename
                    // We can't easily simulate the input box for rename
                    // But we can check if the rename provider is available and maybe mock the rename
                    // For E2E without UI it's tricky. We'll use WorkspaceEdit via provider if possible
                    // Or we just check provider availability for now as a proxy, 
                    // or use `vscode.commands.executeCommand('vscode.executeDocumentRenameProvider', ...)`
                     
                    const workspaceEdit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
                        'vscode.executeDocumentRenameProvider',
                        editor.document.uri,
                        position,
                        'newName'
                    );

                    if (workspaceEdit) {
                         await vscode.workspace.applyEdit(workspaceEdit);
                    }
                },
                
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;
                    
                    const text = editor.document.getText();
                    return text.includes('newName') && !text.includes('oldName');
                }
            });
        }

        return { name: 'Rename Symbol - All Languages', tests };
    }

    // Extract variable/function tests are harder to automate without UI interaction
    // We can simulate them if we have custom commands, or check code actions
    
    async runAllTests(): Promise<void> {
        const suites = [
            this.generateRenameTests()
            // Add others when feasible
        ];

        console.log('Running refactoring tests for all languages...');
        await this.framework.runSuitesParallel(suites, 3);

        const stats = this.framework.getStatistics();
        console.log('\n=== Refactoring Test Results ===');
        console.log(`Total: ${stats.total}`);
        console.log(`Passed: ${stats.passed}`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`Pass Rate: ${stats.passRate.toFixed(2)}%`);

        await this.framework.saveReport(
            path.join(this.framework['testWorkspace'], 'refactoring-test-report.html')
        );
    }

    private getExtension(language: string): string {
         const extensions: Record<string, string> = {
            'typescript': '.ts',
            'javascript': '.js',
            'python': '.py',
            'java': '.java',
            'go': '.go',
            'rust': '.rs',
            'cpp': '.cpp',
            'c': '.c'
        };
        return extensions[language] || `.${language}`;
    }

    private async createTestFile(filePath: string, language: string, testType: string): Promise<void> {
        const content = this.getTestContent(language, testType);
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        
        const uri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
    }

    private getTestContent(language: string, testType: string): string {
         const templates: Record<string, Record<string, string>> = {
            'typescript': {
                'rename': 'let oldName = 1;\nconsole.log(oldName);'
            },
            'python': {
                'rename': 'oldName = 1\nprint(oldName)'
            },
            'java': {
                'rename': 'class Test { int oldName = 1; void test() { System.out.println(oldName); } }'
            }
        };

        return templates[language]?.[testType] || '// Test content placeholder';
    }
}
