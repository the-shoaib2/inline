# E2E Testing Guide for Multiple Languages

This guide provides E2E testing suggestions and examples for the Inline extension across different programming languages.

## Overview

The Inline extension supports code completion for multiple programming languages. This document outlines how to write E2E tests for each supported language to ensure the extension works correctly.

## Test Structure

All E2E tests should follow this general structure:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Language E2E Tests', () => {
    test('Should provide completions for [language]', async () => {
        // 1. Open a test file
        // 2. Trigger completion
        // 3. Verify completion results
        // 4. Clean up
    });
});
```

## Language-Specific Test Examples

### C Language (.c)

```typescript
suite('C Language E2E Tests', () => {
    test('Should provide C function completions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'c',
            content: `#include <stdio.h>\n\nint main() {\n    printf(\n`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(3, 11); // After 'printf('
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        assert.ok(completions.items.length > 0);
    });
    
    test('Should complete C struct definitions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'c',
            content: `struct Point {\n    int x;\n    int y;\n};\n\nstruct Point p;\np.`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(6, 2); // After 'p.'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasXorY = completions.items.some(item => 
            item.label === 'x' || item.label === 'y'
        );
        assert.ok(hasXorY, 'Should suggest struct members');
    });
});
```

### C++ Language (.cpp, .cc, .cxx)

```typescript
suite('C++ Language E2E Tests', () => {
    test('Should provide C++ class completions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'cpp',
            content: `#include <iostream>\n\nclass MyClass {\npublic:\n    void myMethod() {\n        std::\n`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(5, 13); // After 'std::'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasCout = completions.items.some(item => item.label.includes('cout'));
        assert.ok(hasCout, 'Should suggest std namespace members');
    });
    
    test('Should complete C++ templates', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'cpp',
            content: `#include <vector>\n\nstd::vector<int> vec;\nvec.`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(3, 4); // After 'vec.'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasPushBack = completions.items.some(item => item.label.includes('push_back'));
        assert.ok(hasPushBack, 'Should suggest vector methods');
    });
});
```

### Shell/Bash (.sh, .bash)

```typescript
suite('Shell Script E2E Tests', () => {
    test('Should provide shell command completions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'shellscript',
            content: `#!/bin/bash\n\nif [ -f "$1" ]; then\n    `
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(3, 4); // Inside if block
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        assert.ok(completions.items.length > 0);
    });
    
    test('Should complete shell variables', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'shellscript',
            content: `#!/bin/bash\n\nMY_VAR="test"\necho $`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(3, 6); // After '$'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasMyVar = completions.items.some(item => item.label.includes('MY_VAR'));
        assert.ok(hasMyVar, 'Should suggest defined variables');
    });
});
```

### Java (.java)

```typescript
suite('Java Language E2E Tests', () => {
    test('Should provide Java class completions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'java',
            content: `public class Main {\n    public static void main(String[] args) {\n        System.out.\n`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(2, 19); // After 'System.out.'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasPrintln = completions.items.some(item => item.label.includes('println'));
        assert.ok(hasPrintln, 'Should suggest System.out methods');
    });
    
    test('Should complete Java imports', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'java',
            content: `import java.util.\n\npublic class Main {}`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(0, 17); // After 'java.util.'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasList = completions.items.some(item => item.label.includes('List'));
        assert.ok(hasList, 'Should suggest java.util classes');
    });
});
```

### Python (.py)

```typescript
suite('Python Language E2E Tests', () => {
    test('Should provide Python function completions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'python',
            content: `def my_function():\n    print(\n`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(1, 10); // After 'print('
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        assert.ok(completions.items.length > 0);
    });
    
    test('Should complete Python imports', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'python',
            content: `import os\n\nos.`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(2, 3); // After 'os.'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasPath = completions.items.some(item => item.label.includes('path'));
        assert.ok(hasPath, 'Should suggest os module members');
    });
    
    test('Should complete Python class methods', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'python',
            content: `class MyClass:\n    def __init__(self):\n        self.value = 10\n    \n    def get_value(self):\n        return self.`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(5, 20); // After 'self.'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasValue = completions.items.some(item => item.label.includes('value'));
        assert.ok(hasValue, 'Should suggest class attributes');
    });
});
```

### JavaScript (.js)

```typescript
suite('JavaScript Language E2E Tests', () => {
    test('Should provide JavaScript completions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'javascript',
            content: `const arr = [1, 2, 3];\narr.`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(1, 4); // After 'arr.'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasMap = completions.items.some(item => item.label.includes('map'));
        assert.ok(hasMap, 'Should suggest array methods');
    });
});
```

### TypeScript (.ts)

```typescript
suite('TypeScript Language E2E Tests', () => {
    test('Should provide TypeScript type completions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: `interface User {\n    name: string;\n    age: number;\n}\n\nconst user: User = {\n    `
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(6, 4); // Inside object literal
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasName = completions.items.some(item => item.label === 'name');
        const hasAge = completions.items.some(item => item.label === 'age');
        assert.ok(hasName && hasAge, 'Should suggest interface properties');
    });
});
```

### Go (.go)

```typescript
suite('Go Language E2E Tests', () => {
    test('Should provide Go package completions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'go',
            content: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(5, 8); // After 'fmt.'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasPrintln = completions.items.some(item => item.label.includes('Println'));
        assert.ok(hasPrintln, 'Should suggest fmt package functions');
    });
});
```

### Rust (.rs)

```typescript
suite('Rust Language E2E Tests', () => {
    test('Should provide Rust completions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'rust',
            content: `fn main() {\n    let vec = vec![1, 2, 3];\n    vec.`
        });
        
        await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(2, 8); // After 'vec.'
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions);
        const hasPush = completions.items.some(item => item.label.includes('push'));
        assert.ok(hasPush, 'Should suggest Vec methods');
    });
});
```

## Running E2E Tests

To run E2E tests for all languages:

```bash
# Run all E2E tests
pnpm run test:e2e

# Run specific language tests
pnpm run test:e2e -- --grep "C Language"
pnpm run test:e2e -- --grep "Python"
pnpm run test:e2e -- --grep "Java"
```

## Test File Organization

Organize E2E tests by language:

```
test/
├── e2e/
│   ├── c.test.ts
│   ├── cpp.test.ts
│   ├── shell.test.ts
│   ├── java.test.ts
│   ├── python.test.ts
│   ├── javascript.test.ts
│   ├── typescript.test.ts
│   ├── go.test.ts
│   └── rust.test.ts
```

## Best Practices

1. **Use Real Code Samples**: Test with realistic code snippets that users would actually write
2. **Test Edge Cases**: Include tests for edge cases like empty files, syntax errors, etc.
3. **Verify Context Awareness**: Ensure completions are context-appropriate
4. **Test Performance**: Monitor completion response times
5. **Clean Up**: Always dispose of test documents after tests complete

## Language-Specific Considerations

### C/C++
- Test header file completions
- Verify preprocessor directive handling
- Test macro expansions

### Shell Scripts
- Test environment variable completions
- Verify command substitution handling
- Test function definitions

### Java
- Test package imports
- Verify annotation completions
- Test generic type parameters

### Python
- Test decorator completions
- Verify virtual environment awareness
- Test async/await syntax

### JavaScript/TypeScript
- Test ES6+ syntax
- Verify JSX/TSX support
- Test module imports (CommonJS, ESM)

## Troubleshooting

If tests fail:

1. Check that the language extension is installed
2. Verify the model supports the language
3. Check context window size settings
4. Review exclude patterns in configuration
5. Ensure test files are not in excluded directories

## Contributing

When adding support for a new language:

1. Create a new test file in `test/e2e/`
2. Add language-specific test cases
3. Update this documentation
4. Ensure tests pass in CI/CD pipeline
