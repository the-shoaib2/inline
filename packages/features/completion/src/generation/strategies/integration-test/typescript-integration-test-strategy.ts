
import { IntegrationTestStrategy } from './integration-test-strategy.interface';

export class TypeScriptIntegrationTestStrategy implements IntegrationTestStrategy {
    supports(languageId: string): boolean {
        return languageId === 'typescript' || languageId === 'javascript';
    }

    generateIntegrationTest(component: string, deps: string[]): string {
        return `import { ${component} } from '../src/${component.toLowerCase()}';
${deps.map(d => `import { ${d} } from '../src/${d.toLowerCase()}';`).join('\n')}

describe('${component} Integration Tests', () => {
    let ${component.toLowerCase()}: ${component};
${deps.map(d => `    let ${d.toLowerCase()}: ${d};`).join('\n')}

    beforeEach(() => {
${deps.map(d => `        ${d.toLowerCase()} = new ${d}();`).join('\n')}
        ${component.toLowerCase()} = new ${component}(${deps.map(d => d.toLowerCase()).join(', ')});
    });

    afterEach(() => {
        // Cleanup
    });

    it('should integrate with ${deps[0] || 'dependencies'}', async () => {
        // Arrange
        const testData = { /* test data */ };

        // Act
        const result = await ${component.toLowerCase()}.process(testData);

        // Assert
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success', true);
    });

    it('should handle ${deps[0] || 'dependency'} failures gracefully', async () => {
        // Arrange
        jest.spyOn(${deps[0]?.toLowerCase() || 'dependency'}, 'method').mockRejectedValue(new Error('Test error'));

        // Act & Assert
        await expect(${component.toLowerCase()}.process({})).rejects.toThrow();
    });

    it('should coordinate between multiple dependencies', async () => {
        // Arrange
        const data = { /* test data */ };

        // Act
        const result = await ${component.toLowerCase()}.processWithDependencies(data);

        // Assert
        expect(result).toBeDefined();
${deps.map(d => `        expect(${d.toLowerCase()}.method).toHaveBeenCalled();`).join('\n')}
    });
});`;
    }
}
