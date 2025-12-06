import * as vscode from 'vscode';
import { LlamaInference } from './llama-inference';
import { Logger } from '../utils/logger';

export type TestFramework = 'jest' | 'mocha' | 'vitest' | 'pytest' | 'junit' | 'go-test' | 'rust-test' | 'auto';

export interface TestGenerationOptions {
    framework?: TestFramework;
    includeEdgeCases?: boolean;
    includeMocks?: boolean;
    generateSnapshots?: boolean;
    testStyle?: 'unit' | 'integration' | 'e2e';
}

export interface GeneratedTest {
    code: string;
    framework: TestFramework;
    testCount: number;
    imports: string[];
}

export class TestGenerator {
    private inference: LlamaInference;
    private logger: Logger;

    constructor(inference: LlamaInference) {
        this.inference = inference;
        this.logger = new Logger('TestGenerator');
    }

    /**
     * Detect the appropriate test framework based on file context
     */
    private detectFramework(document: vscode.TextDocument): TestFramework {
        const languageId = document.languageId;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        
        if (!workspaceFolder) {
            return this.getDefaultFramework(languageId);
        }

        // Check package.json for JavaScript/TypeScript
        if (languageId === 'typescript' || languageId === 'javascript') {
            const packageJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
            try {
                const packageJson = require(packageJsonPath.fsPath);
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                if (deps['vitest']) return 'vitest';
                if (deps['jest']) return 'jest';
                if (deps['mocha']) return 'mocha';
            } catch {
                // Fall through to default
            }
        }

        return this.getDefaultFramework(languageId);
    }

    private getDefaultFramework(languageId: string): TestFramework {
        const frameworkMap: Record<string, TestFramework> = {
            'typescript': 'jest',
            'javascript': 'jest',
            'python': 'pytest',
            'java': 'junit',
            'go': 'go-test',
            'rust': 'rust-test'
        };

        return frameworkMap[languageId] || 'jest';
    }

    /**
     * Generate tests for a function or class
     */
    public async generateTests(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: TestGenerationOptions = {}
    ): Promise<GeneratedTest> {
        const code = document.getText(range);
        const framework = options.framework === 'auto' || !options.framework
            ? this.detectFramework(document)
            : options.framework;

        this.logger.info(`Generating ${framework} tests for code`);

        const prompt = this.buildTestPrompt(code, framework, document.languageId, options);
        
        try {
            const testCode = await this.inference.generateCompletion(prompt, {
                maxTokens: 1024,
                temperature: 0.3,
                stop: ['```\n\n', '\n\n\n']
            });

            const cleaned = this.cleanTestCode(testCode);
            const imports = this.extractImports(cleaned, framework);
            const testCount = this.countTests(cleaned, framework);

            return {
                code: cleaned,
                framework,
                testCount,
                imports
            };
        } catch (error) {
            this.logger.error(`Test generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Build the prompt for test generation
     */
    private buildTestPrompt(
        code: string,
        framework: TestFramework,
        language: string,
        options: TestGenerationOptions
    ): string {
        const frameworkInstructions = this.getFrameworkInstructions(framework);
        const edgeCaseInstruction = options.includeEdgeCases
            ? 'Include edge cases like null values, empty inputs, and boundary conditions.'
            : '';
        const mockInstruction = options.includeMocks
            ? 'Use mocks and stubs where appropriate.'
            : '';

        return `Generate comprehensive ${framework} tests for the following ${language} code.
${frameworkInstructions}
${edgeCaseInstruction}
${mockInstruction}

Code to test:
\`\`\`${language}
${code}
\`\`\`

Generate complete, runnable tests with:
1. All necessary imports
2. Test setup and teardown if needed
3. Multiple test cases covering different scenarios
4. Clear test descriptions
5. Assertions for expected behavior

Tests:`;
    }

    private getFrameworkInstructions(framework: TestFramework): string {
        const instructions: Record<TestFramework, string> = {
            'jest': 'Use Jest syntax with describe() and test() blocks. Use expect() for assertions.',
            'mocha': 'Use Mocha syntax with describe() and it() blocks. Use chai expect() for assertions.',
            'vitest': 'Use Vitest syntax with describe() and test() blocks. Use expect() for assertions.',
            'pytest': 'Use pytest syntax with test_ functions. Use assert statements.',
            'junit': 'Use JUnit 5 syntax with @Test annotations. Use assertEquals() and other assertions.',
            'go-test': 'Use Go testing package with Test functions. Use t.Error() and t.Fatal().',
            'rust-test': 'Use Rust #[test] attribute. Use assert_eq!() and assert!() macros.',
            'auto': ''
        };

        return instructions[framework] || '';
    }

    /**
     * Clean generated test code
     */
    private cleanTestCode(code: string): string {
        // Remove markdown code fences
        let cleaned = code.replace(/```[\w]*\n?/g, '').trim();
        
        // Remove common LLM artifacts
        cleaned = cleaned.replace(/^(Here (is|are) the tests?:?|Tests?:)\s*/i, '');
        
        return cleaned;
    }

    /**
     * Extract imports from generated test code
     */
    private extractImports(code: string, framework: TestFramework): string[] {
        const imports: string[] = [];
        const lines = code.split('\n');

        for (const line of lines) {
            if (line.match(/^import\s+/)) {
                imports.push(line.trim());
            } else if (line.match(/^from\s+.*\s+import\s+/)) {
                imports.push(line.trim());
            } else if (line.match(/^const\s+.*\s+=\s+require\(/)) {
                imports.push(line.trim());
            }
        }

        return imports;
    }

    /**
     * Count number of tests in generated code
     */
    private countTests(code: string, framework: TestFramework): number {
        const patterns: Record<TestFramework, RegExp> = {
            'jest': /\b(test|it)\s*\(/g,
            'mocha': /\bit\s*\(/g,
            'vitest': /\b(test|it)\s*\(/g,
            'pytest': /^def\s+test_/gm,
            'junit': /@Test/g,
            'go-test': /^func\s+Test/gm,
            'rust-test': /#\[test\]/g,
            'auto': /\b(test|it)\s*\(/g
        };

        const pattern = patterns[framework] || patterns['auto'];
        const matches = code.match(pattern);
        return matches ? matches.length : 0;
    }

    /**
     * Generate test file for entire source file
     */
    public async generateTestFile(document: vscode.TextDocument, options: TestGenerationOptions = {}): Promise<string> {
        const framework = options.framework === 'auto' || !options.framework
            ? this.detectFramework(document)
            : options.framework;

        const sourceCode = document.getText();
        
        const prompt = `Generate a complete test file for the following code using ${framework}.
Include tests for all exported functions and classes.

Source code:
\`\`\`${document.languageId}
${sourceCode}
\`\`\`

Generate a complete test file with all necessary imports and setup:`;

        try {
            const testCode = await this.inference.generateCompletion(prompt, {
                maxTokens: 2048,
                temperature: 0.3,
                stop: ['```\n\n']
            });

            return this.cleanTestCode(testCode);
        } catch (error) {
            this.logger.error(`Test file generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Add a specific test case to existing tests
     */
    public async addTestCase(
        document: vscode.TextDocument,
        functionName: string,
        testDescription: string,
        framework?: TestFramework
    ): Promise<string> {
        const detectedFramework = framework || this.detectFramework(document);
        
        const prompt = `Add a ${detectedFramework} test case for the function "${functionName}".
Test description: ${testDescription}

Generate only the test case code:`;

        try {
            const testCase = await this.inference.generateCompletion(prompt, {
                maxTokens: 256,
                temperature: 0.3
            });

            return this.cleanTestCode(testCase);
        } catch (error) {
            this.logger.error(`Test case generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Generate mock data for testing
     */
    public async generateMockData(
        dataType: string,
        count: number = 5
    ): Promise<string> {
        const prompt = `Generate ${count} realistic mock ${dataType} objects for testing.
Return as a JSON array or code that creates the mock data:`;

        try {
            const mockData = await this.inference.generateCompletion(prompt, {
                maxTokens: 512,
                temperature: 0.5
            });

            return this.cleanTestCode(mockData);
        } catch (error) {
            this.logger.error(`Mock data generation failed: ${error}`);
            throw error;
        }
    }
}
