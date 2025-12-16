
import { describe, it, expect } from 'vitest';
import { TypeScriptAnalysisStrategy } from '../../src/strategies/typescript-analysis-strategy';
import { PythonAnalysisStrategy } from '../../src/strategies/python-analysis-strategy';

describe('Context Analysis Strategy E2E', () => {
    describe('TypeScript Strategy', () => {
        const strategy = new TypeScriptAnalysisStrategy();

        it('should extract imports', () => {
            const text = `
                import { foo, bar } from './module';
                import React from 'react';
            `;
            const imports = strategy.extractImports(text);
            expect(imports).toHaveLength(2);
            expect(imports[0].path).toBe('./module');
            expect(imports[0].symbols).toEqual(['foo', 'bar']);
            expect(imports[1].path).toBe('react');
            expect(imports[1].symbols).toEqual(['React']);
        });

        it('should extract classes', () => {
            const text = `
                class MyClass extends Base implements IFace {
                    constructor() {}
                }
            `;
            const classes = strategy.extractClasses(text);
            expect(classes).toHaveLength(1);
            expect(classes[0].name).toBe('MyClass');
            expect(classes[0].extends).toBe('Base');
            expect(classes[0].implements).toEqual(['IFace']);
        });

        it('should extract functions', () => {
            const text = `
                function myFunc(a: string): number { return 1; }
                const arrow = (b: number) => b + 1;
            `;
            const functions = strategy.extractFunctions(text);
            expect(functions).toHaveLength(2);
            expect(functions[0].name).toBe('myFunc');
            expect(functions[0].parameters).toEqual(['a: string']);
            expect(functions[1].name).toBe('arrow');
        });
    });

    describe('Python Strategy', () => {
        const strategy = new PythonAnalysisStrategy();

        it('should extract imports', () => {
            const text = `
                from os import path, system
                import sys
            `;
            const imports = strategy.extractImports(text);
            expect(imports).toHaveLength(2);
            expect(imports[0].path).toBe('os');
            expect(imports[0].symbols).toEqual(['path', 'system']);
            expect(imports[1].path).toBe('sys');
        });

        it('should extract classes', () => {
            const text = `class MyClass(Base):`;
            const classes = strategy.extractClasses(text);
            expect(classes).toHaveLength(1);
            expect(classes[0].name).toBe('MyClass');
            expect(classes[0].extends).toBe('Base');
        });

        it('should extract functions', () => {
            const text = `def my_func(a, b) -> int:`;
            const functions = strategy.extractFunctions(text);
            expect(functions).toHaveLength(1);
            expect(functions[0].name).toBe('my_func');
            expect(functions[0].parameters).toEqual(['a', 'b']);
        });
    });
});
