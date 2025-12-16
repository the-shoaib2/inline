
import { describe, it, expect, beforeEach } from 'vitest';
import { ClassScaffolder } from '../../src/generation/class-scaffolder';
import { registerAllStrategies } from '../../src/strategy-registration';

describe('Class Scaffolder E2E - Strategy Pattern', () => {
    let scaffolder: ClassScaffolder;

    beforeEach(() => {
        registerAllStrategies();
        scaffolder = new ClassScaffolder();
    });

    it('should generate TypeScript class from properties', async () => {
        const props = [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' }
        ];

        const result = await scaffolder.generateClassFromProperties('User', props, 'typescript');
        
        expect(result).toContain('export class User');
        expect(result).toContain('constructor(id: number, name: string)');
        expect(result).toContain('this.id = id;');
    });

    it('should generate Python class from properties', async () => {
        const props = [
            { name: 'id' },
            { name: 'name' }
        ];

        const result = await scaffolder.generateClassFromProperties('User', props, 'python');
        
        expect(result).toContain('class User:');
        expect(result).toContain('def __init__(self, id, name):');
        expect(result).toContain('self.id = id');
    });

    it('should generate Java interface', () => {
        const props = [
            { name: 'id', type: 'String' },
            { name: 'active', type: 'boolean' }
        ];

        const result = scaffolder.generateInterface('IUser', props, 'java');
        
        expect(result).toContain('public interface IUser');
        expect(result).toContain('String getId();');
        expect(result).toContain('boolean getActive();');
    });

    it('should return empty templates for unknown language', () => {
        const templates = scaffolder.getTemplates('unknown');
        expect(templates).toBeDefined();
        expect(templates.length).toBe(0);
    });
});
