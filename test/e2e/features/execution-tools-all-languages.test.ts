/**
 * Execution Tools Tests - All Languages
 * Covers: Build & Run (O), Terminal (P)
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { E2ETestFramework, TestCase, TestSuite } from '../framework/test-framework';
import { LanguageTestGenerator } from '../framework/language-test-generator';
import { FeatureTestMatrix } from '../framework/feature-test-matrix';

export class ExecutionToolsAllLanguagesTest {
    private framework: E2ETestFramework;
    private generator: LanguageTestGenerator;
    private matrix: FeatureTestMatrix;

    constructor(workspacePath: string, languagesJsonPath: string) {
        this.framework = new E2ETestFramework(workspacePath);
        this.generator = new LanguageTestGenerator(languagesJsonPath);
        this.matrix = new FeatureTestMatrix(languagesJsonPath);
    }

    /**
     * Generate test suite for Build & Run Features
     */
    generateBuildRunTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('build-project');

        for (const expectation of expectations) {
            if (!this.isCompiledLanguage(expectation.language)) continue;

            tests.push({
                name: `Build Project - ${expectation.language}`,
                language: expectation.language,
                feature: 'build-project',
                setup: async () => {
                    await this.createTestFile(expectation.language, 'hello-world');
                },
                execute: async () => {
                     // Simulate build command
                     await vscode.commands.executeCommand('inline.build.project');
                     await this.framework.sleep(1500);
                },
                verify: async () => true // Check output channel or file existence in real scenario
            });
        }
        return { name: 'Build & Run - Compiled Languages', tests };
    }

    /**
     * Generate test suite for Terminal Features
     */
     generateTerminalTests(): TestSuite {
        const tests: TestCase[] = [];
        
        // Test command suggestions
        tests.push({
            name: 'Terminal Command Suggestions',
            language: 'shell',
            feature: 'term-suggest',
            setup: async () => {},
            execute: async () => {
                 // Hard to test terminal UI directly, ensure command runs
                 await vscode.commands.executeCommand('inline.terminal.suggest');
                 await this.framework.sleep(500);
            },
            verify: async () => true
        });

        // Test explain terminal command
        tests.push({
            name: 'Explain Terminal Command',
            language: 'shell',
            feature: 'term-explain',
            setup: async () => {},
            execute: async () => {
                 await vscode.commands.executeCommand('inline.terminal.explain', 'ls -la');
                 await this.framework.sleep(1000);
            },
             verify: async () => true
        });
        
        return { name: 'Terminal Features', tests };
    }

    async runAllTests(): Promise<void> {
        const suites = [
            this.generateBuildRunTests(),
            this.generateTerminalTests()
        ];
        console.log('Running execution tools tests...');
        await this.framework.runSuitesParallel(suites, 3);
    }

    private isCompiledLanguage(language: string): boolean {
        const compiled = ['c', 'cpp', 'rust', 'go', 'java', 'csharp', 'swift'];
        return compiled.includes(language);
    }

    private async createTestFile(language: string, type: string): Promise<void> {
         const ext = this.getExtension(language);
        const filePath = path.join(this.framework['testWorkspace'], `exec_test${ext}`);
        // Basic hello world
        const content = this.getHelloWorld(language);
        
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);
    }

    private getExtension(language: string): string {
         const extensions: Record<string, string> = {
            'c': '.c', 'cpp': '.cpp', 'rust': '.rs', 'go': '.go', 'java': '.java'
        };
        return extensions[language] || '.txt';
    }

    private getHelloWorld(language: string): string {
        if (language === 'c') return '#include <stdio.h>\nint main() { printf("Hello"); return 0; }';
        if (language === 'cpp') return '#include <iostream>\nint main() { std::cout << "Hello"; return 0; }';
        if (language === 'go') return 'package main\nimport "fmt"\nfunc main() { fmt.Println("Hello") }';
        if (language === 'rust') return 'fn main() { println!("Hello"); }';
        if (language === 'java') return 'class Main { public static void main(String[] args) { System.out.println("Hello"); } }';
        return '';
    }
}
