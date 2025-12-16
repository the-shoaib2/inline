
export interface SymbolExtractorStrategy {
    supports(languageId: string): boolean;
    getVariableNodeTypes(): string[];
    isConstant(node: any): boolean;
    getSymbolName(node: any): string | null;
    isValidIdentifier(name: string): boolean;
    isIdentifierNode(node: any): boolean;
}
