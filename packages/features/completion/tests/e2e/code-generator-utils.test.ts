
import { describe, it, expect, beforeEach } from 'vitest';
import { CodeGeneratorUtils } from '../../src/generation/code-generator-utils';
import { registerAllStrategies } from '../../src/strategy-registration';

describe('Code Generator Utils E2E - Strategy Pattern', () => {
    let utils: CodeGeneratorUtils;

    beforeEach(() => {
        registerAllStrategies();
        utils = new CodeGeneratorUtils();
    });


    it('should generate TypeScript getter/setter', async () => {
        const prop = { name: 'userName', type: 'string' };
        const result = await utils.generateGetterSetter('typescript', prop);
        expect(result).toContain('public getUserName(): string');
        expect(result).toContain('public setUserName(value: string): void');
    });

    it('should generate Python getter/setter', async () => {
        const prop = { name: 'user_name', type: 'str' };
        const result = await utils.generateGetterSetter('python', prop);
        expect(result).toContain('@property');
        expect(result).toContain('def user_name(self):');
        expect(result).toContain('@user_name.setter');
    });

    it('should generate constructor', async () => {
        const params = [{ name: 'name', type: 'string' }, { name: 'age', type: 'number', optional: true }];
        const result = await utils.generateConstructor('typescript', 'User', params);
        expect(result).toContain('constructor(name: string, age?: number)');
    });

    it('should generate constructor with values', async () => {
        const params = [{ name: 'name', defaultValue: '"John"' }];
        const result = await utils.generateConstructor('python', 'User', params);
        expect(result).toContain('def __init__(self, name = "John"):');
    });

    it('should return empty string for unsupported language', async () => {
        const prop = { name: 'age', type: 'number' };
        const result = await utils.generateGetterSetter('ruby', prop);
        expect(result).toBe('');
    });
});

