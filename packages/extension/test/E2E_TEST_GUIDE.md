# E2E Testing Guide

## Overview

This guide explains how to run comprehensive end-to-end tests for all 154 features across 40+ programming languages.

## Quick Start

### Run All Tests

```bash
pnpm test:e2e:all
```

This will:
1. Generate language fixtures for all 40+ languages
2. Create test matrix mapping features to languages
3. Run all E2E tests
4. Generate comprehensive HTML reports

### Run Specific Test Categories

```bash
# Test only completion features
pnpm test:e2e:completion

# Test specific language
pnpm test:e2e:language -- typescript

# Test specific feature
pnpm test:e2e:feature -- completion
```

## Test Organization

### Test Structure

```
test/e2e/
├── framework/              # Test infrastructure
│   ├── test-framework.ts          # Core test runner
│   ├── language-test-generator.ts # Auto-generates tests
│   └── feature-test-matrix.ts     # Feature-language mapping
├── features/               # Feature-specific tests
│   ├── completion-all-languages.test.ts
│   ├── generation-all-languages.test.ts
│   ├── validation-all-languages.test.ts
│   └── ...
├── system/                 # System feature tests
│   ├── caching-optimization.test.ts
│   ├── model-management.test.ts
│   └── ...
├── integration/            # Integration tests
│   ├── feature-interactions.test.ts
│   └── multi-language-workflows.test.ts
└── helpers/                # Test utilities
    ├── language-fixture-generator.ts
    └── test-reporter.ts
```

### Language Fixtures

Language fixtures are automatically generated for all supported languages:

```
test/fixtures/languages/
├── typescript/
│   ├── basic.ts
│   ├── class-example.ts
│   ├── function-example.ts
│   ├── import-example.ts
│   └── error-example.ts
├── python/
│   ├── basic.py
│   ├── class-example.py
│   └── ...
└── ... (40+ languages)
```

## Test Categories

### 1. Code Intelligence Tests (22 features)

Tests all code completion and intelligence features:
- Single-line completion
- Multi-line completion
- Function generation
- Class scaffolding
- Import auto-addition
- Parameter suggestions
- And more...

### 2. Code Generation Tests (15 features)

Tests code generation capabilities:
- Function from signature
- Test generation
- Documentation generation
- CRUD operations
- API endpoints
- And more...

### 3. Validation Tests (7 features)

Tests error detection and validation:
- Syntax error highlighting
- Semantic error detection
- Type checking
- Linting
- Security scanning
- And more...

### 4. Navigation Tests (4 features)

Tests code navigation:
- Go to definition
- Find references
- Navigate to symbol
- Navigate to file

### 5. Refactoring Tests (6 features)

Tests refactoring capabilities:
- Rename symbol
- Extract variable
- Extract function
- Inline variable
- And more...

### 6. System Tests

Tests system-level features:
- Caching and optimization
- Model management
- Resource management
- Event tracking
- Network and offline mode

### 7. Integration Tests

Tests complex workflows:
- Multi-feature interactions
- Multi-language projects
- End-to-end workflows

## Running Tests

### Prerequisites

```bash
# Ensure dependencies are installed
pnpm install

# Compile TypeScript
pnpm compile
```

### Generate Fixtures

```bash
# Generate language fixtures
pnpm test:e2e:fixtures
```

This creates sample code files for all 40+ languages.

### Generate Test Matrix

```bash
# Generate feature-language test matrix
pnpm test:e2e:matrix
```

This creates a JSON file mapping which features apply to which languages.

### Run Tests by Language

```bash
# Test TypeScript
pnpm test:e2e:language -- typescript

# Test Python
pnpm test:e2e:language -- python

# Test all languages
pnpm test:e2e:all
```

### Run Tests by Feature

```bash
# Test completion features
pnpm test:e2e:completion

# Test generation features
pnpm test:e2e:generation

# Test validation features
pnpm test:e2e:validation

# Test navigation features
pnpm test:e2e:navigation

# Test refactoring features
pnpm test:e2e:refactoring
```

### Generate Reports

```bash
# Generate HTML test report
pnpm test:e2e:report
```

Reports are saved to `test/fixtures/test-workspace/`.

## Test Results

### Console Output

Tests provide real-time console output:

```
================================================================================
E2E Test Suite - All Features & All Languages
================================================================================

[1/5] Generating language fixtures...
✓ Language fixtures generated

[2/5] Generating test matrix...
✓ Test matrix generated:
  - Languages: 40
  - Features: 154
  - Total tests: 6,240

[3/5] Generating test expectations...
✓ Test expectations generated:
  - Total expectations: 6,240
  - Unique features: 154
  - Unique languages: 40

[4/5] Running completion tests...
Running test suite: Single-line Completion - All Languages
  Running: Single-line completion - typescript (typescript)
  ✓ Single-line completion - typescript (45ms)
  Running: Single-line completion - python (python)
  ✓ Single-line completion - python (38ms)
  ...

✓ Completion tests completed

[5/5] Generating final report...
✓ All tests completed!

================================================================================
Test execution finished. Check reports in test/fixtures/test-workspace/
================================================================================
```

### HTML Reports

HTML reports include:
- Summary statistics (total, passed, failed, pass rate)
- Results by feature
- Results by language
- Detailed test results with errors
- Performance metrics

### JSON Export

Test results can be exported to JSON:

```json
{
  "statistics": {
    "total": 6240,
    "passed": 6100,
    "failed": 140,
    "passRate": 97.76,
    "totalDuration": 450000,
    "avgDuration": 72.12
  },
  "results": [...]
}
```

## Test Coverage

### Feature Coverage

All 154 implemented features are tested:
- ✅ Code Completion (13 features)
- ✅ Code Generation (15 features)
- ✅ Code Understanding (9 features)
- ✅ Code Navigation (4 features)
- ✅ Refactoring (6 features)
- ✅ Code Actions (5 features)
- ✅ Error Detection (7 features)
- ✅ Error Assistance (3 features)
- ✅ Smart Commands (7 features)
- ✅ Testing Features (5 features)
- ✅ And 80+ more...

### Language Coverage

All 40+ languages are tested:
- ✅ TypeScript/JavaScript
- ✅ Python
- ✅ Java
- ✅ C/C++
- ✅ Go
- ✅ Rust
- ✅ PHP
- ✅ Ruby
- ✅ Swift
- ✅ Kotlin
- ✅ C#
- ✅ And 30+ more...

## Performance Benchmarks

### Target Metrics

- **Completion Latency**: < 100ms
- **Memory Usage**: < 2GB
- **Cache Hit Rate**: > 80%
- **Test Execution Time**: 30-60 minutes (full suite)

### Monitoring

Performance metrics are collected during test execution:
- Individual test duration
- Average duration per feature
- Average duration per language
- Total execution time

## Troubleshooting

### Common Issues

#### Tests Timeout

If tests timeout, increase the timeout in `.vscode-test.mjs`:

```javascript
mocha: {
    timeout: 30000  // Increase from 20000
}
```

#### Out of Memory

For large test suites, increase Node memory:

```bash
NODE_OPTIONS=--max-old-space-size=4096 pnpm test:e2e:all
```

#### Extension Not Activated

Ensure the extension is properly activated:
- Check `extension.ts` activation events
- Verify all dependencies are installed
- Check VS Code version compatibility

### Debug Mode

Run tests with debug output:

```bash
DEBUG=* pnpm test:e2e:all
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:e2e:all
      - uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: test/fixtures/test-workspace/*.html
```

## Contributing

### Adding Tests for New Languages

1. Add language definition to `src/resources/languages.json`
2. Run `pnpm test:e2e:fixtures` to generate fixtures
3. Run `pnpm test:e2e:matrix` to update test matrix
4. Run tests: `pnpm test:e2e:language -- <language>`

### Adding Tests for New Features

1. Add feature to `src/system/feature-registry.ts`
2. Create test suite in `test/e2e/features/`
3. Update `run-all-tests.ts` to include new suite
4. Run tests: `pnpm test:e2e:feature -- <feature>`

## Best Practices

1. **Run tests locally** before pushing
2. **Check test reports** for failures
3. **Update fixtures** when adding new languages
4. **Document known limitations** in test expectations
5. **Monitor performance metrics** to catch regressions

## Support

For issues or questions:
- Check the [TEST_GUIDE.md](./TEST_GUIDE.md)
- Review test reports in `test/fixtures/test-workspace/`
- Check console output for detailed error messages
