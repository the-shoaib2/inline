import { ParserStrategy } from './parser-strategy.interface';
import { ASTNode } from '@inline/shared';

export class PythonParserStrategy implements ParserStrategy {
    supports(language: string): boolean {
        return language.toLowerCase() === 'python';
    }

    parse(code: string): ASTNode {
        const root: ASTNode = {
            type: 'Module',
            children: []
        };

        // Extract functions
        const functionRegex = /def\s+(\w+)\s*\(/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'FunctionDef',
                value: match[1],
                children: []
            });
        }

        // Extract classes
        const classRegex = /class\s+(\w+)/g;
        while ((match = classRegex.exec(code)) !== null) {
            root.children!.push({
                type: 'ClassDef',
                value: match[1],
                children: []
            });
        }

        return root;
    }
}
