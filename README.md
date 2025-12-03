# Inline - Offline AI Code Completion

Inline is a VS Code extension that delivers GitHub Copilot-like AI code completion entirely offline. It automatically manages local LLM models and optimizes suggestions for your programming languages, ensuring privacy and performance without internet dependency.

## Features

- **Offline-First**: Works completely without internet connection
- **Automatic Model Management**: Download and manage LLM models through a simple UI
- **Language-Specific Optimization**: Optimized models for different programming languages
- **Smart Context Building**: Understands your codebase and learns from patterns
- **Resource Monitoring**: Monitors CPU/memory usage and adjusts accordingly
- **Privacy-Focused**: All processing happens locally on your machine
- **Modern UI**: VS Code-compliant webview with dark/light theme support
- **Performance Optimized**: <500ms completion latency with intelligent caching

## Quick Start

1. Install the extension from VS Code Marketplace
2. Open the Model Manager with `Ctrl+Shift+P` → "Inline: Model Manager"
3. Download your preferred model (recommended: DeepSeek-Coder-6.7B)
4. Start coding! Inline will automatically provide completions

## Supported Models

### Lightweight Models (2-4GB VRAM)
- **CodeGemma-2B**: Great for Python/JavaScript
- **StableCode-3B**: Fast, multi-language support
- **Phi-3-mini**: Microsoft's efficient model

### Mid-tier Models (6-8GB VRAM)
- **DeepSeek-Coder-6.7B**: Excellent for complex patterns
- **StarCoder2-7B**: Strong across languages
- **CodeLlama-7B**: Meta's proven model

## Commands

- `Inline: Model Manager` - Open model management UI
- `Inline: Toggle Offline Mode` - Switch between online/offline
- `Inline: Clear Cache` - Clear completion cache
- `Inline: Download Model` - Quick model download
- `Inline: Settings` - Open extension settings

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
npm install

# Compile in watch mode
npm run watch

# Run tests
npm test
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e           # End-to-end tests

# Run with coverage
npm run test:coverage
```

See [docs/guides/testing.md](docs/guides/testing.md) for detailed testing guide.

### Building

```bash
# Build extension
npm run build

# Package extension
npm run package
```

### Releasing

```bash
# Automated release (patch version)
./release.sh patch "Bug fixes and improvements"

# Minor version release
./release.sh minor "New features added"

# Major version release
./release.sh major "Breaking changes"
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
