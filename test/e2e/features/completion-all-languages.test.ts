/**
 * Completion Tests - All Languages
 * Tests all code completion features across all supported languages
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { E2ETestFramework, TestCase, TestSuite } from '../framework/test-framework';
import { LanguageTestGenerator } from '../framework/language-test-generator';
import { FeatureTestMatrix } from '../framework/feature-test-matrix';

export class CompletionAllLanguagesTest {
    private framework: E2ETestFramework;
    private generator: LanguageTestGenerator;
    private matrix: FeatureTestMatrix;

    constructor(workspacePath: string, languagesJsonPath: string) {
        this.framework = new E2ETestFramework(workspacePath);
        this.generator = new LanguageTestGenerator(languagesJsonPath);
        this.matrix = new FeatureTestMatrix(languagesJsonPath);
    }

    /**
     * Generate test suite for single-line completion
     */
    generateSingleLineCompletionTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('completion-single-line');

        for (const expectation of expectations) {
            tests.push({
                name: `Single-line completion - ${expectation.language}`,
                language: expectation.language,
                feature: 'completion-single-line',
                
                setup: async () => {
                    // Create test file
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `test${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'single-line');
                },
                
                execute: async () => {
                    // Trigger completion
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    const position = new vscode.Position(5, 10);
                    await vscode.commands.executeCommand(
                        'vscode.executeCompletionItemProvider',
                        editor.document.uri,
                        position
                    );
                },
                
                verify: async () => {
                    // Verify completion was provided
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;
                    
                    const position = new vscode.Position(5, 10);
                    const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                        'vscode.executeCompletionItemProvider',
                        editor.document.uri,
                        position
                    );
                    
                    return completions !== undefined && completions.items.length > 0;
                }
            });
        }

        return { name: 'Single-line Completion - All Languages', tests };
    }

    /**
     * Generate test suite for multi-line completion
     */
    generateMultiLineCompletionTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('completion-multi-line');

        for (const expectation of expectations) {
            tests.push({
                name: `Multi-line completion - ${expectation.language}`,
                language: expectation.language,
                feature: 'completion-multi-line',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `test${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'multi-line');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    const position = new vscode.Position(10, 0);
                    await vscode.commands.executeCommand(
                        'vscode.executeCompletionItemProvider',
                        editor.document.uri,
                        position
                    );
                },
                
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;
                    
                    const position = new vscode.Position(10, 0);
                    const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                        'vscode.executeCompletionItemProvider',
                        editor.document.uri,
                        position
                    );
                    
                    // Verify multi-line completion
                    if (!completions || completions.items.length === 0) return false;
                    
                    const hasMultiLine = completions.items.some(item => {
                        const text = typeof item.insertText === 'string' 
                            ? item.insertText 
                            : item.insertText?.value || '';
                        return text.includes('\n');
                    });
                    
                    return hasMultiLine;
                }
            });
        }

        return { name: 'Multi-line Completion - All Languages', tests };
    }

    /**
     * Generate test suite for function completion
     */
    generateFunctionCompletionTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('completion-function');

        for (const expectation of expectations) {
            tests.push({
                name: `Function completion - ${expectation.language}`,
                language: expectation.language,
                feature: 'completion-function',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `test${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'function');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    // Position after function signature
                    const position = this.getFunctionPosition(expectation.language);
                    await vscode.commands.executeCommand(
                        'vscode.executeCompletionItemProvider',
                        editor.document.uri,
                        position
                    );
                },
                
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;
                    
                    const position = this.getFunctionPosition(expectation.language);
                    const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                        'vscode.executeCompletionItemProvider',
                        editor.document.uri,
                        position
                    );
                    
                    return completions !== undefined && completions.items.length > 0;
                }
            });
        }

        return { name: 'Function Completion - All Languages', tests };
    }

    /**
     * Generate test suite for class scaffolding
     */
    generateClassScaffoldingTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('completion-class');

        for (const expectation of expectations) {
            tests.push({
                name: `Class scaffolding - ${expectation.language}`,
                language: expectation.language,
                feature: 'completion-class',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `test${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'class');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    const position = this.getClassPosition(expectation.language);
                    await vscode.commands.executeCommand(
                        'vscode.executeCompletionItemProvider',
                        editor.document.uri,
                        position
                    );
                },
                
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;
                    
                    const position = this.getClassPosition(expectation.language);
                    const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                        'vscode.executeCompletionItemProvider',
                        editor.document.uri,
                        position
                    );
                    
                    return completions !== undefined && completions.items.length > 0;
                }
            });
        }

        return { name: 'Class Scaffolding - All Languages', tests };
    }

    /**
     * Run all completion tests
     */
    async runAllTests(): Promise<void> {
        const suites = [
            this.generateSingleLineCompletionTests(),
            this.generateMultiLineCompletionTests(),
            this.generateFunctionCompletionTests(),
            this.generateClassScaffoldingTests()
        ];

        console.log('Running completion tests for all languages...');
        await this.framework.runSuitesParallel(suites, 3);

        const stats = this.framework.getStatistics();
        console.log('\n=== Completion Test Results ===');
        console.log(`Total: ${stats.total}`);
        console.log(`Passed: ${stats.passed}`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`Pass Rate: ${stats.passRate.toFixed(2)}%`);

        // Generate report
        await this.framework.saveReport(
            path.join(this.framework['testWorkspace'], 'completion-test-report.html')
        );
    }

    /**
     * Helper: Get file extension for language
     */
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

    /**
     * Helper: Create test file
     */
    private async createTestFile(filePath: string, language: string, testType: string): Promise<void> {
        const content = this.getTestContent(language, testType);
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        
        // Open file in editor
        const uri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
    }

    /**
     * Helper: Get test content for language and type
     */
    private getTestContent(language: string, testType: string): string {
        // Return appropriate test content based on language and test type
        const templates: Record<string, Record<string, string>> = {
            'typescript': {
                'single-line': 'const x = \n',
                'multi-line': 'function test() {\n  \n}\n',
                'function': 'function calculate(a: number, b: number): number {\n  \n}\n',
                'class': 'class User {\n  \n}\n'
            },
            'python': {
                'single-line': 'x = \n',
                'multi-line': 'def test():\n    \n',
                'function': 'def calculate(a, b):\n    \n',
                'class': 'class User:\n    \n'
            }
        };

        return templates[language]?.[testType] || '';
    }

    /**
     * Helper: Get function position for language
     */
    private getFunctionPosition(language: string): vscode.Position {
        // Return appropriate position based on language syntax
        return new vscode.Position(1, 4);
    }

    /**
     * Helper: Get class position for language
     */
    private getClassPosition(language: string): vscode.Position {
        return new vscode.Position(1, 4);
    }
}
