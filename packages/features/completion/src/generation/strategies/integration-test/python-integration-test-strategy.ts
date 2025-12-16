
import { IntegrationTestStrategy } from './integration-test-strategy.interface';

export class PythonIntegrationTestStrategy implements IntegrationTestStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    generateIntegrationTest(component: string, deps: string[]): string {
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
