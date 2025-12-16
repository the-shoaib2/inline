
import { SymbolExtractorStrategy } from './symbol-extractor-strategy.interface';

export class PythonSymbolStrategy implements SymbolExtractorStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    getVariableNodeTypes(): string[] {
        return [
            'assignment',    // x = 1
            'ann_assignment' // x: int = 1
        ];
    }

    isConstant(node: any): boolean {
        // Python doesn't have true constants, but by convention UPPER_CASE
        const name = this.getSymbolName(node);
        return name ? /^[A-Z_][A-Z0-9_]*$/.test(name) : false;
    }

    getSymbolName(node: any): string | null {
        // For assignment: left hand side
        // tree-sitter-python: assignment usually has 'left' field
        let nameNode = node.childForFieldName('left');
        
        if (!nameNode) {
            // function_definition -> name
            nameNode = node.childForFieldName('name');
        }

        if (nameNode) {
            return nameNode.text;
        }
        
        return null;
    }

    isValidIdentifier(name: string): boolean {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    }

    isIdentifierNode(node: any): boolean {
        return node.type === 'identifier';
    }
}
