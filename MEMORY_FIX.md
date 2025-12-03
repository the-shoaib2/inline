# 🔧 Memory Optimization - Quick Reference

## 🚨 Immediate Fix

High memory usage detected? Run this:

```bash
./scripts/fix-memory.sh
```

Then restart VS Code:
```
Ctrl+Shift+P → "Developer: Reload Window"
```

## ⚙️ Quick Settings

Add to VS Code `settings.json`:

```json
{
  "inline.maxCacheSize": 50,
  "inline.maxTokens": 256,
  "inline.memoryLimit": 500,
  "inline.network.timeout": 1000,
  "inline.resourceMonitoring": true
}
```

## 🔍 Check Memory Usage

```
Ctrl+Shift+P → "Developer: Show Running Extensions"
```

Look for "Inline" extension memory usage.

## 🧹 Manual Cleanup

### Clear Cache
```
Ctrl+Shift+P → "Inline: Clear Cache"
```

### Restart Extension
```
Ctrl+Shift+P → "Developer: Restart Extension Host"
```

### Clear Extension Cache (Terminal)
```bash
rm -rf ~/.vscode/extensions/inline.inline-*/resources/cache/*
```

## 📊 Monitor Performance

### View Logs
```
Ctrl+Shift+P → "Inline: Show Logs"
```

### View Errors
```
Ctrl+Shift+P → "Inline: Show Error Log"
```

## 🛠️ Advanced Fixes

### Increase Node Memory Limit

Add to `.vscode/launch.json`:

```json
{
  "configurations": [{
    "runtimeArgs": [
      "--max-old-space-size=4096"
    ]
  }]
}
```

### Reduce Model Size

Use smaller models:
- CodeGemma-2B (2GB) instead of DeepSeek-Coder-6.7B (6GB)
- Reduce `maxTokens` from 512 to 256

### Disable Features

```json
{
  "inline.resourceMonitoring": false,
  "inline.cacheSize": 25
}
```

## 📚 Full Documentation

See [docs/guides/MEMORY_OPTIMIZATION.md](docs/guides/MEMORY_OPTIMIZATION.md) for complete guide.

## ✅ Verification

After applying fixes:

1. Memory usage < 500MB ✓
2. No "LanguageServerClient" errors ✓
3. No "Channel closed" errors ✓
4. Extension activates properly ✓

---

**Quick Fix**: `./scripts/fix-memory.sh`  
**Full Guide**: `docs/guides/MEMORY_OPTIMIZATION.md`
