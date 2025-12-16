import { ParserStrategy } from './parser-strategy.interface';
import { ASTNode } from '@inline/shared';

export class CppParserStrategy implements ParserStrategy {
    supports(language: string): boolean {
        return ['c', 'cpp', 'c++', 'h', 'hpp'].includes(language.toLowerCase());
    }

    parse(code: string): ASTNode {
        const root: ASTNode = {
            type: 'TranslationUnit',
            children: []
        };

        // Extract functions
        const functionRegex = /(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*{/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'FunctionDeclaration',
                value: match[1],
                children: []
            });
        }

        // Extract classes/structs
        const classRegex = /(?:class|struct)\s+(\w+)/g;
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
