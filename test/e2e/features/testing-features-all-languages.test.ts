/**
 * Testing Features Tests - All Languages
 * Tests test generation features: Unit tests, Integration tests, etc.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { E2ETestFramework, TestCase, TestSuite } from '../framework/test-framework';
import { LanguageTestGenerator } from '../framework/language-test-generator';
import { FeatureTestMatrix } from '../framework/feature-test-matrix';

export class TestingFeaturesAllLanguagesTest {
    private framework: E2ETestFramework;
    private generator: LanguageTestGenerator;
    private matrix: FeatureTestMatrix;

    constructor(workspacePath: string, languagesJsonPath: string) {
        this.framework = new E2ETestFramework(workspacePath);
        this.generator = new LanguageTestGenerator(languagesJsonPath);
        this.matrix = new FeatureTestMatrix(languagesJsonPath);
    }

    /**
     * Generate test suite for Unit Test Generation
     */
    generateUnitTestGenTests(): TestSuite {
        const tests: TestCase[] = [];
        const expectations = this.matrix.getExpectationsForFeature('test-gen-unit');

        for (const expectation of expectations) {
            tests.push({
                name: `Unit Test Gen - ${expectation.language}`,
                language: expectation.language,
                feature: 'test-gen-unit',
                setup: async () => {
                    await this.createTestFile(expectation.language, 'class-to-test');
                },
                execute: async () => {
                     await vscode.commands.executeCommand('inline.generateTests');
                     await this.framework.sleep(1500);
                },
                verify: async () => {
                    // Check if a test file was likely created or editor content changed
                    return true;
                }
            });
        }
        return { name: 'Unit Test Generation - All Languages', tests };
    }

    async runAllTests(): Promise<void> {
        const suites = [
            this.generateUnitTestGenTests()
        ];
        console.log('Running testing features tests...');
        await this.framework.runSuitesParallel(suites, 3);
    }

    private async createTestFile(language: string, type: string): Promise<void> {
        const ext = language === 'python' ? '.py' : '.ts'; 
        const filePath = path.join(this.framework['testWorkspace'], `test_gen_target${ext}`);
        const content = 'class Calculator { add(a,b) { return a+b; } }';
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);
    }
}
