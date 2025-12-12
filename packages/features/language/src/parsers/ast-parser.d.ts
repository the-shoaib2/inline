/**
 * Abstract Syntax Tree node
 */
export interface ASTNode {
    type: string;
    value?: string;
    children?: ASTNode[];
    startLine?: number;
    endLine?: number;
}
/**
 * Normalized AST for comparison
 */
export interface NormalizedAST {
    structure: string;
    nodeCount: number;
    depth: number;
    hash: string;
}
/**
 * Code block extracted from AST
 */
export interface CodeBlock {
    type: 'function' | 'class' | 'method' | 'statement' | 'comment';
    name?: string;
    content: string;
    startLine: number;
    endLine: number;
    children?: CodeBlock[];
}
/**
 * Language-agnostic AST parser for structural code analysis.
 *
 * Now supports Tree-sitter for accurate parsing with regex fallback.
 */
export declare class ASTParser {
    private languageParsers;
    private treeSitterService;
    constructor();
    /**
     * Parse code to AST.
     *
     * Tries Tree-sitter first for accurate parsing, falls back to regex.
     */
    parse(code: string, language: string): Promise<ASTNode | null>;
    /**
     * Normalize AST for comparison
     */
    normalize(ast: ASTNode): NormalizedAST;
    /**
     * Extract code blocks (functions, classes, etc.)
     */
    extractBlocks(code: string, language: string): CodeBlock[];
    /**
     * Calculate tree edit distance between two ASTs
     */
    treeEditDistance(ast1: ASTNode, ast2: ASTNode): number;
    /**
     * Initialize language-specific parsers
     */
    private initializeParsers;
    /**
     * Parse JavaScript/TypeScript (regex-based, simplified)
     */
    private parseJavaScript;
    /**
     * Parse Python (regex-based, simplified)
     */
    private parsePython;
    /**
     * Parse Java (regex-based, simplified)
     */
    private parseJava;
    /**
     * Parse C/C++ (regex-based, simplified)
     */
    private parseCpp;
    /**
     * Parse Go (regex-based, simplified)
     */
    private parseGo;
    /**
     * Parse Rust (regex-based, simplified)
     */
    private parseRust;
    /**
     * Generic parser (fallback)
     */
    private parseGeneric;
    /**
     * Convert Tree-sitter syntax node to internal ASTNode format
     */
    private convertTreeSitterToASTNode;
    /**
     * Convert AST to structural string representation
     */
    private astToStructure;
    /**
     * Count nodes in AST
     */
    private countNodes;
    /**
     * Calculate depth of AST
     */
    private calculateDepth;
    /**
     * Get block patterns for language
     */
    private getBlockPatterns;
    /**
     * Find the end of a code block
     */
    private findBlockEnd;
    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance;
}
//# sourceMappingURL=ast-parser.d.ts.map