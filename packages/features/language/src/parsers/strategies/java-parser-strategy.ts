import { ParserStrategy } from './parser-strategy.interface';
import { ASTNode } from '@inline/shared';

export class JavaParserStrategy implements ParserStrategy {
    supports(language: string): boolean {
        return language.toLowerCase() === 'java';
    }

    parse(code: string): ASTNode {
        const root: ASTNode = {
            type: 'CompilationUnit',
            children: []
        };

        // Extract classes
        const classRegex = /(?:public\s+)?class\s+(\w+)/g;
        let match;
        while ((match = classRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'ClassDeclaration',
                value: match[1],
                children: []
            });
        }

        // Extract methods
        const methodRegex = /(?:public|private|protected)?\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\(/g;
        while ((match = methodRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'MethodDeclaration',
                value: match[1],
                children: []
            });
        }

        return root;
    }
}
