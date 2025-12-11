import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

/**
 * Centralized path constants for extension resources.
 * All paths are relative to extension root as required by VS Code.
 * 
 * @remarks
 * - Package.json paths MUST be relative to extension root (VS Code requirement)
 * - Runtime paths use vscode.Uri.joinPath(extensionUri, ...) for permanent resolution
 * - User data paths use os.homedir() for cross-platform compatibility
 */
export const RESOURCE_PATHS = {
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
} as const;

/**
 * User data directory paths (in user's home directory)
 */
export const USER_DATA_PATHS = {
    // Main inline directory
    INLINE_DIR: '.inline',
    
    // Models storage
    MODELS_DIR: '.inline/models',
    
    // Cache directory
    CACHE_DIR: '.inline/cache',
    
    // Logs directory
    LOGS_DIR: '.inline/logs',
} as const;

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
export function getResourceUri(extensionUri: vscode.Uri, relativePath: string): vscode.Uri {
    return vscode.Uri.joinPath(extensionUri, relativePath);
}

/**
 * Helper to get absolute file system path for an extension resource
 * 
 * @param extensionUri - The extension's URI from context.extensionUri
 * @param relativePath - Relative path from extension root
 * @returns Absolute file system path
 */
export function getResourcePath(extensionUri: vscode.Uri, relativePath: string): string {
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
export function getUserDataPath(relativePath: string): string {
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
export function getWebviewUri(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    relativePath: string
): vscode.Uri {
    return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, relativePath));
}
