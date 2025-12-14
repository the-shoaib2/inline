import * as vscode from 'vscode';
import { TreeSitterService } from '@inline/language/parsers/tree-sitter-service';
import {
    InlineDefinitionProvider,
    InlineReferenceProvider,
    InlineRenameProvider,
    SymbolExtractor,
    SymbolIndex,
} from '@inline/navigation';

/**
 * Supported languages for navigation features
 */
const SUPPORTED_LANGUAGES = [
    'typescript',
    'javascript',
    'typescriptreact',
    'javascriptreact',
    'python',
    'java',
    'cpp',
    'c',
    'go',
    'rust',
    'php',
    'ruby',
    'swift',
    'kotlin',
    'scala',
    'csharp',
];

/**
 * Initialize navigation features
 */
export async function initializeNavigationFeatures(
    context: vscode.ExtensionContext,
    treeSitterService: TreeSitterService
): Promise<void> {
    try {
        // Create symbol extractor and index
        const symbolExtractor = new SymbolExtractor(treeSitterService);
        const symbolIndex = new SymbolIndex(symbolExtractor);

        // Create providers
        const definitionProvider = new InlineDefinitionProvider(symbolIndex, symbolExtractor);
        const referenceProvider = new InlineReferenceProvider(symbolIndex, symbolExtractor, treeSitterService);
        const renameProvider = new InlineRenameProvider(symbolIndex, symbolExtractor, treeSitterService);

        // Register providers for all supported languages
        context.subscriptions.push(
            vscode.languages.registerDefinitionProvider(
                SUPPORTED_LANGUAGES,
                definitionProvider
            ),
            vscode.languages.registerReferenceProvider(
                SUPPORTED_LANGUAGES,
                referenceProvider
            ),
            vscode.languages.registerRenameProvider(
                SUPPORTED_LANGUAGES,
                renameProvider
            )
        );

        // Index open documents
        for (const document of vscode.workspace.textDocuments) {
            if (SUPPORTED_LANGUAGES.includes(document.languageId)) {
                await symbolIndex.indexFile(document);
            }
        }

        // Watch for document changes
        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(async (document) => {
                if (SUPPORTED_LANGUAGES.includes(document.languageId)) {
                    await symbolIndex.indexFile(document);
                }
            }),
            vscode.workspace.onDidChangeTextDocument(async (event) => {
                if (SUPPORTED_LANGUAGES.includes(event.document.languageId)) {
                    await symbolIndex.indexFile(event.document);
                }
            }),
            vscode.workspace.onDidCloseTextDocument((document) => {
                symbolIndex.removeFile(document.uri);
            })
        );

        console.log('[Inline] Navigation features initialized successfully');
    } catch (error) {
        console.error('[Inline] Failed to initialize navigation features:', error);
        vscode.window.showErrorMessage('Failed to initialize Inline navigation features');
    }
}
