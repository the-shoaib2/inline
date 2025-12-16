import { describe, it, expect, beforeEach } from 'vitest';
import { DTOGenerator } from '../../src/generation/dto-generator';
import { registerAllStrategies } from '../../src/strategy-registration';

describe('DTO Generator E2E - Strategy Pattern', () => {
    let generator: DTOGenerator;

    beforeEach(() => {
        registerAllStrategies();
        generator = new DTOGenerator();
    });

    it('should generate TypeScript DTO using strategy', () => {
        const fields = [
            { name: 'id', type: 'string' },
            { name: 'count', type: 'number', optional: true }
        ];

        const result = generator.generateDTO('typescript', 'User', fields);
        
        expect(result).toContain('export interface UserDTO');
        expect(result).toContain('id: string;');
        expect(result).toContain('count?: number;');
        expect(result).toContain('class UserDTOImpl');
    });

    it('should generate Python DTO using strategy', () => {
        const fields = [
            { name: 'id', type: 'string' },
            { name: 'isActive', type: 'boolean' }
        ];

        const result = generator.generateDTO('python', 'User', fields);
        
        expect(result).toContain('@dataclass');
        expect(result).toContain('class UserDTO:');
        expect(result).toContain('id: str');
        expect(result).toContain('isActive: bool');
    });

    it('should generate Java DTO using strategy', () => {
        const fields = [
            { name: 'id', type: 'string' },
            { name: 'score', type: 'number' }
        ];

        const result = generator.generateDTO('java', 'User', fields);
        
        expect(result).toContain('public class UserDTO');
        expect(result).toContain('private String id;');
        expect(result).toContain('private double score;');
        expect(result).toContain('public String getId()');
        expect(result).toContain('public void setId(String id)');
    });

    it('should return empty string for unsupported language', () => {
        const fields = [{ name: 'id', type: 'string' }];
        const result = generator.generateDTO('unknown-lang', 'User', fields);
        expect(result).toBe('');
    });
});
