"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTParser = void 0;
const tree_sitter_service_1 = require("@language/parsers/tree-sitter-service");
const native_loader_1 = require("@platform/native/native-loader");
/**
 * Language-agnostic AST parser for structural code analysis.
 *
 * Now supports Tree-sitter for accurate parsing with regex fallback.
 */
class ASTParser {
    constructor() {
        this.languageParsers = new Map();
        this.treeSitterService = tree_sitter_service_1.TreeSitterService.getInstance();
        this.initializeParsers();
    }
    /**
     * Parse code to AST.
     *
     * Tries Tree-sitter first for accurate parsing, falls back to regex.
     */
    async parse(code, language) {
        // Try Native first (Fastest)
        const native = native_loader_1.NativeLoader.getInstance();
        /*
        if (native.isAvailable()) {
            try {
                // native.parseAst returns the object directly (via JSON.parse)
                const ast = await native.parseAst(code, language);
                if (ast) {
                    return ast as ASTNode;
                }
            } catch (error) {
                console.warn(`Native parsing failed for ${language}, falling back to next method:`, error);
            }
        }
        */
        // Try Tree-sitter (WASM)
        if (this.treeSitterService.isSupported(language)) {
            try {
                const tree = await this.treeSitterService.parse(code, language);
                if (tree) {
                    return this.convertTreeSitterToASTNode(tree.rootNode);
                }
            }
            catch (error) {
                console.warn(`Tree-sitter parsing failed for ${language}, falling back to regex:`, error);
            }
        }
        // Fall back to regex-based parsing
        const parser = this.languageParsers.get(language.toLowerCase());
        if (!parser) {
            return this.parseGeneric(code);
        }
        try {
            return parser(code);
        }
        catch (error) {
            console.warn(`AST parsing failed for ${language}, using generic parser:`, error);
            return this.parseGeneric(code);
        }
    }
    /**
     * Normalize AST for comparison
     */
    normalize(ast) {
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
    extractBlocks(code, language) {
        const blocks = [];
        const lines = code.split('\n');
        // Language-specific patterns
        const patterns = this.getBlockPatterns(language);
        // Extract functions
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
        // Extract classes
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
        return blocks;
    }
    /**
     * Calculate tree edit distance between two ASTs
     */
    treeEditDistance(ast1, ast2) {
        // Simplified tree edit distance using dynamic programming
        // This is a basic implementation - can be enhanced with Zhang-Shasha algorithm
        const struct1 = this.astToStructure(ast1);
        const struct2 = this.astToStructure(ast2);
        // Use Levenshtein distance on structural representation
        return this.levenshteinDistance(struct1, struct2);
    }
    /**
     * Initialize language-specific parsers
     */
    initializeParsers() {
        // JavaScript/TypeScript parser
        this.languageParsers.set('javascript', (code) => this.parseJavaScript(code));
        this.languageParsers.set('typescript', (code) => this.parseJavaScript(code));
        // Python parser
        this.languageParsers.set('python', (code) => this.parsePython(code));
        // Java parser
        this.languageParsers.set('java', (code) => this.parseJava(code));
        // C/C++ parser
        this.languageParsers.set('c', (code) => this.parseCpp(code));
        this.languageParsers.set('cpp', (code) => this.parseCpp(code));
        // Go parser
        this.languageParsers.set('go', (code) => this.parseGo(code));
        // Rust parser
        this.languageParsers.set('rust', (code) => this.parseRust(code));
    }
    /**
     * Parse JavaScript/TypeScript (regex-based, simplified)
     */
    parseJavaScript(code) {
        const root = {
            type: 'Program',
            children: []
        };
        // Extract functions
        const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            root.children.push({
                type: 'FunctionDeclaration',
                value: match[1] || match[2],
                children: []
            });
        }
        // Extract classes
        const classRegex = /class\s+(\w+)/g;
        while ((match = classRegex.exec(code)) !== null) {
            root.children.push({
                type: 'ClassDeclaration',
                value: match[1],
                children: []
            });
        }
        return root;
    }
    /**
     * Parse Python (regex-based, simplified)
     */
    parsePython(code) {
        const root = {
            type: 'Module',
            children: []
        };
        // Extract functions
        const functionRegex = /def\s+(\w+)\s*\(/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            root.children.push({
                type: 'FunctionDef',
                value: match[1],
                children: []
            });
        }
        // Extract classes
        const classRegex = /class\s+(\w+)/g;
        while ((match = classRegex.exec(code)) !== null) {
            root.children.push({
                type: 'ClassDef',
                value: match[1],
                children: []
            });
        }
        return root;
    }
    /**
     * Parse Java (regex-based, simplified)
     */
    parseJava(code) {
        const root = {
            type: 'CompilationUnit',
            children: []
        };
        // Extract classes
        const classRegex = /(?:public\s+)?class\s+(\w+)/g;
        let match;
        while ((match = classRegex.exec(code)) !== null) {
            root.children.push({
                type: 'ClassDeclaration',
                value: match[1],
                children: []
            });
        }
        // Extract methods
        const methodRegex = /(?:public|private|protected)?\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\(/g;
        while ((match = methodRegex.exec(code)) !== null) {
            root.children.push({
                type: 'MethodDeclaration',
                value: match[1],
                children: []
            });
        }
        return root;
    }
    /**
     * Parse C/C++ (regex-based, simplified)
     */
    parseCpp(code) {
        const root = {
            type: 'TranslationUnit',
            children: []
        };
        // Extract functions
        const functionRegex = /(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*{/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            root.children.push({
                type: 'FunctionDeclaration',
                value: match[1],
                children: []
            });
        }
        // Extract classes/structs
        const classRegex = /(?:class|struct)\s+(\w+)/g;
        while ((match = classRegex.exec(code)) !== null) {
            root.children.push({
                type: 'ClassDeclaration',
                value: match[1],
                children: []
            });
        }
        return root;
    }
    /**
     * Parse Go (regex-based, simplified)
     */
    parseGo(code) {
        const root = {
            type: 'File',
            children: []
        };
        // Extract functions
        const functionRegex = /func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            root.children.push({
                type: 'FuncDecl',
                value: match[1],
                children: []
            });
        }
        // Extract types
        const typeRegex = /type\s+(\w+)\s+(?:struct|interface)/g;
        while ((match = typeRegex.exec(code)) !== null) {
            root.children.push({
                type: 'TypeDecl',
                value: match[1],
                children: []
            });
        }
        return root;
    }
    /**
     * Parse Rust (regex-based, simplified)
     */
    parseRust(code) {
        const root = {
            type: 'Crate',
            children: []
        };
        // Extract functions
        const functionRegex = /fn\s+(\w+)\s*\(/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            root.children.push({
                type: 'FnDecl',
                value: match[1],
                children: []
            });
        }
        // Extract structs/enums
        const structRegex = /(?:struct|enum)\s+(\w+)/g;
        while ((match = structRegex.exec(code)) !== null) {
            root.children.push({
                type: 'StructDecl',
                value: match[1],
                children: []
            });
        }
        return root;
    }
    /**
     * Generic parser (fallback)
     */
    parseGeneric(code) {
        return {
            type: 'Program',
            children: [],
            value: code
        };
    }
    /**
     * Convert Tree-sitter syntax node to internal ASTNode format
     */
    convertTreeSitterToASTNode(node) {
        const astNode = {
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
                astNode.children.push(this.convertTreeSitterToASTNode(child));
            }
        }
        return astNode;
    }
    /**
     * Convert AST to structural string representation
     */
    astToStructure(node, depth = 0) {
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
    countNodes(node) {
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
    calculateDepth(node) {
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
    /**
     * Get block patterns for language
     */
    getBlockPatterns(language) {
        const patterns = {
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
     * Find the end of a code block
     */
    findBlockEnd(lines, startLine, language) {
        // Simple brace matching for C-style languages
        if (['javascript', 'typescript', 'java', 'c', 'cpp', 'go', 'rust'].includes(language.toLowerCase())) {
            let braceCount = 0;
            let foundStart = false;
            for (let i = startLine; i < lines.length; i++) {
                const line = lines[i];
                for (const char of line) {
                    if (char === '{') {
                        braceCount++;
                        foundStart = true;
                    }
                    else if (char === '}') {
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
                if (line.trim().length === 0)
                    continue;
                const indent = line.search(/\S/);
                if (indent <= startIndent) {
                    return i - 1;
                }
            }
        }
        // Fallback: return a reasonable default
        return Math.min(startLine + 20, lines.length - 1);
    }
    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++)
            dp[i][0] = i;
        for (let j = 0; j <= n; j++)
            dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                }
                else {
                    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
                }
            }
        }
        return dp[m][n];
    }
}
exports.ASTParser = ASTParser;
//# sourceMappingURL=ast-parser.js.map