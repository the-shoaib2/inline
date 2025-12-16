
import { MockStrategy, MockMethod } from './mock-strategy.interface';

export class PythonMockStrategy implements MockStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    generateMock(name: string, methods: MockMethod[]): string {
        const mockMethods = methods.map(m => {
            return `    def ${m.name}(self, ${m.params.join(', ')}):
        """Mock implementation of ${m.name}"""
        return ${this.getPythonDefaultValue(m.returnType)}`;
        }).join('\n\n');

        return `from unittest.mock import Mock, MagicMock

class Mock${name}:
    """Mock implementation of ${name}"""

${mockMethods}

def create_mock_${name.toLowerCase()}():
    """Create a mock ${name} instance"""
    mock = Mock(spec=${name})
${methods.map(m => `    mock.${m.name}.return_value = ${this.getPythonDefaultValue(m.returnType)}`).join('\n')}
    return mock

def create_magic_mock_${name.toLowerCase()}():
    """Create a MagicMock ${name} instance"""
    return MagicMock(spec=${name})`;
    }

    generateStub(className: string, methods: string[]): string {
        return `class ${className}Stub:
    """Stub implementation of ${className}"""

${methods.map(m => `    def ${m}(self):
        raise NotImplementedError("Method ${m} not implemented")`).join('\n\n')}`;
    }

    private getPythonDefaultValue(type: string): string {
        const defaults: Record<string, string> = {
            'str': "''",
            'int': '0',
            'float': '0.0',
            'bool': 'False',
            'None': 'None',
            'list': '[]',
            'dict': '{}'
        };
        return defaults[type] || 'None';
    }
}
