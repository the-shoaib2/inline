# Building Native Modules

This directory contains high-performance Rust native modules for the Inline VS Code extension.

## Prerequisites

### All Platforms
- **Rust**: Install from [rustup.rs](https://rustup.rs/)
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
- **Node.js**: 18.x or higher
- **pnpm**: `npm install -g pnpm`

### macOS
```bash
xcode-select --install
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install build-essential cmake pkg-config libssl-dev
```

### Windows
- Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
- Select "Desktop development with C++" workload

## Building

### Development Build
```bash
cd native
pnpm install
pnpm run build:debug
```

### Production Build
```bash
cd native
pnpm run build
```

This will create optimized binaries with:
- Link-Time Optimization (LTO)
- Native CPU optimizations
- Dead code elimination

### Running Tests
```bash
cd native
cargo test
```

## Architecture

### Modules

- **ast_parser.rs**: Tree-sitter AST parsing (3-5x faster than WASM)
- **semantic_analyzer.rs**: Code analysis with pre-compiled regex (5-10x faster)
- **hash.rs**: xxHash3 for cache keys (10-20x faster)
- **duplication.rs**: SIMD-optimized duplication detection (4-8x faster)
- **text_processor.rs**: Fast tokenization and text processing (2-4x faster)

### Performance Optimizations

1. **Zero-Copy Operations**: Minimize memory allocations
2. **SIMD**: Vectorized string operations where possible
3. **Parallel Processing**: Rayon for multi-threaded operations
4. **Pre-compiled Patterns**: Regex compiled once at startup
5. **Native CPU Instructions**: Target-specific optimizations

## Integration

The native modules are automatically loaded by `src/native/native-loader.ts` with graceful fallback to TypeScript implementations if:
- Native module fails to load
- Platform is not supported
- Build artifacts are missing

## Troubleshooting

### Build Fails

**Error: `rustc` not found**
```bash
# Ensure Rust is in PATH
source $HOME/.cargo/env
```

**Error: linking failed**
```bash
# macOS: Install Xcode Command Line Tools
xcode-select --install

# Linux: Install build essentials
sudo apt-get install build-essential

# Windows: Install Visual Studio Build Tools
```

### Module Fails to Load

Check the extension logs:
1. Open VS Code
2. View → Output
3. Select "Inline" from dropdown
4. Look for "Native module" messages

The extension will automatically fall back to TypeScript if native modules fail.

## Performance Benchmarks

Run benchmarks to verify performance improvements:

```bash
cd test/native
pnpm run benchmark
```

Expected results:
- AST Parsing: 3-5x faster
- Semantic Analysis: 5-10x faster
- Hashing: 10-20x faster
- Duplication Detection: 4-8x faster
- Overall completion latency: 500ms → 100ms (5x improvement)

## Development

### Adding New Functions

1. Add function to appropriate `.rs` file
2. Export with `#[napi]` macro
3. Update `native/index.d.ts` with TypeScript types
4. Add method to `src/native/native-loader.ts`
5. Add tests to `native/tests/`

### Debugging

Enable debug logging:
```bash
RUST_LOG=debug pnpm run build:debug
```

Use `println!` for debugging (will appear in VS Code Output panel).

## Cross-Platform Builds

Build for all platforms:
```bash
pnpm run build --target aarch64-apple-darwin
pnpm run build --target x86_64-apple-darwin
pnpm run build --target x86_64-unknown-linux-gnu
pnpm run build --target x86_64-pc-windows-msvc
```

## License

Apache 2.0 - Same as parent project
