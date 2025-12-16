import { ParserStrategy } from './parser-strategy.interface';
import { ASTNode } from '@inline/shared';

export class RustParserStrategy implements ParserStrategy {
    supports(language: string): boolean {
        return language.toLowerCase() === 'rust' || language.toLowerCase() === 'rs';
    }

    parse(code: string): ASTNode {
        const root: ASTNode = {
            type: 'Crate',
            children: []
        };

        // Extract functions
        const functionRegex = /fn\s+(\w+)\s*\(/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'FnDecl',
                value: match[1],
                children: []
            });
        }

        // Extract structs/enums
        const structRegex = /(?:struct|enum)\s+(\w+)/g;
        while ((match = structRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'StructDecl',
                value: match[1],
                children: []
            });
        }

        return root;
    }
}
