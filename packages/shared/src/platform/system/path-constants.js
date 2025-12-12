"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_DATA_PATHS = exports.RESOURCE_PATHS = void 0;
exports.getResourceUri = getResourceUri;
exports.getResourcePath = getResourcePath;
exports.getUserDataPath = getUserDataPath;
exports.getWebviewUri = getWebviewUri;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Centralized path constants for extension resources.
 * All paths are relative to extension root as required by VS Code.
 *
 * @remarks
 * - Package.json paths MUST be relative to extension root (VS Code requirement)
 * - Runtime paths use vscode.Uri.joinPath(extensionUri, ...) for permanent resolution
 * - User data paths use os.homedir() for cross-platform compatibility
 */
exports.RESOURCE_PATHS = {
    // Icons (relative to extension root)
    EXTENSION_ICON: 'resources/icon.png',
    // Webview resources (relative to extension root)
    WEBVIEW_ROOT: 'media/webview',
    WEBVIEW_INDEX: 'media/webview/index.html',
    WEBVIEW_ASSETS: 'media/webview/assets',
    // Tree-sitter WASM files (relative to extension root)
    TREE_SITTER_WASMS: 'resources/tree-sitter-wasms',
    // Resources directory
    RESOURCES: 'resources',
};
/**
 * User data directory paths (in user's home directory)
 */
exports.USER_DATA_PATHS = {
    // Main inline directory
    INLINE_DIR: '.inline',
    // Models storage
    MODELS_DIR: '.inline/models',
    // Cache directory
    CACHE_DIR: '.inline/cache',
    // Logs directory
    LOGS_DIR: '.inline/logs',
};
/**
 * Helper to get absolute URI for an extension resource
 *
 * @param extensionUri - The extension's URI from context.extensionUri
 * @param relativePath - Relative path from extension root
 * @returns Absolute URI to the resource
 *
 * @example
 * ```typescript
 * const iconUri = getResourceUri(context.extensionUri, RESOURCE_PATHS.EXTENSION_ICON);
 * ```
 */
function getResourceUri(extensionUri, relativePath) {
    return vscode.Uri.joinPath(extensionUri, relativePath);
}
/**
 * Helper to get absolute file system path for an extension resource
 *
 * @param extensionUri - The extension's URI from context.extensionUri
 * @param relativePath - Relative path from extension root
 * @returns Absolute file system path
 */
function getResourcePath(extensionUri, relativePath) {
    return vscode.Uri.joinPath(extensionUri, relativePath).fsPath;
}
/**
 * Helper to get absolute path for user data directory
 *
 * @param relativePath - Relative path from user's home directory
 * @returns Absolute file system path
 *
 * @example
 * ```typescript
 * const modelsDir = getUserDataPath(USER_DATA_PATHS.MODELS_DIR);
 * // Returns: /Users/username/.inline/models
 * ```
 */
function getUserDataPath(relativePath) {
    return path.join(os.homedir(), relativePath);
}
/**
 * Helper to get webview URI for a resource
 *
 * @param webview - The webview instance
 * @param extensionUri - The extension's URI from context.extensionUri
 * @param relativePath - Relative path from extension root
 * @returns Webview URI for the resource
 *
 * @example
 * ```typescript
 * const iconWebviewUri = getWebviewUri(
 *     webview,
 *     context.extensionUri,
 *     RESOURCE_PATHS.EXTENSION_ICON
 * );
 * ```
 */
function getWebviewUri(webview, extensionUri, relativePath) {
    return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, relativePath));
}
//# sourceMappingURL=path-constants.js.map