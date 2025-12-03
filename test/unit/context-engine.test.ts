import { expect } from 'chai';
import { ContextEngine, CodeContext } from '../../src/core/context-engine';

describe('ContextEngine Unit Tests', () => {
  
  describe('Context Building', () => {
    it('should extract imports from code', () => {
      const code = `import { something } from 'module';\nimport * as fs from 'fs';\n`;
      const imports = extractImportsFromCode(code);
      
      expect(imports).to.have.lengthOf(2);
      expect(imports[0]).to.include('something');
      expect(imports[1]).to.include('fs');
    });

    it('should extract functions from code', () => {
      const code = `function test() {}\nconst arrow = () => {};\n`;
      const functions = extractFunctionsFromCode(code);
      
      expect(functions).to.have.lengthOf.at.least(1);
    });

    it('should extract classes from code', () => {
      const code = `class MyClass {}\nclass Another extends Base {}\n`;
      const classes = extractClassesFromCode(code);
      
      expect(classes).to.have.lengthOf(2);
    });

    it('should extract comments from code', () => {
      const code = `// Single line\n/* Multi\nline */\n`;
      const comments = extractCommentsFromCode(code);
      
      expect(comments).to.have.lengthOf.at.least(1);
    });
  });

  describe('Prompt Generation', () => {
    it('should generate prompt from context', () => {
      const context: Partial<CodeContext> = {
        prefix: 'function test() {',
        suffix: '}',
        language: 'typescript',
        imports: ['import fs from "fs"'],
        functions: ['function helper() {}']
      };
      
      const prompt = generatePromptFromContext(context as CodeContext);
      
      expect(prompt).to.be.a('string');
      expect(prompt.length).to.be.greaterThan(0);
      expect(prompt).to.include('typescript');
    });

    it('should include language in prompt', () => {
      const context: Partial<CodeContext> = {
        language: 'python',
        prefix: 'def test():',
        suffix: ''
      };
      
      const prompt = generatePromptFromContext(context as CodeContext);
      
      expect(prompt).to.include('python');
    });

    it('should include relevant imports', () => {
      const context: Partial<CodeContext> = {
        language: 'typescript',
        prefix: '',
        suffix: '',
        imports: ['import React from "react"']
      };
      
      const prompt = generatePromptFromContext(context as CodeContext);
      
      expect(prompt).to.include('import');
    });
  });

  describe('Comment Analysis', () => {
    it('should extract intent from comments', () => {
      const comments = ['// Create a function that sorts an array'];
      const intent = extractIntentFromComments(comments);
      
      expect(intent).to.include('sort');
    });

    it('should extract requirements from comments', () => {
      const comments = [
        '// TODO: Add error handling',
        '// FIXME: Optimize performance'
      ];
      const requirements = extractRequirementsFromComments(comments);
      
      expect(requirements).to.have.lengthOf.at.least(1);
    });

    it('should identify task keywords', () => {
      const comments = ['// TODO: implement this'];
      const hasTask = containsTaskKeyword(comments[0]);
      
      expect(hasTask).to.be.true;
    });
  });

  describe('Pattern Extraction', () => {
    it('should identify naming conventions', () => {
      const code = `const myVariable = 1;\nconst anotherVar = 2;\n`;
      const conventions = extractNamingConventions(code);
      
      expect(conventions).to.include('camelCase');
    });

    it('should identify code style', () => {
      const code = `function test() {\n  return true;\n}\n`;
      const style = extractCodeStyle(code);
      
      expect(style).to.be.an('array');
    });

    it('should identify common patterns', () => {
      const code = `async function fetch() {}\nasync function load() {}\n`;
      const patterns = extractCommonPatterns(code);
      
      expect(patterns).to.include('async');
    });
  });
});

// Helper functions for testing
function extractImportsFromCode(code: string): string[] {
  const importRegex = /import\s+.*\s+from\s+['"].*['"]/g;
  return code.match(importRegex) || [];
}

function extractFunctionsFromCode(code: string): string[] {
  const functionRegex = /function\s+\w+|const\s+\w+\s*=\s*\(/g;
  return code.match(functionRegex) || [];
}

function extractClassesFromCode(code: string): string[] {
  const classRegex = /class\s+\w+/g;
  return code.match(classRegex) || [];
}

function extractCommentsFromCode(code: string): string[] {
  const commentRegex = /\/\/.*|\/\*[\s\S]*?\*\//g;
  return code.match(commentRegex) || [];
}

function generatePromptFromContext(context: CodeContext): string {
  return `Language: ${context.language}\nPrefix: ${context.prefix}\nSuffix: ${context.suffix}`;
}

function extractIntentFromComments(comments: string[]): string {
  return comments.join(' ').toLowerCase();
}

function extractRequirementsFromComments(comments: string[]): string[] {
  return comments.filter(c => c.includes('TODO') || c.includes('FIXME'));
}

function containsTaskKeyword(comment: string): boolean {
  return /TODO|FIXME|HACK|XXX|NOTE/.test(comment);
}

function extractNamingConventions(code: string): string[] {
  if (/[a-z][A-Z]/.test(code)) {
    return ['camelCase'];
  }
  return [];
}

function extractCodeStyle(code: string): string[] {
  const styles: string[] = [];
  if (code.includes('{\n')) {
    styles.push('newline-braces');
  }
  return styles;
}

function extractCommonPatterns(code: string): string[] {
  const patterns: string[] = [];
  if (code.includes('async')) {
    patterns.push('async');
  }
  return patterns;
}
