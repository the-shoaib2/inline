# Inline - Offline AI Code Completion

**Inline** is a privacy-first VS Code extension that delivers intelligent, AI-powered code completion entirely offline. All processing happens locally on your machine—your code never leaves your device.

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-green.svg)

---

## ✨ Features

### Core Features
- **🔒 Offline-First**: Works completely without internet connection
- **🚀 High Performance**: Native Rust & C++ modules for fast inference
- **🤖 Smart Model Management**: Download, import, and manage local GGUF models
- **🧠 Context-Aware**: Tree-sitter syntax analysis for intelligent suggestions
- **⚡ Resource Efficient**: Dynamic monitoring and adaptive optimization
- **🎨 Modern UI**: Beautiful VS Code-native webview with dark/light theme

### Model Management
- One-click downloads for recommended models (DeepSeek, CodeLlama, Phi-3)
- Drag & drop `.gguf` file import
- URL-based model downloads from Hugging Face
- Automatic model validation and metadata detection

### Code Intelligence
- **Completions**: Context-aware inline suggestions
- **Hover Info**: Type information and documentation
- **Code Actions**: AI-powered quick fixes and refactoring
- **Diagnostics**: Error detection and vulnerability scanning
- **Caching**: Smart LRU cache for performance

### Supported Languages (38+)

<p>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/TSX-3178C6?style=flat&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/Java-007396?style=flat&logo=java&logoColor=white"/>
  <img src="https://img.shields.io/badge/C-00599C?style=flat&logo=c&logoColor=white"/>
  <img src="https://img.shields.io/badge/C%2B%2B-00599C?style=flat&logo=c%2B%2B&logoColor=white"/>
  <img src="https://img.shields.io/badge/C%23-239120?style=flat&logo=c-sharp&logoColor=white"/>
  <img src="https://img.shields.io/badge/PHP-777BB4?style=flat&logo=php&logoColor=white"/>
  <img src="https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white"/>
  <img src="https://img.shields.io/badge/Rust-CE422B?style=flat&logo=rust&logoColor=white"/>
  <img src="https://img.shields.io/badge/Kotlin-7F52FF?style=flat&logo=kotlin&logoColor=white"/>
  <img src="https://img.shields.io/badge/Swift-FA7343?style=flat&logo=swift&logoColor=white"/>
  <img src="https://img.shields.io/badge/Ruby-CC342D?style=flat&logo=ruby&logoColor=white"/>
  <img src="https://img.shields.io/badge/Dart-0175C2?style=flat&logo=dart&logoColor=white"/>
  <img src="https://img.shields.io/badge/Scala-DC322F?style=flat&logo=scala&logoColor=white"/>
  <img src="https://img.shields.io/badge/Elixir-4B275F?style=flat&logo=elixir&logoColor=white"/>
  <img src="https://img.shields.io/badge/Lua-2C2D72?style=flat&logo=lua&logoColor=white"/>
  <img src="https://img.shields.io/badge/HTML-E34C26?style=flat&logo=html5&logoColor=white"/>
  <img src="https://img.shields.io/badge/CSS-1572B6?style=flat&logo=css3&logoColor=white"/>
  <img src="https://img.shields.io/badge/JSON-000000?style=flat&logo=json&logoColor=white"/>
  <img src="https://img.shields.io/badge/YAML-CB171E?style=flat&logo=yaml&logoColor=white"/>
  <img src="https://img.shields.io/badge/TOML-9C4121?style=flat&logo=toml&logoColor=white"/>
  <img src="https://img.shields.io/badge/Bash-4EAA25?style=flat&logo=gnu-bash&logoColor=white"/>
  <img src="https://img.shields.io/badge/Objective--C-438EFF?style=flat&logo=objective-c&logoColor=white"/>
  <img src="https://img.shields.io/badge/OCaml-EC6813?style=flat&logo=ocaml&logoColor=white"/>
  <img src="https://img.shields.io/badge/ReScript-FF5733?style=flat&logo=rescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Solidity-363636?style=flat&logo=solidity&logoColor=white"/>
  <img src="https://img.shields.io/badge/Elm-60B5CC?style=flat&logo=elm&logoColor=white"/>
  <img src="https://img.shields.io/badge/Lisp-3FB674?style=flat&logo=lisp&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vue-4FC08D?style=flat&logo=vue.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Zig-F7A41D?style=flat&logo=zig&logoColor=white"/>
  <img src="https://img.shields.io/badge/Regex-FF6B6B?style=flat&logo=regex&logoColor=white"/>
  <img src="https://img.shields.io/badge/CodeQL-2D5AA8?style=flat&logo=github&logoColor=white"/>
  <img src="https://img.shields.io/badge/TLA%2B-4B0082?style=flat&logoColor=white"/>
  <img src="https://img.shields.io/badge/SystemRDL-FF6B35?style=flat&logoColor=white"/>
  <img src="https://img.shields.io/badge/Embedded%20Template-FF6B6B?style=flat&logoColor=white"/>
</p>

---

See [SETUP.md](SETUP.md) for detailed instructions.

---

## 🦾 Supported Models

| Tier | VRAM | Recommended Models |
|------|------|-------------------|
| **Lightweight** | 2-4 GB | CodeGemma-2B, StableCode-3B, Phi-3-mini |
| **Mid-Tier** | 6-8 GB | DeepSeek-Coder-6.7B, StarCoder2-7B, CodeLlama-7B |
| **Heavy** | 12GB+ | CodeLlama-13B, Mixtral (Quantized) |

All models use **GGUF** format via `llama.cpp`.

---

## 🛠️ Commands

Press `Ctrl+Shift+P` and search for **Inline**:

- **Model Manager** - Manage and download models
- **Toggle Offline Mode** - Switch offline/online
- **Clear Cache** - Free memory
- **Download Model from URL** - Download from Hugging Face
- **Show Logs** - View debug information

---

##  Documentation

- [**Setup Guide**](SETUP.md): Detailed installation and build instructions.
- [**Folder Structure**](docs/FOLDER_STRUCTURE.md): Explanation of the codebase layout.
- [**Contributing**](docs/guides/CONTRIBUTING.md): Guidelines for submitting PRs.
- [**Testing**](docs/guides/testing.md): How to run the comprehensive test suite.

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
