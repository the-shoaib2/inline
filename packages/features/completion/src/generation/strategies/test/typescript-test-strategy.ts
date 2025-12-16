
import * as vscode from 'vscode';
import { TestStrategy, TestFramework } from './test-strategy.interface';

export class TypeScriptTestStrategy implements TestStrategy {
    supports(languageId: string): boolean {
        return languageId === 'typescript' || languageId === 'javascript';
    }

    async detectFramework(document: vscode.TextDocument): Promise<TestFramework> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        
        if (workspaceFolder) {
            const packageJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
            try {
                // In a real environment we would read the file. 
                // For this refactoring we assume the context allows us to read or we rely on simple heuristics
                // But TestGenerator.detectFramework implemented reading package.json using require().
                // We should try to use workspace fs or keep the require if valid in extension host.
                // Since this runs in extension host, require might be tricky for workspace files.
                // Better use vscode.workspace.fs.
                const buffer = await vscode.workspace.fs.readFile(packageJsonPath);
                const content = Buffer.from(buffer).toString('utf8');
                const packageJson = JSON.parse(content);
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                if (deps['vitest']) return 'vitest';
                if (deps['jest']) return 'jest';
                if (deps['mocha']) return 'mocha';
            } catch {
                // Fall through to default
            }
        }

        return 'jest';
    }

    getFrameworkInstructions(framework: TestFramework): string {
        const instructions: Record<string, string> = {
            'jest': 'Use Jest syntax with describe() and test() blocks. Use expect() for assertions.',
            'mocha': 'Use Mocha syntax with describe() and it() blocks. Use chai expect() for assertions.',
            'vitest': 'Use Vitest syntax with describe() and test() blocks. Use expect() for assertions.'
        };
        return instructions[framework] || instructions['jest'];
    }

    countTests(code: string, framework: TestFramework): number {
        const patterns: Record<string, RegExp> = {
            'jest': /\b(test|it)\s*\(/g,
            'mocha': /\bit\s*\(/g,
            'vitest': /\b(test|it)\s*\(/g
        };
        const pattern = patterns[framework] || /\b(test|it)\s*\(/g;
        const matches = code.match(pattern);
        return matches ? matches.length : 0;
    }
}
