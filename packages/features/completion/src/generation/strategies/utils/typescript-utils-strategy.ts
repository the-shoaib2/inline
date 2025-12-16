
import { CodeGeneratorUtilsStrategy, PropertyDefinition, ConstructorParam } from './code-generator-utils-strategy.interface';

export class TypeScriptUtilsStrategy implements CodeGeneratorUtilsStrategy {
    supports(languageId: string): boolean {
        return languageId === 'typescript' || languageId === 'javascript';
    }

    generateGetterSetter(property: PropertyDefinition): string {
        const { name, type, visibility = 'public' } = property;
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        const typeAnnotation = type ? `: ${type}` : '';

        return `
    ${visibility} get${capitalizedName}()${typeAnnotation} {
        return this.${name};
    }

    ${visibility} set${capitalizedName}(value${typeAnnotation}): void {
        this.${name} = value;
    }`;
    }

    generateConstructor(className: string, params: ConstructorParam[]): string {
        const paramList = params.map(p => {
            const optional = p.optional ? '?' : '';
            const type = p.type ? `: ${p.type}` : '';
            const defaultVal = p.defaultValue ? ` = ${p.defaultValue}` : '';
            return `${p.name}${optional}${type}${defaultVal}`;
        }).join(', ');

        const assignments = params.map(p => 
            `        this.${p.name} = ${p.name};`
        ).join('\n');

        return `
    constructor(${paramList}) {
${assignments}
    }`;
    }

    generateInterfaceFromObject(obj: any, name: string, indent: number = 0): string {
        const indentStr = '    '.repeat(indent);
        const properties: string[] = [];
        
        for (const [key, value] of Object.entries(obj)) {
            const type = this.inferType(value);
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Nested object - create nested interface
                const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
                const nestedInterface = this.generateInterfaceFromObject(value, nestedName, indent + 1);
                properties.push(`${indentStr}    ${key}: ${nestedName};`);
                properties.push(nestedInterface);
            } else {
                properties.push(`${indentStr}    ${key}: ${type};`);
            }
        }

        return `${indentStr}interface ${name} {\n${properties.join('\n')}\n${indentStr}}`;
    }

    generateTypeDefinition(name: string, value: any): string {
        if (typeof value === 'object' && !Array.isArray(value)) {
            return this.generateInterfaceFromObject(value, name);
        } else {
            const type = this.inferType(value);
            return `type ${name} = ${type};`;
        }
    }

    inferType(value: any): string {
        if (value === null) return 'null';
        const jsType = typeof value;
        if (jsType === 'string') return 'string';
        if (jsType === 'number') return 'number';
        if (jsType === 'boolean') return 'boolean';
        if (Array.isArray(value)) {
            if (value.length > 0) {
                const elementType = this.inferType(value[0]);
                return `${elementType}[]`;
            }
            return 'any[]';
        }
        if (jsType === 'object') return 'object';
        return 'any';
    }
}
