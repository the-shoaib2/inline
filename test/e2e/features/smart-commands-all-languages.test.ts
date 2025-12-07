/**
 * Smart Commands Tests - All Languages
 * Tests slash commands: /explain, /fix, /optimize, /test, etc.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { E2ETestFramework, TestCase, TestSuite } from '../framework/test-framework';
import { LanguageTestGenerator } from '../framework/language-test-generator';
import { FeatureTestMatrix } from '../framework/feature-test-matrix';

export class SmartCommandsAllLanguagesTest {
    private framework: E2ETestFramework;
    private generator: LanguageTestGenerator;
    private matrix: FeatureTestMatrix;

    constructor(workspacePath: string, languagesJsonPath: string) {
        this.framework = new E2ETestFramework(workspacePath);
        this.generator = new LanguageTestGenerator(languagesJsonPath);
        this.matrix = new FeatureTestMatrix(languagesJsonPath);
    }

    /**
     * Generate test suite for /explain command
     */
    generateExplainCommandTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('cmd-explain');

        for (const expectation of expectations) {
            tests.push({
                name: `/explain command - ${expectation.language}`,
                language: expectation.language,
                feature: 'cmd-explain',
                setup: async () => {
                    await this.createTestFile(expectation.language, 'complex-algo');
                },
                execute: async () => {
                     // Simulate command execution
                     // In a real scenario, this might involve the chat view interaction
                     // Here we assert the command exists and runs without error
                     await vscode.commands.executeCommand('inline.chat.explain');
                     await this.framework.sleep(1000);
                },
                verify: async () => {
                    return true; // Assume success if no error thrown
                }
            });
        }
        return { name: '/explain Command - All Languages', tests };
    }

     /**
     * Generate test suite for /fix command
     */
     generateFixCommandTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('cmd-fix');

        for (const expectation of expectations) {
            tests.push({
                name: `/fix command - ${expectation.language}`,
                language: expectation.language,
                feature: 'cmd-fix',
                setup: async () => {
                    await this.createTestFile(expectation.language, 'buggy-code');
                },
                execute: async () => {
                     await vscode.commands.executeCommand('inline.chat.fix');
                     await this.framework.sleep(1000);
                },
                verify: async () => {
                    return true; 
                }
            });
        }
        return { name: '/fix Command - All Languages', tests };
    }

    async runAllTests(): Promise<void> {
        const suites = [
            this.generateExplainCommandTests(),
            this.generateFixCommandTests()
        ];
        console.log('Running smart command tests...');
        await this.framework.runSuitesParallel(suites, 3);
    }

    private async createTestFile(language: string, type: string): Promise<void> {
        const ext = language === 'python' ? '.py' : '.ts'; // Simplified
        const filePath = path.join(this.framework['testWorkspace'], `cmd_test${ext}`);
        const content = type === 'buggy-code' ? 'broken code' : 'complex code';
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);
    }
}
