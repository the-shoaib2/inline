import { ASTNode } from '@inline/shared';

export interface ParserStrategy {
    supports(language: string): boolean;
    parse(code: string): ASTNode;
}
