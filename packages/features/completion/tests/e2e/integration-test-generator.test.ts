
import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrationTestGenerator } from '../../src/generation/integration-test-generator';
import { registerAllStrategies } from '../../src/strategy-registration';

describe('Integration Test Generator E2E - Strategy Pattern', () => {
    let generator: IntegrationTestGenerator;
    const mockInference: any = {};

    beforeEach(() => {
        registerAllStrategies();
        generator = new IntegrationTestGenerator();
    });

    it('should generate TypeScript integration test', async () => {
        const deps = ['Database', 'Cache'];
        const result = await generator.generateIntegrationTest('UserService', deps, 'typescript');
        
        expect(result).toContain('import { UserService }');
        expect(result).toContain('import { Database }');
        expect(result).toContain('describe(\'UserService Integration Tests\'');
        expect(result).toContain('should integrate with Database');
        expect(result).toContain('should coordinate between multiple dependencies');
    });

    it('should generate Python integration test', async () => {
        const deps = ['Database', 'Cache'];
        const result = await generator.generateIntegrationTest('UserService', deps, 'python');
        
        expect(result).toContain('from src.userservice import UserService');
        expect(result).toContain('class TestUserServiceIntegration(unittest.TestCase):');
        expect(result).toContain('def test_integration_with_database(self):');
    });

    it('should return empty string for unsupported language', async () => {
        const result = await generator.generateIntegrationTest('User', [], 'ruby');
        expect(result).toBe('');
    });
});
