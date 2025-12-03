# Testing Guide

## Overview

This guide explains how to run and write tests for the Inline VS Code extension.

## Test Structure

```
test/
├── e2e/              # End-to-end tests
├── unit/             # Unit tests
├── integration/      # Integration tests (planned)
├── helpers/          # Test utilities
├── mocks/            # Mock objects
└── fixtures/         # Test data
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E tests only
```

### With Coverage
```bash
npm run test:coverage
```

## Writing Tests

### E2E Tests

E2E tests use `@vscode/test-electron` to run tests in a real VS Code instance.

Example:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension } from '../helpers/test-utils';

suite('My Feature E2E Tests', () => {
  suiteSetup(async () => {
    await activateExtension();
  });

  test('Should do something', async () => {
    // Your test code
    assert.ok(true);
  });
});
```

### Unit Tests

Unit tests use Mocha and Chai for assertions.

Example:

```typescript
import { expect } from 'chai';
import { MyClass } from '../../src/my-class';

describe('MyClass Unit Tests', () => {
  it('should work correctly', () => {
    const instance = new MyClass();
    expect(instance.method()).to.equal('expected');
  });
});
```

## Test Utilities

Use the provided test utilities in `test/helpers/test-utils.ts`:

```typescript
import {
  waitFor,
  sleep,
  createTestDocument,
  measureTime,
  activateExtension
} from '../helpers/test-utils';

// Wait for a condition
await waitFor(() => someCondition === true, 5000);

// Create a test document
const doc = await createTestDocument('code here', 'typescript');

// Measure execution time
const { result, duration } = await measureTime(async () => {
  return await someAsyncOperation();
});
```

## Best Practices

1. **Isolate Tests** - Each test should be independent
2. **Clean Up** - Use `teardown` to clean up resources
3. **Use Mocks** - Mock external dependencies
4. **Test Edge Cases** - Don't just test happy paths
5. **Measure Performance** - Use `measureTime` for performance-critical code
6. **Descriptive Names** - Test names should describe what they test

## Debugging Tests

### VS Code Debugger

1. Open `.vscode/launch.json`
2. Add a debug configuration:

```json
{
  "type": "extensionHost",
  "request": "launch",
  "name": "Extension Tests",
  "runtimeExecutable": "${execPath}",
  "args": [
    "--extensionDevelopmentPath=${workspaceFolder}",
    "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
  ]
}
```

3. Set breakpoints and run the debugger

### Console Logging

Use `console.log` in tests for debugging:

```typescript
test('Debug example', () => {
  console.log('Debug info:', someVariable);
  assert.ok(true);
});
```

## CI/CD Integration

Tests run automatically on:

- Every push to main
- Every pull request
- Scheduled nightly builds

See `.github/workflows/test.yml` for CI configuration.
