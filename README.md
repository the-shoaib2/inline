# Inline - Offline Code Completion

**Inline** is a privacy-first VS Code extension that delivers intelligent, AI-powered code completion entirely offline. All processing happens locally on your machine—your code never leaves your device.

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-green.svg)

---

## ✨ Features

### Core Features
<p>
  <img src="https://img.shields.io/badge/Offline--First-Fully%20Local-success?style=for-the-badge&logo=offline&logoColor=white"/>
  <img src="https://img.shields.io/badge/High%20Performance-Rust%20%2B%20C%2B%2B-blue?style=for-the-badge&logo=rust&logoColor=white"/>
  <img src="https://img.shields.io/badge/Smart%20Context-Tree--sitter-orange?style=for-the-badge&logo=trees&logoColor=white"/>
  <img src="https://img.shields.io/badge/Model%20Management-GGUF%20Support-blueviolet?style=for-the-badge&logo=huggingface&logoColor=white"/>
  <img src="https://img.shields.io/badge/Resource%20Efficient-Dynamic-green?style=for-the-badge&logo=leaf&logoColor=white"/>
  <img src="https://img.shields.io/badge/Modern%20UI-VS%20Code%20Native-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white"/>
</p>

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

### Supported Languages (40+)

<!-- Most Popular --> 
<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/Java-007396?style=flat&logo=java&logoColor=white"/>
  <img src="https://img.shields.io/badge/C%23-239120?style=flat&logo=c-sharp&logoColor=white"/>
  <img src="https://img.shields.io/badge/PHP-777BB4?style=flat&logo=php&logoColor=white"/>
</p>
<!-- Systems & Performance -->
<p align="center">
  <img src="https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white"/>
  <img src="https://img.shields.io/badge/Rust-CE422B?style=flat&logo=rust&logoColor=white"/>
  <img src="https://img.shields.io/badge/C++-00599C?style=flat&logo=c%2B%2B&logoColor=white"/>
  <img src="https://img.shields.io/badge/C-00599C?style=flat&logo=c&logoColor=white"/>
  <img src="https://img.shields.io/badge/Fortran-734F96?style=flat&logo=fortran&logoColor=white"/>
  <img src="https://img.shields.io/badge/COBOL-1572B6?style=flat&logo=ibm&logoColor=white"/>
</p>

<!-- Mobile & Cross-Platform -->
<p align="center">
  <img src="https://img.shields.io/badge/Swift-FA7343?style=flat&logo=swift&logoColor=white"/>
  <img src="https://img.shields.io/badge/Kotlin-7F52FF?style=flat&logo=kotlin&logoColor=white"/>
  <img src="https://img.shields.io/badge/Dart-0175C2?style=flat&logo=dart&logoColor=white"/>
  <img src="https://img.shields.io/badge/Objective--C-438EFF?style=flat&logo=apple&logoColor=white"/>
</p>

<!-- Functional & Academic -->
<p align="center">
  <img src="https://img.shields.io/badge/Scala-DC322F?style=flat&logo=scala&logoColor=white"/>
  <img src="https://img.shields.io/badge/Haskell-5D4F85?style=flat&logo=haskell&logoColor=white"/>
  <img src="https://img.shields.io/badge/Elixir-4B275F?style=flat&logo=elixir&logoColor=white"/>
  <img src="https://img.shields.io/badge/Erlang-A90533?style=flat&logo=erlang&logoColor=white"/>
  <img src="https://img.shields.io/badge/Clojure-DB5855?style=flat&logo=clojure&logoColor=white"/>
  <img src="https://img.shields.io/badge/OCaml-EC6813?style=flat&logo=ocaml&logoColor=white"/>
  <img src="https://img.shields.io/badge/F%23-378BBA?style=flat&logo=fsharp&logoColor=white"/>
</p>

<!-- Data Science & Analytics -->
<p align="center">
  <img src="https://img.shields.io/badge/R-276DC3?style=flat&logo=r&logoColor=white"/>
  <img src="https://img.shields.io/badge/Julia-9558B2?style=flat&logo=julia&logoColor=white"/>
  <img src="https://img.shields.io/badge/SQL-4479A1?style=flat&logo=postgresql&logoColor=white"/>
</p>

<!-- Web & Markup -->
<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34C26?style=flat&logo=html5&logoColor=white"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white"/>
  <img src="https://img.shields.io/badge/JSON-000000?style=flat&logo=json&logoColor=white"/>
  <img src="https://img.shields.io/badge/YAML-CB171E?style=flat&logo=yaml&logoColor=white"/>
  <img src="https://img.shields.io/badge/TOML-9C4121?style=flat&logo=toml&logoColor=white"/>
</p>

<!-- Scripting & Automation -->
<p align="center">
  <img src="https://img.shields.io/badge/Shell-4EAA25?style=flat&logo=gnu-bash&logoColor=white"/>
  <img src="https://img.shields.io/badge/PowerShell-5391FE?style=flat&logo=powershell&logoColor=white"/>
  <img src="https://img.shields.io/badge/Perl-39457E?style=flat&logo=perl&logoColor=white"/>
  <img src="https://img.shields.io/badge/Ruby-CC342D?style=flat&logo=ruby&logoColor=white"/>
  <img src="https://img.shields.io/badge/Lua-2C2D72?style=flat&logo=lua&logoColor=white"/>
  <img src="https://img.shields.io/badge/Groovy-4298B8?style=flat&logo=apache-groovy&logoColor=white"/>
</p>

<!-- Modern & Emerging -->
<p align="center">
  <img src="https://img.shields.io/badge/Zig-F7A41D?style=flat&logo=zig&logoColor=white"/>
  <img src="https://img.shields.io/badge/Nim-FFE953?style=flat&logo=nim&logoColor=black"/>
  <img src="https://img.shields.io/badge/Crystal-000000?style=flat&logo=crystal&logoColor=white"/>
  <img src="https://img.shields.io/badge/Solidity-363636?style=flat&logo=solidity&logoColor=white"/>
  <img src="https://img.shields.io/badge/Visual%20Basic-5C2D91?style=flat&logo=visual-studio&logoColor=white"/>
</p>

---

See [SETUP.md](SETUP.md) for detailed instructions.

---

## 🦾 Supported Models
| Tier | VRAM | Recommended Models |
|------|------|-------------------|
| **Lightweight** | 2-4 GB | CodeGemma-2B, StableCode-3B, Phi-3-mini, TinyLlama-1.1B, Qwen1.5-0.5B-Chat |
| **Mid-Tier** | 6-8 GB | DeepSeek-Coder-6.7B, StarCoder2-7B, CodeLlama-7B, WizardCoder-Python-7B, Phind-CodeLlama-34B (Q4_0) |
| **Heavy** | 12GB+ | CodeLlama-13B, Mixtral (Quantized), Dolphin-Mixtral-8x7B (Quantized), CodeLlama-34B |
| **Ultra** | 24GB+ | CodeLlama-34B, Llama-3-70B (Quantized), Yi-34B-200K, StarCoder2-15B |

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
