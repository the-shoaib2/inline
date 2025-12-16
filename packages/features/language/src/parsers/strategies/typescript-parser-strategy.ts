import { ParserStrategy } from './parser-strategy.interface';
import { ASTNode } from '@inline/shared';

export class TypeScriptParserStrategy implements ParserStrategy {
    supports(language: string): boolean {
        return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(language.toLowerCase());
    }

    parse(code: string): ASTNode {
        const root: ASTNode = {
            type: 'Program',
            children: []
        };

        // Extract functions
        const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'FunctionDeclaration',
                value: match[1] || match[2],
                children: []
            });
        }

        // Extract classes
        const classRegex = /class\s+(\w+)/g;
        while ((match = classRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'ClassDeclaration',
                value: match[1],
                children: []
            });
        }

        return root;
    }
}
