import { TestGenerator } from './test-generator';

/**
 * Integration Test Generator
 * Generates integration tests
 */
export class IntegrationTestGenerator extends TestGenerator {
    
    async generateIntegrationTest(
        componentName: string,
        dependencies: string[],
        languageId: string
    ): Promise<string> {
        if (languageId === 'typescript' || languageId === 'javascript') {
            return this.generateTypeScriptIntegrationTest(componentName, dependencies);
        } else if (languageId === 'python') {
            return this.generatePythonIntegrationTest(componentName, dependencies);
        }
        return '';
    }

    private generateTypeScriptIntegrationTest(component: string, deps: string[]): string {
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

    private generatePythonIntegrationTest(component: string, deps: string[]): string {
        const componentLower = component.toLowerCase();
        
        return `import unittest
from unittest.mock import Mock, patch
from src.${componentLower} import ${component}
${deps.map(d => `from src.${d.toLowerCase()} import ${d}`).join('\n')}

class Test${component}Integration(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures"""
${deps.map(d => `        self.${d.toLowerCase()} = ${d}()`).join('\n')}
        self.${componentLower} = ${component}(${deps.map(d => `self.${d.toLowerCase()}`).join(', ')})

    def tearDown(self):
        """Clean up after tests"""
        pass

    def test_integration_with_${deps[0]?.toLowerCase() || 'dependency'}(self):
        """Test integration with ${deps[0] || 'dependency'}"""
        # Arrange
        test_data = {}

        # Act
        result = self.${componentLower}.process(test_data)

        # Assert
        self.assertIsNotNone(result)
        self.assertTrue(result.get('success'))

    def test_handles_${deps[0]?.toLowerCase() || 'dependency'}_failures(self):
        """Test handling of ${deps[0] || 'dependency'} failures"""
        # Arrange
        with patch.object(self.${deps[0]?.toLowerCase() || 'dependency'}, 'method', side_effect=Exception('Test error')):
            # Act & Assert
            with self.assertRaises(Exception):
                self.${componentLower}.process({})

if __name__ == '__main__':
    unittest.main()`;
    }
}
