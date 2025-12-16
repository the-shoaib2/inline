
import { CodeGeneratorUtilsStrategy, PropertyDefinition, ConstructorParam } from './code-generator-utils-strategy.interface';

export class PythonUtilsStrategy implements CodeGeneratorUtilsStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    generateGetterSetter(property: PropertyDefinition): string {
        const { name } = property;
        return `
    @property
    def ${name}(self):
        return self._${name}
    
    @${name}.setter
    def ${name}(self, value):
        self._${name} = value`;
    }

    generateConstructor(className: string, params: ConstructorParam[]): string {
        const paramList = params.map(p => {
            const defaultVal = p.defaultValue ? ` = ${p.defaultValue}` : '';
            return `${p.name}${defaultVal}`;
        }).join(', ');

        const assignments = params.map(p => 
            `        self.${p.name} = ${p.name}`
        ).join('\n');

        return `
    def __init__(self, ${paramList}):
${assignments}`;
    }

    generateInterfaceFromObject(obj: any, name: string, indent: number = 0): string {
        const indentStr = '    '.repeat(indent);
        const properties: string[] = [];
        
        for (const [key, value] of Object.entries(obj)) {
            const type = this.inferType(value);
            properties.push(`${indentStr}    ${key}: ${type}`);
        }

        return `${indentStr}class ${name}:\n${properties.join('\n')}`;
    }

    generateTypeDefinition(name: string, value: any): string {
        return ''; // Python uses classes or TypedDict, already handled by generateInterface usually
    }

    inferType(value: any): string {
        if (value === null) return 'None';
        const jsType = typeof value;
        if (jsType === 'string') return 'str';
        if (jsType === 'number') {
            return Number.isInteger(value) ? 'int' : 'float';
        }
        if (jsType === 'boolean') return 'bool';
        if (Array.isArray(value)) return 'List';
        if (jsType === 'object') return 'Dict';
        return 'Any';
    }
}
