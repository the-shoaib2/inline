# Tree-sitter E2E Testing Guide

## Overview

Comprehensive E2E tests for Tree-sitter integration covering all features across multiple languages.

## Test Suites

### 1. Core Tree-sitter Tests (`tree-sitter.test.ts`)

**Decorator Detection Tests:**
- TypeScript: @Component, @Injectable, @Input, @Output
- Python: @property, @app.route(), @login_required
- Rust: #[derive], #[test], #[cfg(test)]
- Java: @Override, @RestController, @GetMapping
- C#: [Serializable], [HttpGet]
- Kotlin: @Deprecated, @JvmStatic

**Generic Extraction Tests:**
- TypeScript: Simple generics, constrained generics, class generics
- Java: Generic classes, generic methods with constraints

**Multi-Language Parsing Tests:**
- TypeScript, Python, Rust, Java, Go, C/C++, Ruby, PHP
- Verifies AST generation for each language

**Performance Tests:**
- Large file parsing (<1s for 1000 components)
- Parser caching efficiency

### 2. Integration Tests (`integration.test.ts`)

**Context Building:**
- Decorators included in CodeContext
- Generics included in CodeContext
- Full semantic analysis

**Real-World Examples:**
- Angular components with multiple decorators
- NestJS controllers with REST decorators
- Django views with authentication decorators
- Rust structs with derive attributes

**Error Handling:**
- Invalid/broken code
- Unsupported languages
- Graceful degradation

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Tree-sitter Tests Only
```bash
npm test -- --grep "Tree-sitter"
```

### Run Integration Tests
```bash
npm test -- --grep "Integration with LLM"
```

### Run Specific Test Suite
```bash
npm test -- --grep "Decorator Detection"
npm test -- --grep "Generic Extraction"
npm test -- --grep "Multi-Language"
```

## Test Coverage

### Languages Tested
- ✅ TypeScript (decorators + generics)
- ✅ JavaScript
- ✅ Python (decorators)
- ✅ Rust (attributes)
- ✅ Java (annotations + generics)
- ✅ Go
- ✅ C/C++
- ✅ Ruby
- ✅ PHP
- ✅ C#
- ✅ Swift
- ✅ Kotlin
- ✅ Scala

### Features Tested
- ✅ Decorator/Attribute detection (6 languages)
- ✅ Generic type extraction (2 languages)
- ✅ AST parsing (all languages)
- ✅ Context building
- ✅ Performance
- ✅ Error handling
- ✅ Caching

## Expected Results

### Decorator Detection
```typescript
// Input
@Component({ selector: 'app-root' })
class AppComponent {
  @Input() name: string;
}

// Expected Output
decorators: [
  { name: 'Component', arguments: '{ selector: \'app-root\' }', lineNumber: 0 },
  { name: 'Input', lineNumber: 2 }
]
```

### Generic Extraction
```typescript
// Input
function map<T extends Base>(arr: T[]): T[] { }

// Expected Output
generics: [
  { name: 'T', constraint: 'Base', lineNumber: 0 }
]
```

## Debugging Tests

### Enable Verbose Logging
```bash
DEBUG=tree-sitter:* npm test
```

### Run Single Test
```typescript
test.only('Should detect @Component decorator', async () => {
  // Test code
});
```

### View Test Output
```bash
npm test -- --reporter spec
```

## Performance Benchmarks

### Target Metrics
- **Small file** (<100 lines): <5ms
- **Medium file** (100-1000 lines): <50ms
- **Large file** (1000+ lines): <500ms
- **Parser cache hit**: <1ms

### Actual Results
Run tests to see actual performance metrics.

## Troubleshooting

### Tests Failing
1. **Check WASM files**: Ensure all WASM files are in `resources/tree-sitter-wasms/`
2. **Check query files**: Ensure query files exist for the language
3. **Check extension activation**: Extension must be activated before tests run

### Slow Tests
1. **Increase timeout**: `this.timeout(30000)`
2. **Check LLM connection**: Ensure model is loaded
3. **Check file size**: Large files may take longer

### No Decorators Found
1. **Check language support**: `treeSitterService.isSupported(language)`
2. **Check query file**: Ensure `decorators.scm` exists
3. **Check syntax**: Ensure code is valid

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  timeout-minutes: 10
```

### Pre-commit Hook
```bash
#!/bin/sh
npm run test:e2e -- --bail
```

## Next Steps

1. **Add more languages**: Create tests for remaining 18 languages
2. **Add performance tests**: Benchmark all languages
3. **Add regression tests**: Prevent future breakage
4. **Add visual tests**: Screenshot-based testing for UI

## Contributing

When adding new tests:
1. Follow existing test structure
2. Add descriptive test names
3. Include expected output in comments
4. Test both success and failure cases
5. Add performance assertions where relevant
