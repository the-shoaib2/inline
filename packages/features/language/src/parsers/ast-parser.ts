import { Parser } from 'web-tree-sitter';

import { TreeSitterService } from './tree-sitter-service';
import { NativeLoader } from '@inline/shared';
import { ASTNode, NormalizedAST, CodeBlock, IASTParser } from '@inline/shared';
import { ParserRegistry } from './parser-registry';
import { TypeScriptParserStrategy } from './strategies/typescript-parser-strategy';
import { PythonParserStrategy } from './strategies/python-parser-strategy';
import { JavaParserStrategy } from './strategies/java-parser-strategy';
import { CppParserStrategy } from './strategies/cpp-parser-strategy';
import { GoParserStrategy } from './strategies/go-parser-strategy';
import { RustParserStrategy } from './strategies/rust-parser-strategy';

/**
 * Language-agnostic AST parser for structural code analysis.
 * 
 * Now supports Tree-sitter for accurate parsing with regex fallback using Strategy Pattern.
 */
export class ASTParser implements IASTParser {
    private registry: ParserRegistry;
    private treeSitterService: TreeSitterService;

    constructor() {
        this.registry = ParserRegistry.getInstance();
        this.treeSitterService = TreeSitterService.getInstance();
        this.registerDefaultStrategies();
    }

    private registerDefaultStrategies() {
        // Register default strategies
        this.registry.register(new TypeScriptParserStrategy());
        this.registry.register(new PythonParserStrategy());
        this.registry.register(new JavaParserStrategy());
        this.registry.register(new CppParserStrategy());
        this.registry.register(new GoParserStrategy());
        this.registry.register(new RustParserStrategy());
    }

    /**
     * Parse code to AST.
     * 
     * Tries Tree-sitter first for accurate parsing, falls back to Strategy Pattern.
     */
    public async parse(code: string, language: string): Promise<ASTNode | null> {
        // Try Native first (Fastest) - Skipped as per original comment
        
        // Try Tree-sitter (WASM)
        if (this.treeSitterService.isSupported(language)) {
            try {
                const tree = await this.treeSitterService.parse(code, language);
                if (tree) {
                    return this.convertTreeSitterToASTNode(tree.rootNode);
                }
            } catch (error) {
                console.warn(`Tree-sitter parsing failed for ${language}, falling back to regex:`, error);
            }
        }

        // Fall back to Strategy Pattern
        const strategy = this.registry.getStrategy(language);
        if (!strategy) {
            return this.parseGeneric(code);
        }

        try {
            return strategy.parse(code);
        } catch (error) {
            console.warn(`AST parsing failed for ${language}, using generic parser:`, error);
            return this.parseGeneric(code);
        }
    }

    /**
     * Normalize AST for comparison
     */
    public normalize(ast: ASTNode): NormalizedAST {
        const structure = this.astToStructure(ast);
        const nodeCount = this.countNodes(ast);
        const depth = this.calculateDepth(ast);
        
        // Generate hash of structure
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(structure).digest('hex');

        return {
            structure,
            nodeCount,
            depth,
            hash
        };
    }

    /**
     * Extract code blocks (functions, classes, etc.)
     */
    public extractBlocks(code: string, language: string): CodeBlock[] {
        const blocks: CodeBlock[] = [];
        const lines = code.split('\n');

        // Note: Ideally this should also be delegated to strategies, but for now we use the 
        // internal pattern helper to ensure backward compatibility and functionality.
        // Future improvement: Move getBlockPatterns to ParserStrategy interface.
        const patterns = this.getBlockPatterns(language);

        // Extract functions
        if (patterns.functions) {
            for (const pattern of patterns.functions) {
                const matches = code.matchAll(pattern.regex);
                for (const match of matches) {
                    if (match.index !== undefined) {
                        const startLine = code.substring(0, match.index).split('\n').length - 1;
                        const endLine = this.findBlockEnd(lines, startLine, language);
                        
                        blocks.push({
                            type: 'function',
                            name: match[1] || 'anonymous',
                            content: lines.slice(startLine, endLine + 1).join('\n'),
                            startLine,
                            endLine
                        });
                    }
                }
            }
        }

        // Extract classes
        if (patterns.classes) {
            for (const pattern of patterns.classes) {
                const matches = code.matchAll(pattern.regex);
                for (const match of matches) {
                    if (match.index !== undefined) {
                        const startLine = code.substring(0, match.index).split('\n').length - 1;
                        const endLine = this.findBlockEnd(lines, startLine, language);
                        
                        blocks.push({
                            type: 'class',
                            name: match[1] || 'anonymous',
                            content: lines.slice(startLine, endLine + 1).join('\n'),
                            startLine,
                            endLine
                        });
                    }
                }
            }
        }

        return blocks;
    }


    /**
     * Calculate tree edit distance between two ASTs
     */
    public treeEditDistance(ast1: ASTNode, ast2: ASTNode): number {
        // Simplified tree edit distance using dynamic programming
        
        const struct1 = this.astToStructure(ast1);
        const struct2 = this.astToStructure(ast2);

        // Use Levenshtein distance on structural representation
        return this.levenshteinDistance(struct1, struct2);
    }

    /**
     * Generic parser (fallback)
     */
    private parseGeneric(code: string): ASTNode {
        return {
            type: 'Program',
            children: [],
            value: code
        };
    }

    /**
     * Convert Tree-sitter syntax node to internal ASTNode format
     */
    private convertTreeSitterToASTNode(node: any): ASTNode {
        const astNode: ASTNode = {
            type: node.type,
            value: node.text.length < 100 ? node.text : undefined,
            startLine: node.startPosition.row,
            endLine: node.endPosition.row,
            children: []
        };

        // Convert children recursively
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child) {
                astNode.children!.push(this.convertTreeSitterToASTNode(child));
            }
        }

        return astNode;
    }

    /**
     * Convert AST to structural string representation
     */
    private astToStructure(node: ASTNode, depth: number = 0): string {
        let result = '  '.repeat(depth) + node.type;
        if (node.value) {
            result += ':' + node.value;
        }
        result += '\n';

        if (node.children) {
            for (const child of node.children) {
                result += this.astToStructure(child, depth + 1);
            }
        }

        return result;
    }

    /**
     * Count nodes in AST
     */
    private countNodes(node: ASTNode): number {
        let count = 1;
        if (node.children) {
            for (const child of node.children) {
                count += this.countNodes(child);
            }
        }
        return count;
    }

    /**
     * Calculate depth of AST
     */
    private calculateDepth(node: ASTNode): number {
        if (!node.children || node.children.length === 0) {
            return 1;
        }

        let maxChildDepth = 0;
        for (const child of node.children) {
            const childDepth = this.calculateDepth(child);
            maxChildDepth = Math.max(maxChildDepth, childDepth);
        }

        return 1 + maxChildDepth;
    }

    // NOTE: extractBlocks implementation below is restored and simplified to avoid breaking changes 
    // while we wait for full strategy support for block extraction (which requires more complex parsing).
    // For now, let's bring back the minimal regex logic needed for extract blocks 
    // or arguably we can deprecate this method if it's not used. 
    // Assuming it is used. I'll re-implement a robust version in a separate utility or here.
    
    // ... Actually, I see I removed the implementation of extractBlocks in my snippet above 
    // but the IASTParser interface requires it.
    // I will implementation extractBlocks using a helper method that mimics the old behavior 
    // but is cleaner.
    
    private findBlockEnd(lines: string[], startLine: number, language: string): number {
        // Simple brace matching for C-style languages
        if (['javascript', 'typescript', 'java', 'c', 'cpp', 'go', 'rust', 'csharp', 'php'].includes(language.toLowerCase())) {
            let braceCount = 0;
            let foundStart = false;

            for (let i = startLine; i < lines.length; i++) {
                const line = lines[i];
                
                for (const char of line) {
                    if (char === '{') {
                        braceCount++;
                        foundStart = true;
                    } else if (char === '}') {
                        braceCount--;
                        if (foundStart && braceCount === 0) {
                            return i;
                        }
                    }
                }
            }
        }

        // Python: use indentation
        if (language.toLowerCase() === 'python') {
            const startIndent = lines[startLine].search(/\S/);
            
            for (let i = startLine + 1; i < lines.length; i++) {
                const line = lines[i];
                if (line.trim().length === 0) continue;
                
                const indent = line.search(/\S/);
                if (indent >= 0 && indent <= startIndent) {
                    return i - 1;
                }
            }
        }

        return Math.min(startLine + 20, lines.length - 1);
    }
    
    private getBlockPatterns(language: string): any {
         const patterns: any = {
            javascript: {
                functions: [
                    { regex: /function\s+(\w+)\s*\([^)]*\)\s*{/g },
                    { regex: /const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g },
                    { regex: /(\w+)\s*:\s*(?:async\s*)?function\s*\([^)]*\)\s*{/g }
                ],
                classes: [
                    { regex: /class\s+(\w+)/g }
                ]
            },
            python: {
                functions: [
                    { regex: /def\s+(\w+)\s*\(/g }
                ],
                classes: [
                    { regex: /class\s+(\w+)/g }
                ]
            },
            java: {
                functions: [
                    { regex: /(?:public|private|protected)?\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\(/g }
                ],
                classes: [
                    { regex: /(?:public\s+)?class\s+(\w+)/g }
                ]
            }
        };
        return patterns[language.toLowerCase()] || patterns.javascript;
    }

    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance(str1: string, str2: string): number {
        const m = str1.length;
        const n = str2.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,
                        dp[i][j - 1] + 1,
                        dp[i - 1][j - 1] + 1
                    );
                }
            }
        }

        return dp[m][n];
    }
}

