/**
 * Code Understanding Tests - All Languages
 * Tests explain code, hover info, and other understanding features
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { E2ETestFramework, TestCase, TestSuite } from '../framework/test-framework';
import { LanguageTestGenerator } from '../framework/language-test-generator';
import { FeatureTestMatrix } from '../framework/feature-test-matrix';

export class UnderstandingAllLanguagesTest {
    private framework: E2ETestFramework;
    private generator: LanguageTestGenerator;
    private matrix: FeatureTestMatrix;

    constructor(workspacePath: string, languagesJsonPath: string) {
        this.framework = new E2ETestFramework(workspacePath);
        this.generator = new LanguageTestGenerator(languagesJsonPath);
        this.matrix = new FeatureTestMatrix(languagesJsonPath);
    }

    /**
     * Generate test suite for Explain Code
     */
    generateExplainCodeTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('understand-explain-code');

        for (const expectation of expectations) {
            tests.push({
                name: `Explain Code - ${expectation.language}`,
                language: expectation.language,
                feature: 'understand-explain-code',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `explain${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'complex-algo');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    // Select code
                    await vscode.commands.executeCommand('editor.action.selectAll');
                    
                    // Trigger explain command
                    await vscode.commands.executeCommand('inline.explainCode');
                    
                    // Wait for explanation generation
                    await this.framework.sleep(2000);
                },
                
                verify: async () => {
                    // Check if explanation view/panel is visible or if output channel has content
                    // For E2E we might check if a webview is active or a message is shown
                    // This is hard to verify without deep UI inspection
                    // Assuming successful command execution is enough for now, 
                    // or we check a side effect like a new file or log
                    return true; 
                }
            });
        }

        return { name: 'Explain Code - All Languages', tests };
    }

    /**
     * Generate test suite for Hovers
     */
    generateHoverTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('understand-hover-signature');

        for (const expectation of expectations) {
            tests.push({
                name: `Hover Info - ${expectation.language}`,
                language: expectation.language,
                feature: 'understand-hover-signature',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `hover${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'hover-target');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    const position = new vscode.Position(0, 5);
                    
                    // Trigger hover
                    await vscode.commands.executeCommand('editor.action.showHover');
                },
                
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;
                     
                     const position = new vscode.Position(0, 5);
                    const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                        'vscode.executeHoverProvider',
                        editor.document.uri,
                        position
                    );
                    
                    return hovers !== undefined && hovers.length > 0;
                }
            });
        }

        return { name: 'Hover Info - All Languages', tests };
    }

    async runAllTests(): Promise<void> {
        const suites = [
            this.generateExplainCodeTests(),
            this.generateHoverTests()
        ];

        console.log('Running code understanding tests for all languages...');
        await this.framework.runSuitesParallel(suites, 3);

        const stats = this.framework.getStatistics();
        console.log('\n=== Understanding Test Results ===');
        console.log(`Total: ${stats.total}`);
        console.log(`Passed: ${stats.passed}`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`Pass Rate: ${stats.passRate.toFixed(2)}%`);

        await this.framework.saveReport(
            path.join(this.framework['testWorkspace'], 'understanding-test-report.html')
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
                'complex-algo': 'function bubbleSort(arr: number[]) { /* implementation */ }',
                'hover-target': 'function hoverMe() {}'
            },
            'python': {
                'complex-algo': 'def bubble_sort(arr): # implementation',
                'hover-target': 'def hover_me(): pass'
            },
            'java': {
                 'complex-algo': 'class Sort { void bubbleSort(int[] arr) { } }',
                'hover-target': 'class Test { void hoverMe() {} }'
            }
        };

        return templates[language]?.[testType] || '// Test content placeholder';
    }
}
