
import { MockStrategy, MockMethod } from './mock-strategy.interface';

export class TypeScriptMockStrategy implements MockStrategy {
    supports(languageId: string): boolean {
        return languageId === 'typescript' || languageId === 'javascript';
    }

    generateMock(name: string, methods: MockMethod[]): string {
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

    generateStub(className: string, methods: string[]): string {
        return `export class ${className}Stub {
${methods.map(m => `    ${m}() {
        throw new Error('Method ${m} not implemented');
    }`).join('\n\n')}
}`;
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
}
