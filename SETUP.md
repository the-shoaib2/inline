# Setup & Development Guide

## Prerequisites

- **Node.js** 18+
- **pnpm** (`npm install -g pnpm`)
- **Rust** (for native modules): [rustup.rs](https://rustup.rs)
- **C++ Build Tools**:
  - macOS: `xcode-select --install`
  - Windows: Visual Studio Build Tools (C++ workload)
  - Linux: `build-essential` and `cmake`

---

## Quick Setup

### Automated
```bash
./scripts/setup.sh
```

### Manual
```bash
# Install dependencies
pnpm install

# Build everything
pnpm run build

# Run extension (Press F5 in VS Code)
```

---

## Development

```bash
# Watch mode (auto-recompile)
pnpm run watch

# Lint code
pnpm run lint

# Type check
pnpm run check-types
```

---

## Testing

```bash
# All tests
pnpm test

# Unit tests only
pnpm run test:unit

# E2E tests only
pnpm run test:e2e
```

---

## Troubleshooting

### Rust not found
```bash
rustc --version
# If missing: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### C++ build errors
- **macOS**: `xcode-select --install`
- **Windows**: Install Visual Studio Build Tools with C++ workload
- **Linux**: `sudo apt-get install build-essential cmake`

### Module not found after build
```bash
pnpm install
pnpm run build
```

### Extension won't activate
1. Check VS Code version (1.85.0+)
2. View logs: `Ctrl+Shift+P` → "Inline: Show Logs"
3. Rebuild: `pnpm run build`

---

## Verification Checklist

- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] Extension activates in VS Code
