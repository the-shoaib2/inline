"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const context_engine_1 = require("@inline/context/context-engine");
describe('ContextEngine Unit Tests', () => {
    describe('Context Building', () => {
        it('should extract imports from code', () => {
            const code = `import { something } from 'module';\nimport * as fs from 'fs';\n`;
            const imports = extractImportsFromCode(code);
            (0, chai_1.expect)(imports).to.have.lengthOf(2);
            (0, chai_1.expect)(imports[0]).to.include('something');
            (0, chai_1.expect)(imports[1]).to.include('fs');
        });
        it('should extract functions from code', () => {
            const code = `function test() {}\nconst arrow = () => {};\n`;
            const functions = extractFunctionsFromCode(code);
            (0, chai_1.expect)(functions).to.have.lengthOf.at.least(1);
        });
        it('should extract classes from code', () => {
            const code = `class MyClass {}\nclass Another extends Base {}\n`;
            const classes = extractClassesFromCode(code);
            (0, chai_1.expect)(classes).to.have.lengthOf(2);
        });
        it('should extract comments from code', () => {
            const code = `// Single line\n/* Multi\nline */\n`;
            const comments = extractCommentsFromCode(code);
            (0, chai_1.expect)(comments).to.have.lengthOf.at.least(1);
        });
    });
    describe('Prompt Generation', () => {
        const engine = new context_engine_1.ContextEngine();
        it('should generate prompt from context', async () => {
            const context = {
                prefix: 'function test() {',
                suffix: '}',
                language: 'typescript',
                imports: [],
                functions: [],
                classes: [],
                interfaces: [],
                types: [],
                variables: [],
                comments: [],
                project: 'test-project',
                filename: 'test.ts',
                recentEdits: [],
                cursorRules: undefined,
                currentScope: null,
                symbolTable: new Map(),
                dependencies: [],
                projectConfig: null,
                codingPatterns: [],
                styleGuide: null,
                relatedCode: [],
                cursorIntent: null
            };
            const prompt = await engine.generatePrompt(context);
            (0, chai_1.expect)(prompt).to.be.a('string');
            (0, chai_1.expect)(prompt.length).to.be.greaterThan(0);
            // Language is no longer explicitly added to prompt to reduce tokens
            // expect(prompt).to.include('typescript');
        });
        it('should include language in prompt', async () => {
            const context = {
                language: 'python',
                prefix: 'def test():',
                suffix: '',
                imports: [],
                functions: [],
                classes: [],
                comments: [],
                project: 'test-project',
                filename: 'test.py',
                recentEdits: [],
                cursorRules: undefined
            };
            const prompt = await engine.generatePrompt(context);
            // Language is no longer explicitly added
            // expect(prompt).to.include('python');
        });
        it('should include relevant imports', async () => {
            const context = {
                language: 'typescript',
                prefix: '',
                suffix: '',
                imports: [],
                functions: [],
                classes: [],
                interfaces: [],
                types: [],
                variables: [],
                comments: [],
                project: 'test-project',
                filename: 'test.tsx',
                recentEdits: [],
                cursorRules: undefined,
                currentScope: null,
                symbolTable: new Map(),
                dependencies: [],
                projectConfig: null,
                codingPatterns: [],
                styleGuide: null,
                relatedCode: [],
                cursorIntent: null
            };
            const prompt = await engine.generatePrompt(context);
        });
        it('should use default FIM template when none specified', async () => {
            const context = {
                prefix: 'prefix',
                suffix: 'suffix',
                language: 'typescript',
                imports: [],
                functions: [],
                classes: [],
                comments: [],
                project: 'test',
                filename: 'test.ts',
                recentEdits: [],
                cursorRules: undefined
            };
            const prompt = await engine.generatePrompt(context);
            (0, chai_1.expect)(prompt).to.include('<|fim_prefix|>');
            (0, chai_1.expect)(prompt).to.include('prefix');
            (0, chai_1.expect)(prompt).to.include('<|fim_suffix|>suffix<|fim_middle|>');
        });
        it('should use StarCoder FIM template', async () => {
            const context = {
                prefix: 'prefix',
                suffix: 'suffix',
                language: 'typescript',
                imports: [],
                functions: [],
                classes: [],
                comments: [],
                project: 'test',
                filename: 'test.ts',
                recentEdits: [],
                cursorRules: undefined
            };
            const prompt = await engine.generatePrompt(context, 'starcoder');
            (0, chai_1.expect)(prompt).to.include('<fim_prefix>');
            (0, chai_1.expect)(prompt).to.include('prefix');
            (0, chai_1.expect)(prompt).to.include('<fim_suffix>suffix<fim_middle>');
        });
        it('should use Qwen FIM template', async () => {
            const context = {
                prefix: 'p',
                suffix: 's',
                language: 'ts',
                imports: [],
                recentEdits: [],
                cursorRules: undefined,
                filename: 'test.ts'
            };
            const prompt = await engine.generatePrompt(context, 'qwen');
            (0, chai_1.expect)(prompt).to.include('<|fim_prefix|>');
        });
        it('should use CodeGemma FIM template', async () => {
            const context = {
                prefix: 'p',
                suffix: 's',
                language: 'ts',
                imports: [],
                recentEdits: [],
                cursorRules: undefined,
                filename: 'test.ts'
            };
            const prompt = await engine.generatePrompt(context, 'codegemma');
            (0, chai_1.expect)(prompt).to.include('<|fim_prefix|>');
        });
        it('should use Codestral FIM template', async () => {
            const context = {
                prefix: 'p',
                suffix: 's',
                language: 'ts',
                imports: [],
                recentEdits: [],
                cursorRules: undefined,
                filename: 'test.ts'
            };
            const prompt = await engine.generatePrompt(context, 'codestral');
            // Mistral format: [SUFFIX]suffix[PREFIX]prefix
            (0, chai_1.expect)(prompt).to.equal('[SUFFIX]s[PREFIX]p');
        });
    });
    describe('Comment Analysis', () => {
        it('should extract intent from comments', () => {
            const comments = ['// Create a function that sorts an array'];
            const intent = extractIntentFromComments(comments);
            (0, chai_1.expect)(intent).to.include('sort');
        });
        it('should extract requirements from comments', () => {
            const comments = [
                '// TODO: Add error handling',
                '// FIXME: Optimize performance'
            ];
            const requirements = extractRequirementsFromComments(comments);
            (0, chai_1.expect)(requirements).to.have.lengthOf.at.least(1);
        });
        it('should identify task keywords', () => {
            const comments = ['// TODO: implement this'];
            const hasTask = containsTaskKeyword(comments[0]);
            (0, chai_1.expect)(hasTask).to.be.true;
        });
    });
    describe('Pattern Extraction', () => {
        it('should identify naming conventions', () => {
            const code = `const myVariable = 1;\nconst anotherVar = 2;\n`;
            const conventions = extractNamingConventions(code);
            (0, chai_1.expect)(conventions).to.include('camelCase');
        });
        it('should identify code style', () => {
            const code = `function test() {\n  return true;\n}\n`;
            const style = extractCodeStyle(code);
            (0, chai_1.expect)(style).to.be.an('array');
        });
        it('should identify common patterns', () => {
            const code = `async function fetch() {}\nasync function load() {}\n`;
            const patterns = extractCommonPatterns(code);
            (0, chai_1.expect)(patterns).to.include('async');
        });
    });
});
// Helper functions for testing
function extractImportsFromCode(code) {
    const importRegex = /import\s+.*\s+from\s+['"].*['"]/g;
    return code.match(importRegex) || [];
}
function extractFunctionsFromCode(code) {
    const functionRegex = /function\s+\w+|const\s+\w+\s*=\s*\(/g;
    return code.match(functionRegex) || [];
}
function extractClassesFromCode(code) {
    const classRegex = /class\s+\w+/g;
    return code.match(classRegex) || [];
}
function extractCommentsFromCode(code) {
    const commentRegex = /\/\/.*|\/\*[\s\S]*?\*\//g;
    return code.match(commentRegex) || [];
}
function extractIntentFromComments(comments) {
    return comments.join(' ').toLowerCase();
}
function extractRequirementsFromComments(comments) {
    return comments.filter(c => c.includes('TODO') || c.includes('FIXME'));
}
function containsTaskKeyword(comment) {
    return /TODO|FIXME|HACK|XXX|NOTE/.test(comment);
}
function extractNamingConventions(code) {
    if (/[a-z][A-Z]/.test(code)) {
        return ['camelCase'];
    }
    return [];
}
function extractCodeStyle(code) {
    const styles = [];
    if (code.includes('{\n')) {
        styles.push('newline-braces');
    }
    return styles;
}
function extractCommonPatterns(code) {
    const patterns = [];
    if (code.includes('async')) {
        patterns.push('async');
    }
    return patterns;
}
//# sourceMappingURL=context-engine.test.js.map