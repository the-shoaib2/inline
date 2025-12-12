/**
 * Mock Generator
 * Generates mocks and stubs for testing
 */
export class MockGenerator {
    
    generateMock(
        interfaceName: string,
        methods: Array<{ name: string; params: string[]; returnType: string }>,
        languageId: string
    ): string {
        if (languageId === 'typescript' || languageId === 'javascript') {
            return this.generateTypeScriptMock(interfaceName, methods);
        } else if (languageId === 'python') {
            return this.generatePythonMock(interfaceName, methods);
        }
        return '';
    }

    private generateTypeScriptMock(name: string, methods: Array<{ name: string; params: string[]; returnType: string }>): string {
        const mockMethods = methods.map(m => {
            const params = m.params.join(', ');
            return `    ${m.name}: jest.fn((${params}) => {
        // Mock implementation
        return ${this.getDefaultValue(m.returnType)};
    })`;
        }).join(',\n\n');

        return `// Mock for ${name}
export const mock${name} = {
${mockMethods}
};

// Type-safe mock
export const createMock${name} = (): jest.Mocked<${name}> => ({
${methods.map(m => `    ${m.name}: jest.fn()`).join(',\n')}
});

// Spy helper
export const spy${name} = (instance: ${name}) => {
${methods.map(m => `    jest.spyOn(instance, '${m.name}');`).join('\n')}
    return instance;
};`;
    }

    private generatePythonMock(name: string, methods: Array<{ name: string; params: string[]; returnType: string }>): string {
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

    private getDefaultValue(type: string): string {
        const defaults: Record<string, string> = {
            'string': "''",
            'number': '0',
            'boolean': 'false',
            'void': 'undefined',
            'Promise': 'Promise.resolve()',
            'any': 'null'
        };
        
        if (type.startsWith('Promise<')) {
            return `Promise.resolve(${this.getDefaultValue(type.slice(8, -1))})`;
        }
        
        return defaults[type] || 'null';
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

    generateStub(className: string, methods: string[], languageId: string): string {
        if (languageId === 'typescript' || languageId === 'javascript') {
            return `export class ${className}Stub {
${methods.map(m => `    ${m}() {
        throw new Error('Method ${m} not implemented');
    }`).join('\n\n')}
}`;
        } else if (languageId === 'python') {
            return `class ${className}Stub:
    """Stub implementation of ${className}"""

${methods.map(m => `    def ${m}(self):
        raise NotImplementedError("Method ${m} not implemented")`).join('\n\n')}`;
        }
        return '';
    }
}
