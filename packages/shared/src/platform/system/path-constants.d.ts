import * as vscode from 'vscode';
/**
 * Centralized path constants for extension resources.
 * All paths are relative to extension root as required by VS Code.
 *
 * @remarks
 * - Package.json paths MUST be relative to extension root (VS Code requirement)
 * - Runtime paths use vscode.Uri.joinPath(extensionUri, ...) for permanent resolution
 * - User data paths use os.homedir() for cross-platform compatibility
 */
export declare const RESOURCE_PATHS: {
    readonly EXTENSION_ICON: "resources/icon.png";
    readonly WEBVIEW_ROOT: "media/webview";
    readonly WEBVIEW_INDEX: "media/webview/index.html";
    readonly WEBVIEW_ASSETS: "media/webview/assets";
    readonly TREE_SITTER_WASMS: "resources/tree-sitter-wasms";
    readonly RESOURCES: "resources";
};
/**
 * User data directory paths (in user's home directory)
 */
export declare const USER_DATA_PATHS: {
    readonly INLINE_DIR: ".inline";
    readonly MODELS_DIR: ".inline/models";
    readonly CACHE_DIR: ".inline/cache";
    readonly LOGS_DIR: ".inline/logs";
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
export declare function getResourceUri(extensionUri: vscode.Uri, relativePath: string): vscode.Uri;
/**
 * Helper to get absolute file system path for an extension resource
 *
 * @param extensionUri - The extension's URI from context.extensionUri
 * @param relativePath - Relative path from extension root
 * @returns Absolute file system path
 */
export declare function getResourcePath(extensionUri: vscode.Uri, relativePath: string): string;
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
export declare function getUserDataPath(relativePath: string): string;
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
export declare function getWebviewUri(webview: vscode.Webview, extensionUri: vscode.Uri, relativePath: string): vscode.Uri;
//# sourceMappingURL=path-constants.d.ts.map