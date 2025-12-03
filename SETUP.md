# Complete Setup & Testing Guide

## 🚀 Quick Start (Automated)

Run the automated setup script:

```bash
./scripts/setup.sh
```

This will automatically:
1. ✅ Install dependencies
2. ✅ Build the extension
3. ✅ Run linter
4. ✅ Run tests (optional)
5. ✅ Package extension
6. ✅ Install in VS Code (optional)

## 📋 Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Extension

```bash
npm run build
```

### 3. Run Tests

```bash
# All tests
npm test

# Specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

### 4. Package Extension

```bash
npm run package
```

### 5. Install in VS Code

```bash
code --install-extension inline-0.1.0.vsix
```

## 🧪 E2E Testing

### Running E2E Tests

```bash
npm run test:e2e
```

### What E2E Tests Cover

- ✅ Extension activation
- ✅ Command registration
- ✅ Configuration loading
- ✅ Model management
- ✅ Completion provider
- ✅ Network detection
- ✅ UI components
- ✅ Offline mode
- ✅ Cache management

### Test Results

All tests should pass:
```
Extension E2E Tests
  ✓ Extension should be present
  ✓ Extension should activate
  ✓ All commands should be registered
  ✓ Configuration should be loaded
  ✓ Model Manager command should execute
  ...
```

## 🤖 Model Setup

### Download Model (Online)

1. **Open Model Manager**
   ```
   Ctrl+Shift+P → "Inline: Model Manager"
   ```

2. **Select Model**
   - DeepSeek-Coder-6.7B (recommended)
   - CodeGemma-2B (lightweight)
   - StarCoder2-7B (powerful)

3. **Click Download**
   - Progress shown in status bar
   - Model saved automatically

### Import Local Model

1. **Prepare Model File**
   - Format: GGUF, GPTQ, or SAFETENSORS
   - Size: 2GB - 7GB typically

2. **Import**
   ```
   Ctrl+Shift+P → "Inline: Model Manager"
   → "Import Local Model"
   → Select file
   ```

3. **Validation**
   - Extension validates format
   - Checks integrity
   - Ready to use!

## 📴 Offline Mode

### Automatic Offline Detection

The extension automatically detects offline status and switches modes.

**Enable in settings:**
```json
{
  "inline.autoOffline": true
}
```

### Manual Toggle

```
Ctrl+Shift+P → "Inline: Toggle Offline Mode"
```

Or click status bar item.

### Testing Offline Mode

1. Download a model (while online)
2. Disconnect from internet
3. Extension shows "Offline" status
4. Start coding - completions still work!

## ✅ Verification Checklist

Before using the extension:

- [ ] Dependencies installed (`npm install`)
- [ ] Extension built (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Extension packaged (`npm run package`)
- [ ] Extension installed in VS Code
- [ ] Model downloaded
- [ ] Completions work online
- [ ] Completions work offline
- [ ] Status bar shows correctly
- [ ] All commands work

## 🐛 Troubleshooting

### Build Fails

```bash
npm run clean
npm install
npm run build
```

### Tests Fail

```bash
# Check VS Code version
code --version  # Should be 1.85.0+

# Rebuild
npm run clean
npm run build
npm test
```

### Extension Won't Activate

1. Check VS Code version (1.85.0+)
2. View logs: `Ctrl+Shift+P` → "Inline: Show Logs"
3. Check error log: `Ctrl+Shift+P` → "Inline: Show Error Log"
4. Reinstall extension

### Model Download Fails

1. Check internet connection
2. Check disk space (2-7GB needed)
3. Try different model
4. Check firewall settings

### Offline Mode Not Working

1. Ensure model is downloaded first
2. Check `inline.autoOffline` setting
3. Manually toggle offline mode
4. Check model path in settings

## 📚 Documentation

- [E2E Testing Guide](docs/guides/E2E_TESTING_SETUP.md) - Complete testing guide
- [Release Guide](docs/guides/RELEASE.md) - How to create releases
- [Contributing](docs/guides/CONTRIBUTING.md) - Contribution guidelines
- [Testing](docs/guides/testing.md) - Testing documentation

## 🎯 Quick Commands

```bash
# Development
npm run watch          # Watch mode
npm run compile        # Compile only
npm run build          # Full build

# Testing
npm test               # All tests
npm run test:unit      # Unit tests
npm run test:e2e       # E2E tests
npm run test:coverage  # With coverage

# Quality
npm run lint           # Check code style
npm run lint:fix       # Fix code style

# Release
npm run package        # Create .vsix
npm run release        # Automated release
```

## 🚀 Ready to Use!

Once setup is complete:

1. **Reload VS Code** (`Ctrl+Shift+P` → "Reload Window")
2. **Open Model Manager** (`Ctrl+Shift+P` → "Inline: Model Manager")
3. **Download a model** (DeepSeek-Coder-6.7B recommended)
4. **Start coding** - AI completions appear automatically!

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024-12-04
