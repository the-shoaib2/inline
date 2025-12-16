import { ParserStrategy } from './parser-strategy.interface';
import { ASTNode } from '@inline/shared';

export class GoParserStrategy implements ParserStrategy {
    supports(language: string): boolean {
        return language.toLowerCase() === 'go';
    }

    parse(code: string): ASTNode {
        const root: ASTNode = {
            type: 'File',
            children: []
        };

        // Extract functions
        const functionRegex = /func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'FuncDecl',
                value: match[1],
                children: []
            });
        }

        // Extract types
        const typeRegex = /type\s+(\w+)\s+(?:struct|interface)/g;
        while ((match = typeRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'TypeDecl',
                value: match[1],
                children: []
            });
        }

        return root;
    }
}
