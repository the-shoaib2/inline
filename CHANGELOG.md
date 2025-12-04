# Changelog

All notable changes to the "Inline - Offline AI Code Completion" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Enhanced model recommendation system
- Multi-language context awareness improvements
- Performance optimizations for large codebases

---

## [1.1.0] - 2025-12-04

### Added
- Updated icon and branding elements
- Improved visual identity for better user recognition
- Enhanced extension metadata and descriptions

### Changed
- Updated display name to include Alpha status
- Refined extension description for clarity
- Improved resource organization

---

## [1.0.0] - 2025-12-04

### Added
- Major version release with stable API
- Fixed TypeScript compilation issues with node-llama-cpp
- Improved model loading and inference capabilities
- Enhanced error handling and logging
- Full compatibility with latest node-llama-cpp API

### Changed
- Updated dependencies to resolve compatibility issues
- Refactored inference engine for better performance
- Improved resource management

### Fixed
- Fixed import errors with node-llama-cpp package
- Resolved TypeScript compilation failures
- Fixed model context sequence handling

---

## [0.1.0] - 2024-12-04

### Added
- Initial release of Inline extension
- Offline-first AI code completion
- Automatic model management system
- Support for multiple LLM models (DeepSeek-Coder, CodeGemma, StarCoder2, etc.)
- Model Manager UI with dark/light theme support
- Smart context building and caching
- Resource monitoring and optimization
- Language-specific model optimization
- Comprehensive E2E testing suite (50+ tests)
- Performance optimization with <500ms completion latency
- Privacy-focused local processing

### Features
- **Model Sources**:
  - Ollama Hub integration
  - Direct Hugging Face downloads
  - Custom model import support
- **Supported Formats**: GGUF, GPTQ, SAFETENSORS
- **Commands**:
  - Model Manager
  - Toggle Offline Mode
  - Clear Cache
  - Download Model
  - Settings
  - Show Logs
  - Show Error Log
- **Configuration Options**:
  - Auto offline mode
  - Default model selection
  - Max tokens configuration
  - Temperature control
  - Cache size management
  - Resource monitoring toggle

### Technical
- TypeScript-based implementation
- VS Code API 1.85.0+
- Node.js 18.x support
- Comprehensive test coverage (unit, integration, E2E)
- ESLint configuration
- Build and packaging scripts

### Documentation
- Folder structure documentation
- Model integration strategy
- Performance optimization guide
- Testing guide
- Contributing guidelines
- Project plan and architecture docs

---

## Release Catalog

| Version | Release Date | Type | Status | Download |
|---------|--------------|------|--------|----------|
| 0.1.0   | 2024-12-04   | Initial | Stable | [Download](https://github.com/inline/inline/releases/tag/v0.1.0) |

---

## Version Statistics

- **Total Releases**: 1
- **Latest Stable**: 0.1.0
- **Latest Beta**: N/A
- **First Release**: 2024-12-04

---

[Unreleased]: https://github.com/inline/inline/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/inline/inline/releases/tag/v0.1.0
