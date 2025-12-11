# Path Resolution Strategy

This document explains how file paths are resolved in the Inline VS Code extension to ensure compatibility across development, packaged, and installed environments.

## Overview

The extension uses **two types of paths**:

1. **Extension Resources** - Files bundled with the extension (icons, WASM files, webview assets)
2. **User Data** - Runtime files stored in the user's home directory (models, cache, logs)

## Extension Resources

### Package.json Paths

Paths in `package.json` **must be relative** to the extension root. This is a VS Code requirement.

```json
{
  "icon": "resources/icon.png",
  "contributes": {
    "viewsContainers": {
      "activitybar": [{
        "icon": "resources/icon.png"
      }]
    }
  }
}
```

### Runtime Path Resolution

In TypeScript code, always use `vscode.Uri.joinPath()` with `context.extensionUri`:

```typescript
// ✅ Correct - Permanent solution
const iconUri = vscode.Uri.joinPath(context.extensionUri, 'resources', 'icon.png');

// ❌ Wrong - Fragile, breaks in packaged extensions
const iconPath = path.join(__dirname, '../../resources/icon.png');
```

### Centralized Constants

All resource paths are defined in [`path-constants.ts`](file:///Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/src/platform/system/path-constants.ts):

```typescript
import { RESOURCE_PATHS, getResourceUri } from '@platform/system/path-constants';

// Get URI for extension icon
const iconUri = getResourceUri(extensionUri, RESOURCE_PATHS.EXTENSION_ICON);

// Get webview URI
const webviewUri = getWebviewUri(webview, extensionUri, RESOURCE_PATHS.EXTENSION_ICON);
```

## User Data Paths

User data is stored in the home directory using OS-specific paths:

```typescript
import { USER_DATA_PATHS, getUserDataPath } from '@platform/system/path-constants';

// Get models directory: ~/.inline/models
const modelsDir = getUserDataPath(USER_DATA_PATHS.MODELS_DIR);
```

## Helper Functions

### `getResourceUri(extensionUri, relativePath)`
Returns absolute URI for extension resources.

### `getResourcePath(extensionUri, relativePath)`
Returns absolute file system path for extension resources.

### `getUserDataPath(relativePath)`
Returns absolute path in user's home directory.

### `getWebviewUri(webview, extensionUri, relativePath)`
Returns webview-compatible URI for resources.

## Path Categories

| Category | Location | Example |
|----------|----------|---------|
| Extension Icon | `resources/` | `resources/icon.png` |
| Webview Assets | `media/webview/` | `media/webview/assets/index.js` |
| Tree-sitter WASM | `resources/tree-sitter-wasms/` | `resources/tree-sitter-wasms/tree-sitter-typescript.wasm` |
| Models | `~/.inline/models/` | `~/.inline/models/model.gguf` |
| Cache | `~/.inline/cache/` | `~/.inline/cache/context.json` |
| Logs | `~/.inline/logs/` | `~/.inline/logs/extension.log` |

## Best Practices

1. **Never use `__dirname`** - It breaks in packaged extensions
2. **Always use `context.extensionUri`** - Available in `activate()` function
3. **Use path constants** - Import from `path-constants.ts`
4. **Test in packaged mode** - Run `pnpm vscode:prepublish` and test

## Verification

To verify paths work correctly:

```bash
# Development mode
code --extensionDevelopmentPath=/path/to/extension

# Package and test
pnpm vscode:prepublish
code --install-extension inline-0.1.0.vsix
```

## Migration Guide

When updating code to use path constants:

**Before:**
```typescript
const wasmDir = path.join(context.extensionPath, 'resources', 'tree-sitter-wasms');
```

**After:**
```typescript
import { RESOURCE_PATHS, getResourcePath } from '@platform/system/path-constants';
const wasmDir = getResourcePath(context.extensionUri, RESOURCE_PATHS.TREE_SITTER_WASMS);
```

## See Also

- [VS Code Extension API - ExtensionContext](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext)
- [VS Code Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
