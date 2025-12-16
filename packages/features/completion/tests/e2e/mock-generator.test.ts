
import { describe, it, expect, beforeEach } from 'vitest';
import { MockGenerator } from '../../src/generation/mock-generator';
import { registerAllStrategies } from '../../src/strategy-registration';

describe('Mock Generator E2E - Strategy Pattern', () => {
    let generator: MockGenerator;

    beforeEach(() => {
        registerAllStrategies();
        generator = new MockGenerator();
    });

    it('should generate TypeScript mock', () => {
        const methods = [
            { name: 'getUser', params: ['id'], returnType: 'any' },
            { name: 'save', params: ['data'], returnType: 'Promise<boolean>' }
        ];

        const result = generator.generateMock('typescript', 'UserService', methods);
        
        expect(result).toContain('export const mockUserService');
        expect(result).toContain('getUser: jest.fn((id) => {');
        expect(result).toContain('Promise.resolve(false)');
        expect(result).toContain('createMockUserService');
        expect(result).toContain('spyUserService');
    });

    it('should generate Python mock', () => {
        const methods = [
            { name: 'get_user', params: ['id'], returnType: 'dict' },
            { name: 'save', params: ['data'], returnType: 'bool' }
        ];

        const result = generator.generateMock('python', 'UserService', methods);
        
        expect(result).toContain('class MockUserService:');
        expect(result).toContain('def get_user(self, id):');
        expect(result).toContain('return {}');
        expect(result).toContain('create_mock_userservice():');
        expect(result).toContain('mock.get_user.return_value = {}');
    });

    it('should generate TypeScript stub', () => {
        const methods = ['start', 'stop'];
        const result = generator.generateStub('typescript', 'Server', methods);
        
        expect(result).toContain('export class ServerStub {');
        expect(result).toContain("throw new Error('Method start not implemented');");
    });

    it('should generate Python stub', () => {
        const methods = ['start', 'stop'];
        const result = generator.generateStub('python', 'Server', methods);
        
        expect(result).toContain('class ServerStub:');
        expect(result).toContain('raise NotImplementedError("Method start not implemented")');
    });

    it('should return empty string for unsupported language', () => {
        const result = generator.generateMock('ruby', 'Test', []);
        expect(result).toBe('');
    });
});
