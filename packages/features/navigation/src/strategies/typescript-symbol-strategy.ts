
import { SymbolExtractorStrategy } from './symbol-extractor-strategy.interface';

export class TypeScriptSymbolStrategy implements SymbolExtractorStrategy {
    supports(languageId: string): boolean {
        return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(languageId);
    }

    getVariableNodeTypes(): string[] {
        return [
            'variable_declaration',
            'lexical_declaration',
            'const_declaration',
            'let_declaration',
            'var_declaration',
        ];
    }

    isConstant(node: any): boolean {
        return node.text.trim().startsWith('const ') || 
               node.type === 'const_declaration' ||
               node.type === 'lexical_declaration'; // lexical usually let/const, check text
    }

    getSymbolName(node: any): string | null {
        // Try common field names
        const nameNode = node.childForFieldName('name') || 
                         node.childForFieldName('identifier') ||
                         node.childForFieldName('declarator') ||
                         node.childForFieldName('type_identifier');
        
        if (nameNode) return nameNode.text;

        // Try children types
        for (const child of node.children) {
            if (child.type === 'identifier' || child.type === 'type_identifier') {
                return child.text;
            }
        }
        
        return null;
    }

    isValidIdentifier(name: string): boolean {
        return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
    }

    isIdentifierNode(node: any): boolean {
        return node.type === 'identifier' || 
               node.type === 'property_identifier' || 
               node.type === 'shorthand_property_identifier_pattern';
    }
}
