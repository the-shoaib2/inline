
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CRUDGenerator } from '../../src/generation/crud-generator';
import { registerAllStrategies } from '../../src/strategy-registration';

describe('CRUD Generator E2E - Strategy Pattern', () => {
    let generator: CRUDGenerator;
    const mockInference: any = {};

    beforeEach(() => {
        registerAllStrategies();
        generator = new CRUDGenerator();
    });

    it('should generate TypeScript CRUD', async () => {
        const fields = [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'number' }
        ];

        const result = await generator.generateCRUD('typescript', 'User', fields);
        
        expect(result).toContain('interface User');
        expect(result).toContain('class UserService');
        expect(result).toContain('create(data: Omit<User, \'id\'>)');
        expect(result).toContain('getById(id: number)');
        expect(result).toContain('update(id: number, data: Partial<User>)');
    });

    it('should generate Python CRUD', async () => {
        const fields = [
            { name: 'name', type: 'string' },
            { name: 'active', type: 'boolean' }
        ];

        const result = await generator.generateCRUD('python', 'User', fields);
        
        expect(result).toContain('class User:');
        expect(result).toContain('class UserService:');
        expect(result).toContain('def create(self, data: Dict)');
        expect(result).toContain('def get_by_id(self, id: int)');
    });

    it('should return empty string for unsupported language', async () => {
        const fields = [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'number' }
        ];
        const result = await generator.generateCRUD('ruby', 'User', fields);
        expect(result).toBe('');
    });
});
