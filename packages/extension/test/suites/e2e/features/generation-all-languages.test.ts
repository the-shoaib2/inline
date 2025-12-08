/**
 * Generation Tests - All Languages
 * Tests all code generation features across all supported languages
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { E2ETestFramework, TestCase, TestSuite } from '../framework/test-framework';
import { LanguageTestGenerator } from '../framework/language-test-generator';
import { FeatureTestMatrix } from '../framework/feature-test-matrix';

export class GenerationAllLanguagesTest {
    private framework: E2ETestFramework;
    private generator: LanguageTestGenerator;
    private matrix: FeatureTestMatrix;

    constructor(workspacePath: string, languagesJsonPath: string) {
        this.framework = new E2ETestFramework(workspacePath);
        this.generator = new LanguageTestGenerator(languagesJsonPath);
        this.matrix = new FeatureTestMatrix(languagesJsonPath);
    }

    /**
     * Generate test suite for function generation from signature
     */
    generateFunctionSignatureTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('gen-function-signature');

        for (const expectation of expectations) {
            tests.push({
                name: `Function body generation - ${expectation.language}`,
                language: expectation.language,
                feature: 'gen-function-signature',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `gen_func${ext}`
                    );
                    // Create a file with just a function signature
                    await this.createTestFile(testFile, expectation.language, 'function-signature');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    // Position cursor at the end of the signature or inside the empty body
                    const position = this.getFunctionBodyPosition(expectation.language);
                    
                    // Trigger generation (simulate hitting enter or invoking command)
                    await vscode.commands.executeCommand('inline.generateCode', {
                        prompt: 'implementation for this function'
                    });
                },
                
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;
                    
                    // Verify that the function body is not empty
                    const text = editor.document.getText();
                    return text.length > 50 && !text.includes('pass') && !text.includes('TODO');
                }
            });
        }

        return { name: 'Function Generation - All Languages', tests };
    }

    /**
     * Generate test suite for test generation
     */
    generateTestGenerationTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('gen-tests');

        for (const expectation of expectations) {
            tests.push({
                name: `Test generation - ${expectation.language}`,
                language: expectation.language,
                feature: 'gen-tests',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `source_for_test${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'class-implementation');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    // Select the class/function
                    await vscode.commands.executeCommand('editor.action.selectAll');
                    
                    // Trigger test generation command
                    await vscode.commands.executeCommand('inline.generateTests');
                },
                
                verify: async () => {
                    // Check if a new test file was created or if content was added
                    // This depends on how the feature is implemented (inline or new file)
                    // For now, assuming it opens a new file or appends
                    const visibleEditors = vscode.window.visibleTextEditors;
                    const testContent = visibleEditors.map(e => e.document.getText()).join('');
                    
                    if (expectation.language === 'python') {
                        return testContent.includes('unittest') || testContent.includes('pytest');
                    } else if (expectation.language === 'typescript' || expectation.language === 'javascript') {
                        return testContent.includes('describe') || testContent.includes('test(') || testContent.includes('it(');
                    } else if (expectation.language === 'java') {
                        return testContent.includes('@Test');
                    } else if (expectation.language === 'go') {
                        return testContent.includes('func Test');
                    }
                    
                    return testContent.length > 100; // Basic fallback
                }
            });
        }

        return { name: 'Test Generation - All Languages', tests };
    }

    /**
     * Generate test suite for documentation generation
     */
    generateDocGenerationTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('gen-docs');

        for (const expectation of expectations) {
            tests.push({
                name: `Documentation generation - ${expectation.language}`,
                language: expectation.language,
                feature: 'gen-docs',
                
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(
                        this.framework['testWorkspace'],
                        `doc_target${ext}`
                    );
                    await this.createTestFile(testFile, expectation.language, 'complex-function');
                },
                
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) throw new Error('No active editor');
                    
                    // Position cursor on function
                    const position = new vscode.Position(1, 4);
                    editor.selection = new vscode.Selection(position, position);
                    
                    await vscode.commands.executeCommand('inline.generateDocs');
                },
                
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) return false;
                    
                    const text = editor.document.getText();
                    
                    if (expectation.language === 'python') {
                        return text.includes('"""') || text.includes("'''");
                    } else if (expectation.language === 'java' || expectation.language === 'javascript' || expectation.language === 'typescript') {
                        return text.includes('/**');
                    } else if (expectation.language === 'go') {
                        return text.includes('// ');
                    }
                    
                    // General check for comment addition
                    return text.length > 50; // Needs better check based on input
                }
            });
        }

        return { name: 'Documentation Generation - All Languages', tests };
    }

    /**
     * Run all generation tests
     */
    async runAllTests(): Promise<void> {
        const suites = [
            this.generateFunctionSignatureTests(),
            this.generateTestGenerationTests(),
            this.generateDocGenerationTests()
        ];

        console.log('Running code generation tests for all languages...');
        await this.framework.runSuitesParallel(suites, 3);

        const stats = this.framework.getStatistics();
        console.log('\n=== Generation Test Results ===');
        console.log(`Total: ${stats.total}`);
        console.log(`Passed: ${stats.passed}`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`Pass Rate: ${stats.passRate.toFixed(2)}%`);

        await this.framework.saveReport(
            path.join(this.framework['testWorkspace'], 'generation-test-report.html')
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
                'function-signature': 'function calculateFibonacci(n: number): number {\n',
                'class-implementation': 'export class Calculator {\n  add(a: number, b: number): number { return a + b; }\n  subtract(a: number, b: number): number { return a - b; }\n}\n',
                'complex-function': 'function processUserData(users: any[], options: any) {\n  // Complex logic here\n}\n'
            },
            'python': {
                'function-signature': 'def calculate_fibonacci(n: int) -> int:\n',
                'class-implementation': 'class Calculator:\n    def add(self, a, b): return a + b\n    def subtract(self, a, b): return a - b\n',
                'complex-function': 'def process_user_data(users, options):\n    # Complex logic here\n    pass\n'
            },
            'java': {
                'function-signature': 'public int calculateFibonacci(int n) {\n',
                'class-implementation': 'public class Calculator {\n  public int add(int a, int b) { return a + b; }\n}\n',
                'complex-function': 'public void processUserData(List<User> users) {\n  // Logic\n}\n'
            },
             'go': {
                'function-signature': 'func CalculateFibonacci(n int) int {\n',
                'class-implementation': 'type Calculator struct{}\nfunc (c *Calculator) Add(a, b int) int { return a + b }\n',
                'complex-function': 'func ProcessUserData(users []User) error {\n\treturn nil\n}\n'
            }
        };

        return templates[language]?.[testType] || '// Test content placeholder';
    }

    private getFunctionBodyPosition(language: string): vscode.Position {
        if (language === 'python') return new vscode.Position(1, 4);
        return new vscode.Position(1, 2);
    }
}
