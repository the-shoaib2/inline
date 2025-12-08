/**
 * Navigation Tests - All Languages
 * Tests code navigation features: Go to Definition, Find References, etc.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { E2ETestFramework, TestCase, TestSuite } from '../framework/test-framework';
import { LanguageTestGenerator } from '../framework/language-test-generator';
import { FeatureTestMatrix } from '../framework/feature-test-matrix';

export class NavigationAllLanguagesTest {
    private framework: E2ETestFramework;
    private generator: LanguageTestGenerator;
    private matrix: FeatureTestMatrix;

    constructor(workspacePath: string, languagesJsonPath: string) {
        this.framework = new E2ETestFramework(workspacePath);
        this.generator = new LanguageTestGenerator(languagesJsonPath);
        this.matrix = new FeatureTestMatrix(languagesJsonPath);
    }

    /**
     * Generate test suite for Go to Definition
     */
    generateGoToDefinitionTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('nav-go-to-def');

        for (const expectation of expectations) {
            tests.push({
                name: `Go to Definition - ${expectation.language}`,
                language: expectation.language,
                feature: 'nav-go-to-def',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `navigation${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'definition');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    // Position cursor on a usage
                    const position = this.getUsagePosition(expectation.language);
                    
                    // Trigger definition command
                     await vscode.commands.executeCommand('editor.action.revealDefinition');
                },
                
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;
                    
                    // Check if cursor moved to the definition line
                    const currentPos = editor.selection.active;
                    const expectedPos = this.getDefinitionPosition(expectation.language);
                    
                    return currentPos.line === expectedPos.line;
                }
            });
        }

        return { name: 'Go to Definition - All Languages', tests };
    }

    /**
     * Generate test suite for Find References
     */
    generateFindReferencesTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('nav-find-references');

        for (const expectation of expectations) {
            tests.push({
                name: `Find References - ${expectation.language}`,
                language: expectation.language,
                feature: 'nav-find-references',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `references${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'references');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    const position = this.getDefinitionPosition(expectation.language);
                    
                    // Execute command to find references (returns array of locations)
                    // We can't easily capture the UI result, so we use the API
                    await vscode.commands.executeCommand('editor.action.referenceSearch.trigger');
                },
                
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;

                    const position = this.getDefinitionPosition(expectation.language);
                    const references = await vscode.commands.executeCommand<vscode.Location[]>(
                        'vscode.executeReferenceProvider',
                        editor.document.uri,
                        position
                    );
                    
                    // Should find at least the definition and one usage
                    return references !== undefined && references.length >= 2;
                }
            });
        }

        return { name: 'Find References - All Languages', tests };
    }

    /**
     * Generate test suite for Navigate to Symbol
     */
    generateSymbolNavigationTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('nav-symbol');

        for (const expectation of expectations) {
            tests.push({
                name: `Navigate to Symbol - ${expectation.language}`,
                language: expectation.language,
                feature: 'nav-symbol',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `symbols${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'symbols');
                },
                
                execute: async () => {
                     // We verify the symbol provider is working
                     const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    await vscode.commands.executeCommand('workbench.action.gotoSymbol');
                },
                
                verify: async () => {
                     const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;

                    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                        'vscode.executeDocumentSymbolProvider',
                        editor.document.uri
                    );
                    
                    return symbols !== undefined && symbols.length > 0;
                }
            });
        }

        return { name: 'Symbol Navigation - All Languages', tests };
    }

    async runAllTests(): Promise<void> {
        const suites = [
            this.generateGoToDefinitionTests(),
            this.generateFindReferencesTests(),
            this.generateSymbolNavigationTests()
        ];

        console.log('Running navigation tests for all languages...');
        await this.framework.runSuitesParallel(suites, 3);

        const stats = this.framework.getStatistics();
        console.log('\n=== Navigation Test Results ===');
        console.log(`Total: ${stats.total}`);
        console.log(`Passed: ${stats.passed}`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`Pass Rate: ${stats.passRate.toFixed(2)}%`);

        await this.framework.saveReport(
            path.join(this.framework['testWorkspace'], 'navigation-test-report.html')
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
         // Should return content with a definition and a usage
         // Definition at line 0, Usage at line 5 (approx)
        const templates: Record<string, Record<string, string>> = {
            'typescript': {
                'definition': 'function targetFunction() { return 1; }\n\n\n\ntargetFunction();\n',
                'references': 'function targetFunction() { return 1; }\n\n\n\ntargetFunction();\n',
                'symbols': 'class MyClass {\n  method() {}\n}\n'
            },
            'python': {
                'definition': 'def target_function():\n    return 1\n\n\n\ntarget_function()\n',
                'references': 'def target_function():\n    return 1\n\n\n\ntarget_function()\n',
                'symbols': 'class MyClass:\n    def method(self):\n        pass\n'
            }
        };

        return templates[language]?.[testType] || '// Test content placeholder';
    }

    private getDefinitionPosition(language: string): vscode.Position {
        return new vscode.Position(0, 9); // 'targetFunction' or 'target_function'
    }

    private getUsagePosition(language: string): vscode.Position {
        if (language === 'python') return new vscode.Position(5, 0);
        return new vscode.Position(4, 0);
    }
}
