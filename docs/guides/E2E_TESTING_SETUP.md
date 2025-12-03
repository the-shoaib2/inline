# Complete E2E Testing & Setup Guide

## Overview

This guide covers the complete process for building, testing, and using the Inline VS Code extension with proper E2E testing, model download/import, and offline functionality.

## Prerequisites

- Node.js 18.x or higher
- VS Code 1.85.0 or higher
- 4GB+ RAM (8GB+ recommended)
- Optional: GPU with 6GB+ VRAM

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This will:
- Clean previous builds
- Compile TypeScript to JavaScript
- Output to `out/` directory

### 3. Run Tests

```bash
# Run all tests
npm test

# Or run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:e2e           # End-to-end tests
```

### 4. Package the Extension

```bash
npm run package
```

This creates a `.vsix` file you can install in VS Code.

### 5. Install & Test Locally

```bash
# Install the extension
code --install-extension inline-0.1.0.vsix

# Or press F5 in VS Code to launch Extension Development Host
```

## E2E Testing Setup

### Test Structure

```
test/
├── e2e/                    # End-to-end tests
│   ├── extension.test.ts   # Extension activation tests
│   ├── model-manager.test.ts  # Model management tests
│   ├── completion.test.ts  # Completion provider tests
│   ├── network.test.ts     # Network detection tests
│   └── ui.test.ts          # UI interaction tests
├── fixtures/               # Test data
│   └── sample-workspace/   # Sample code for testing
├── helpers/                # Test utilities
│   └── test-utils.ts       # Helper functions
└── mocks/                  # Mock objects
    └── model-mock.ts       # Model mocks
```

### Running E2E Tests

```bash
# Run E2E tests with VS Code Test Runner
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode (for development)
npm run watch
# Then press F5 to run tests
```

### E2E Test Coverage

The E2E tests cover:

1. **Extension Activation**
   - Extension loads correctly
   - All commands registered
   - Configuration loaded
   - Status bar initialized

2. **Model Management**
   - Model download simulation
   - Model validation
   - Model selection
   - Resource monitoring

3. **Completion Provider**
   - Code completion generation
   - Context building
   - Cache management
   - Offline mode

4. **Network Detection**
   - Online/offline detection
   - Automatic offline mode
   - Network status updates

5. **UI Components**
   - Webview rendering
   - Status bar updates
   - Command execution

## Model Download & Import

### Option 1: Download from Ollama (Recommended)

1. **Open Model Manager**
   ```
   Ctrl+Shift+P → "Inline: Model Manager"
   ```

2. **Select a Model**
   - DeepSeek-Coder-6.7B (recommended)
   - CodeGemma-2B (lightweight)
   - StarCoder2-7B (powerful)

3. **Click Download**
   - Progress shown in status bar
   - Model saved to `resources/models/`

### Option 2: Import Local Model

1. **Prepare Your Model**
   - Supported formats: GGUF, GPTQ, SAFETENSORS
   - Place in accessible location

2. **Import via Model Manager**
   ```
   Ctrl+Shift+P → "Inline: Model Manager"
   → "Import Local Model"
   → Select your model file
   ```

3. **Model Validation**
   - Extension validates format
   - Checks file integrity
   - Estimates resource requirements

### Option 3: Download from Hugging Face

1. **Open Model Manager**
2. **Select "Hugging Face" tab**
3. **Search for models**
   - Filter by language
   - Filter by size
   - Filter by license
4. **Download directly**

### Model Storage

Models are stored in:
```
~/.vscode/extensions/inline.inline-0.1.0/resources/models/
```

Or configured location in settings:
```json
{
  "inline.modelPath": "/custom/path/to/models"
}
```

## Offline Mode Setup

### Automatic Offline Mode

The extension automatically detects when you're offline and switches to offline mode.

**Configuration:**
```json
{
  "inline.autoOffline": true  // Enable automatic offline mode
}
```

### Manual Offline Mode

Toggle offline mode manually:
```
Ctrl+Shift+P → "Inline: Toggle Offline Mode"
```

Or click the status bar item.

### Offline Mode Features

When offline:
- ✅ Uses locally downloaded models
- ✅ All completions work
- ✅ Cache is used for faster responses
- ✅ No internet connection required
- ✅ Privacy-focused (no data sent)

### Testing Offline Mode

1. **Download a model first** (while online)
2. **Disconnect from internet**
3. **Extension automatically switches to offline mode**
4. **Start coding - completions still work!**

## Complete Setup Workflow

### Step 1: Build & Install

```bash
# Clone/navigate to project
cd inline

# Install dependencies
npm install

# Build extension
npm run build

# Run tests to verify
npm test

# Package extension
npm run package

# Install in VS Code
code --install-extension inline-0.1.0.vsix
```

### Step 2: Configure Extension

Open VS Code settings (`Ctrl+,`) and configure:

```json
{
  // Basic settings
  "inline.autoOffline": true,
  "inline.defaultModel": "deepseek-coder:6.7b",
  "inline.maxTokens": 512,
  "inline.temperature": 0.1,
  
  // Performance settings
  "inline.cacheSize": 100,
  "inline.resourceMonitoring": true,
  
  // Optional: Custom model path
  "inline.modelPath": "/path/to/models"
}
```

### Step 3: Download Models

1. Open Model Manager: `Ctrl+Shift+P` → "Inline: Model Manager"
2. Choose a model:
   - **For beginners**: CodeGemma-2B (2GB, fast)
   - **Recommended**: DeepSeek-Coder-6.7B (6GB, balanced)
   - **Advanced**: StarCoder2-7B (7GB, powerful)
3. Click "Download"
4. Wait for download to complete

### Step 4: Test Completion

1. Open a code file (e.g., `.ts`, `.js`, `.py`)
2. Start typing
3. Inline suggestions appear automatically
4. Press `Tab` to accept suggestion

### Step 5: Test Offline Mode

1. Disconnect from internet
2. Extension shows "Offline" in status bar
3. Continue coding - completions still work!

## Troubleshooting

### Build Issues

**Problem**: TypeScript compilation errors

**Solution**:
```bash
npm run clean
npm install
npm run build
```

### Test Failures

**Problem**: E2E tests fail

**Solution**:
```bash
# Check VS Code version
code --version  # Should be 1.85.0+

# Rebuild and test
npm run clean
npm run build
npm test
```

### Model Download Issues

**Problem**: Model download fails

**Solution**:
1. Check internet connection
2. Try a different model
3. Check disk space (models are 2-7GB)
4. Check firewall settings

### Offline Mode Not Working

**Problem**: Completions don't work offline

**Solution**:
1. Ensure a model is downloaded first
2. Check `inline.autoOffline` setting
3. Manually toggle offline mode
4. Check model path in settings

### Extension Not Activating

**Problem**: Extension doesn't load

**Solution**:
1. Check VS Code version (1.85.0+)
2. Check extension logs: `Ctrl+Shift+P` → "Inline: Show Logs"
3. Check error log: `Ctrl+Shift+P` → "Inline: Show Error Log"
4. Reinstall extension

## Testing Checklist

Before releasing, verify:

- [ ] Extension builds without errors
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Extension activates in VS Code
- [ ] All commands work
- [ ] Model download works
- [ ] Model import works
- [ ] Completions work online
- [ ] Completions work offline
- [ ] Status bar updates correctly
- [ ] Cache works properly
- [ ] Settings are respected
- [ ] No memory leaks
- [ ] Performance is acceptable (<500ms)

## Performance Testing

### Completion Latency

Target: <500ms from trigger to suggestion

**Test**:
```bash
npm run benchmark
```

### Memory Usage

Target: <500MB with model loaded

**Monitor**:
1. Open VS Code
2. Help → Toggle Developer Tools
3. Performance tab
4. Monitor memory usage

### Cache Hit Rate

Target: >80% cache hit rate

**Check**:
```
Ctrl+Shift+P → "Inline: Show Logs"
```

Look for cache statistics.

## Automated Testing

### CI/CD Integration

Create `.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm test
```

### Pre-commit Hooks

Install husky for pre-commit testing:

```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npm test"
```

## Development Workflow

### Day-to-Day Development

```bash
# Start watch mode
npm run watch

# In VS Code, press F5 to launch Extension Development Host
# Make changes, save, reload window to test
```

### Before Committing

```bash
# Run linter
npm run lint:fix

# Run all tests
npm test

# Build to verify
npm run build
```

### Before Releasing

```bash
# Run full test suite
npm run test:coverage

# Build and package
npm run build
npm run package

# Test the .vsix file
code --install-extension inline-0.1.0.vsix

# Create release
./scripts/release.sh patch "Bug fixes and improvements"
```

## Advanced Testing

### Custom Test Scenarios

Create custom E2E tests in `test/e2e/`:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Custom E2E Tests', () => {
  test('My custom test', async () => {
    // Your test code
    assert.ok(true);
  });
});
```

### Mock Model Testing

Use mock models for faster testing:

```typescript
import { ModelMock } from '../mocks/model-mock';

const mockModel = new ModelMock();
// Use mock model in tests
```

### Performance Profiling

Profile extension performance:

```bash
# Run with profiling
code --prof-startup --disable-extensions

# Analyze profile
code --prof-startup-analyze
```

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Mocha Testing Framework](https://mochajs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

- Report issues on GitHub
- Check logs: `Ctrl+Shift+P` → "Inline: Show Logs"
- Check error log: `Ctrl+Shift+P` → "Inline: Show Error Log"
- Read documentation in `/docs`

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024-12-04
