# Inline - Offline Code Completion

Inline is a VS Code extension that delivers intelligent code completion entirely offline. It provides context-aware suggestions and manages local models for optimal performance, ensuring privacy without internet dependency.

## Features

- **Offline-First**: Works completely without internet connection
- **Automatic Model Management**: Download and manage local models through a simple UI
- **URL Download**: Download models directly from Hugging Face or other URLs
- **Drag & Drop Import**: Easily import local GGUF models
- **Language-Specific Optimization**: Optimized models for different programming languages
- **Smart Context Building**: Understands your codebase and learns from patterns
- **Resource Monitoring**: Monitors CPU/memory usage and adjusts accordingly
- **Privacy-Focused**: All processing happens locally on your machine
- **Modern UI**: Premium VS Code-compliant webview with dark/light theme support
- **Performance Optimized**: <500ms completion latency with intelligent caching

## Quick Start

**Prerequisites:**
- Node.js 18+ 
- pnpm (install with `npm install -g pnpm`)

**Automated Setup:**
```bash
./scripts/setup.sh
```

**Manual Setup:**
1. Clone and install dependencies:
   ```bash
   git clone <repository>
   cd inline
   pnpm install
   pnpm run build
   ```

2. Install the extension from VS Code Marketplace
3. Open the Model Manager with `Ctrl+Shift+P` → "Inline: Model Manager"
4. Download a model or import one:
   - **Recommended**: Click "Download" on any model in the "Recommended Models" list (DeepSeek, CodeLlama, etc.)
   - **URL**: Paste a Hugging Face GGUF link
   - **Import**: Drag & drop a `.gguf` file or click "Select File"
5. Start coding! Inline will automatically provide completions

For detailed setup instructions, see [SETUP.md](SETUP.md)

## Supported Models
- **GGUF Support**: Import any `.gguf` model compatible with `llama.cpp`
- **Auto-Detection**: Automatically detects model architecture and parameters

### Lightweight Models (2-4GB VRAM)
- **CodeGemma-2B**: Great for Python/JavaScript
- **StableCode-3B**: Fast, multi-language support
- **Phi-3-mini**: Microsoft's efficient model

### Mid-tier Models (6-8GB VRAM)
- **DeepSeek-Coder-6.7B**: Excellent for complex patterns
- **StarCoder2-7B**: Strong across languages
- **CodeLlama-7B**: Meta's proven model

### Custom Models
You can import your own GGUF models directly through the Model Manager:
1. Open Model Manager
2. Drag and drop your `.gguf` file into the import zone
3. Or paste a download URL (e.g., from Hugging Face)
4. The model will be validated and added to your local library

## Commands

- `Inline: Model Manager` - Open model management UI
- `Inline: Toggle Offline Mode` - Switch between online/offline
- `Inline: Clear Cache` - Clear completion cache
- `Inline: Download Model` - Quick model download
- `Inline: Download Model from URL` - Download directly from a URL
- `Inline: Open Models Folder` - Open the local models directory
- `Inline: Check for Model Updates` - Check for updates
- `Inline: Settings` - Open extension settings
- `Inline: Show Logs` - Show extension logs

## Settings

- `inline.autoOffline`: Automatically activate offline mode
- `inline.defaultModel`: Default model for completions
- `inline.maxTokens`: Maximum tokens for generation
- `inline.temperature`: Model temperature (0-1)
- `inline.cacheSize`: Maximum cache entries
- `inline.resourceMonitoring`: Enable resource monitoring

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Compile in watch mode
pnpm run compile:watch

# Run tests
pnpm test
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm run test:unit          # Unit tests
pnpm run test:integration   # Integration tests
pnpm run test:e2e           # End-to-end tests

# Run with coverage
pnpm run test:coverage
```

See [docs/guides/testing.md](docs/guides/testing.md) for detailed testing guide.

### Building

```bash
# Build extension
pnpm run build

# Package extension
pnpm run package

# Clean build artifacts
pnpm run clean
```

### Releasing

```bash
# Automated release (patch version)
./scripts/release.sh patch "Bug fixes and improvements"

# Minor version release
./scripts/release.sh minor "New features added"

# Major version release
./scripts/release.sh major "Breaking changes"
```

The release script automatically:
- Bumps version in package.json
- Updates CHANGELOG.md
- Updates CATALOG.md
- Runs tests
- Builds and packages the extension
- Creates git tags
- Optionally creates GitHub releases

### Contributing

See [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) for contribution guidelines.

## Requirements

- VS Code 1.85.0 or higher
- Node.js 18.x or higher
- Minimum 4GB RAM (8GB+ recommended)
- Optional: GPU with 6GB+ VRAM for better performance

## Troubleshooting

### Installation Issues
If you encounter errors during installation related to `node-llama-cpp`:
1. Ensure you have C++ build tools installed:
   - **Windows**: Install Visual Studio Build Tools with "Desktop development with C++"
   - **Mac**: Run `xcode-select --install`
   - **Linux**: Install `build-essential` and `cmake`
2. Try rebuilding the dependency: `npm rebuild node-llama-cpp`

### Model Loading Failed
- Verify the model file is a valid `.gguf` file
- Ensure you have enough RAM/VRAM to load the model
- Check the "Inline" output channel for detailed error logs

## Architecture

- **E2E Testing**: Comprehensive test suite with 50+ tests
- **VS Code UI Standards**: Modern webview with theme support
- **Performance**: <500ms completion latency with caching
- **Multi-Language**: TypeScript, Python, JavaScript, and more

See [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md) for project organization.

## Documentation

### Quick Start
- [Quick Reference](QUICK_REFERENCE.md) - Common commands and structure overview

### Project Documentation
- [Folder Structure](docs/FOLDER_STRUCTURE.md) - Project organization
- [Changelog](CHANGELOG.md) - Version history and release notes

### Guides
- [Testing Guide](docs/guides/testing.md) - How to write and run tests
- [Contributing](docs/guides/CONTRIBUTING.md) - Contribution guidelines
- [Release Guide](docs/guides/RELEASE.md) - How to create releases

### Architecture
- [Model Integration](docs/architecture/MODEL_INTEGRATION.md) - Model integration strategy
- [Performance Optimization](docs/architecture/PERFORMANCE_OPTIMIZATION.md) - Performance guide
- [Project Plan](docs/architecture/PROJECT_PLAN.md) - Project roadmap

## License

Apache License 2.0 - see LICENSE file for details

## Contributing

Contributions are welcome! Please read our [contributing guidelines](docs/guides/CONTRIBUTING.md) and submit pull requests.

## Support

- Report issues on GitHub
- Check documentation in `/docs`
- Join our community discussions
