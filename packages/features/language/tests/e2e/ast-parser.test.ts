import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ASTParser } from '../../src/parsers/ast-parser';
import { ParserRegistry } from '../../src/parsers/parser-registry';
// import strategies to ensure they are registered? Constructor does it.

describe('ASTParser E2E - Strategy Pattern', () => {
    let parser: ASTParser;

    beforeEach(() => {
        // Clear registry to ensure fresh state if singleton persists
        ParserRegistry.getInstance().clear();
        parser = new ASTParser();
    });

    it('should parse TypeScript functions', async () => {
        const code = `
            function add(a: number, b: number): number {
                return a + b;
            }
            const subtract = (a, b) => a - b;
        `;
        const ast = await parser.parse(code, 'typescript');
        
        expect(ast).toBeDefined();
        if (ast) {
            const functions = ast.children?.filter(c => c.type === 'FunctionDeclaration');
            expect(functions?.length).toBe(2);
            expect(functions?.some(f => f.value === 'add')).toBe(true);
            expect(functions?.some(f => f.value === 'subtract')).toBe(true);
        }
    });

    it('should parse Python classes and functions', async () => {
        const code = `
            class Animal:
                def speak(self):
                    pass
        `;
        const ast = await parser.parse(code, 'python');
        
        expect(ast).toBeDefined();
        if (ast) {
            const classes = ast.children?.filter(c => c.type === 'ClassDef');
            expect(classes?.length).toBe(1);
            expect(classes?.[0].value).toBe('Animal');
            
            const functions = ast.children?.filter(c => c.type === 'FunctionDef');
            expect(functions?.length).toBe(1);
            expect(functions?.[0].value).toBe('speak');
        }
    });

    it('should parse Java classes', async () => {
        const code = `
            public class User {
                private String name;
                public void login() {}
            }
        `;
        const ast = await parser.parse(code, 'java');
        
        expect(ast).toBeDefined();
        if (ast) {
             const classes = ast.children?.filter(c => c.type === 'ClassDeclaration');
             expect(classes?.length).toBe(1);
             expect(classes?.[0].value).toBe('User');
        }
    });

    it('should extract blocks for TypeScript', () => {
        const code = `
            function test() {
                console.log("hello");
            }
        `;
        const blocks = parser.extractBlocks(code, 'typescript');
        expect(blocks.length).toBeGreaterThan(0);
        expect(blocks[0].name).toBe('test');
        expect(blocks[0].type).toBe('function');
    });
});
