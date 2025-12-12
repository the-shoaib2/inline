import * as vscode from 'vscode';
import { ASTParser, SemanticAnalyzer } from '@inline/language';

/**
 * Import suggestion with confidence score.
 */
interface ImportSuggestion {
    symbol: string;
    module: string;
    isDefault: boolean;
    confidence: number;
}

/**
 * Parsed import statement with metadata.
 */
interface ImportStatement {
    module: string;
    imports: string[];
    isDefault: boolean;
    line: number;
    text: string;
}

/**
 * Resolves and manages import statements across multiple languages.
 *
 * Features:
 * - Detect import statements (ES6, CommonJS, Python)
 * - Suggest missing imports based on workspace symbols
 * - Organize and optimize imports
 * - Handle auto-import functionality
 *
 * Integrates with SemanticAnalyzer for symbol analysis.
 */
export class ImportResolver {
    private semanticAnalyzer: SemanticAnalyzer;
    private workspaceSymbols: Map<string, vscode.SymbolInformation[]> = new Map();

    /**
     * Initialize import resolver with semantic analysis.
     */
    constructor() {
        this.semanticAnalyzer = new SemanticAnalyzer();
    }

    /**
     * Detect all import statements in a document
     */
    async detectImports(document: vscode.TextDocument): Promise<ImportStatement[]> {
        const imports: ImportStatement[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // ES6 imports
            const es6Match = line.match(/^import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
            if (es6Match) {
                const namedImports = es6Match[1]?.split(',').map(s => s.trim()) || [];
                const defaultImport = es6Match[2];
                const module = es6Match[3];

                imports.push({
                    module,
                    imports: defaultImport ? [defaultImport, ...namedImports] : namedImports,
                    isDefault: !!defaultImport,
                    line: i,
                    text: line
                });
            }

            // CommonJS require
            const cjsMatch = line.match(/(?:const|let|var)\s+(?:{([^}]+)}|(\w+))\s*=\s*require\(['"]([^'"]+)['"]\)/);
            if (cjsMatch) {
                const namedImports = cjsMatch[1]?.split(',').map(s => s.trim()) || [];
                const defaultImport = cjsMatch[2];
                const module = cjsMatch[3];

                imports.push({
                    module,
                    imports: defaultImport ? [defaultImport, ...namedImports] : namedImports,
                    isDefault: !!defaultImport,
                    line: i,
                    text: line
                });
            }

            // Python imports
            if (document.languageId === 'python') {
                const pyMatch = line.match(/^(?:from\s+(\S+)\s+)?import\s+(.+)/);
                if (pyMatch) {
                    const module = pyMatch[1] || '';
                    const importList = pyMatch[2].split(',').map(s => s.trim().split(' as ')[0]);

                    imports.push({
                        module,
                        imports: importList,
                        isDefault: false,
                        line: i,
                        text: line
                    });
                }
            }
        }

        return imports;
    }

    /**
     * Find unused imports in a document
     */
    async findUnusedImports(document: vscode.TextDocument): Promise<ImportStatement[]> {
        const imports = await this.detectImports(document);
        const text = document.getText();
        const unusedImports: ImportStatement[] = [];

        for (const importStmt of imports) {
            const unusedSymbols = importStmt.imports.filter(symbol => {
                // Check if symbol is used in the document (excluding the import line)
                const lines = text.split('\n');
                const codeWithoutImports = lines
                    .filter((_, idx) => idx !== importStmt.line)
                    .join('\n');

                // Simple regex check - could be enhanced with AST
                const symbolRegex = new RegExp(`\\b${symbol}\\b`, 'g');
                return !symbolRegex.test(codeWithoutImports);
            });

            if (unusedSymbols.length > 0) {
                unusedImports.push({
                    ...importStmt,
                    imports: unusedSymbols
                });
            }
        }

        return unusedImports;
    }

    /**
     * Find missing imports for undefined symbols
     */
    async findMissingImports(document: vscode.TextDocument): Promise<ImportSuggestion[]> {
        const suggestions: ImportSuggestion[] = [];

        // Get diagnostics for undefined symbols
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const undefinedSymbols = diagnostics
            .filter(d =>
                d.message.includes('is not defined') ||
                d.message.includes('Cannot find name') ||
                d.message.includes('is not declared')
            )
            .map(d => {
                const match = d.message.match(/['"]?(\w+)['"]?/);
                return match ? match[1] : null;
            })
            .filter(s => s !== null) as string[];

        // Search workspace for symbols
        for (const symbol of undefinedSymbols) {
            const workspaceSymbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider',
                symbol
            );

            if (workspaceSymbols && workspaceSymbols.length > 0) {
                for (const wsSymbol of workspaceSymbols) {
                    if (wsSymbol.name === symbol) {
                        const modulePath = this.getModulePath(document.uri, wsSymbol.location.uri);
                        suggestions.push({
                            symbol,
                            module: modulePath,
                            isDefault: wsSymbol.kind === vscode.SymbolKind.Class ||
                                      wsSymbol.kind === vscode.SymbolKind.Function,
                            confidence: 0.9
                        });
                    }
                }
            }
        }

        return suggestions;
    }

    /**
     * Organize imports in a document
     */
    async organizeImports(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
        const imports = await this.detectImports(document);
        if (imports.length === 0) {
            return [];
        }

        // Group imports by type
        const externalImports = imports.filter(i => !i.module.startsWith('.') && !i.module.startsWith('/'));
        const internalImports = imports.filter(i => i.module.startsWith('.') || i.module.startsWith('/'));

        // Sort alphabetically
        const sortImports = (a: ImportStatement, b: ImportStatement) => a.module.localeCompare(b.module);
        externalImports.sort(sortImports);
        internalImports.sort(sortImports);

        // Generate organized import text
        const organizedImports = [...externalImports, ...internalImports];
        const edits: vscode.TextEdit[] = [];

        // Remove old imports
        for (const imp of imports) {
            const line = document.lineAt(imp.line);
            edits.push(vscode.TextEdit.delete(line.rangeIncludingLineBreak));
        }

        // Add organized imports at the top
        const firstImportLine = Math.min(...imports.map(i => i.line));
        const organizedText = organizedImports.map(i => i.text).join('\n') + '\n';
        edits.push(vscode.TextEdit.insert(new vscode.Position(firstImportLine, 0), organizedText));

        return edits;
    }

    /**
     * Add a missing import to the document
     */
    async addImport(
        document: vscode.TextDocument,
        symbol: string,
        module: string,
        isDefault: boolean = false
    ): Promise<vscode.TextEdit> {
        const imports = await this.detectImports(document);
        const existingImport = imports.find(i => i.module === module);

        if (existingImport) {
            // Add to existing import
            const line = document.lineAt(existingImport.line);
            const newImports = [...existingImport.imports, symbol].join(', ');
            const newText = isDefault
                ? `import ${symbol} from '${module}';`
                : `import { ${newImports} } from '${module}';`;

            return vscode.TextEdit.replace(line.range, newText);
        } else {
            // Add new import at the top (after existing imports or at line 0)
            const insertLine = imports.length > 0
                ? Math.max(...imports.map(i => i.line)) + 1
                : 0;

            const importText = isDefault
                ? `import ${symbol} from '${module}';\n`
                : `import { ${symbol} } from '${module}';\n`;

            return vscode.TextEdit.insert(new vscode.Position(insertLine, 0), importText);
        }
    }

    /**
     * Remove unused imports from the document
     */
    async removeUnusedImports(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
        const unusedImports = await this.findUnusedImports(document);
        const edits: vscode.TextEdit[] = [];

        for (const unusedImport of unusedImports) {
            const line = document.lineAt(unusedImport.line);

            // If all imports from this statement are unused, remove the entire line
            const allImports = (await this.detectImports(document))
                .find(i => i.line === unusedImport.line);

            if (allImports && unusedImport.imports.length === allImports.imports.length) {
                edits.push(vscode.TextEdit.delete(line.rangeIncludingLineBreak));
            } else {
                // Remove only the unused symbols
                const remainingImports = allImports!.imports.filter(
                    i => !unusedImport.imports.includes(i)
                );
                const newText = `import { ${remainingImports.join(', ')} } from '${allImports!.module}';`;
                edits.push(vscode.TextEdit.replace(line.range, newText));
            }
        }

        return edits;
    }

    /**
     * Get relative module path between two files
     */
    private getModulePath(fromUri: vscode.Uri, toUri: vscode.Uri): string {
        const fromPath = fromUri.fsPath;
        const toPath = toUri.fsPath;

        // Simple relative path calculation
        const fromParts = fromPath.split('/');
        const toParts = toPath.split('/');

        // Find common base
        let commonLength = 0;
        while (commonLength < fromParts.length &&
               commonLength < toParts.length &&
               fromParts[commonLength] === toParts[commonLength]) {
            commonLength++;
        }

        // Build relative path
        const upLevels = fromParts.length - commonLength - 1;
        const relativeParts = Array(upLevels).fill('..');
        const downParts = toParts.slice(commonLength, -1); // Exclude file name

        const relativePath = [...relativeParts, ...downParts].join('/');
        const fileName = toParts[toParts.length - 1].replace(/\.(ts|js|tsx|jsx)$/, '');

        return relativePath ? `${relativePath}/${fileName}` : `./${fileName}`;
    }
}
