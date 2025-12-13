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
    structure: string;      // Structural representation
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
 * Interface for AST Parser to allow dependency injection
 */
export interface IASTParser {
    parse(code: string, language: string): Promise<ASTNode | null>;
    normalize(ast: ASTNode): NormalizedAST;
    extractBlocks(code: string, language: string): CodeBlock[];
    treeEditDistance(ast1: ASTNode, ast2: ASTNode): number;
}
