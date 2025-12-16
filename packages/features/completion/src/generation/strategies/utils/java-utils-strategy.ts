
import { CodeGeneratorUtilsStrategy, PropertyDefinition, ConstructorParam } from './code-generator-utils-strategy.interface';

export class JavaUtilsStrategy implements CodeGeneratorUtilsStrategy {
    supports(languageId: string): boolean {
        return languageId === 'java';
    }

    generateGetterSetter(property: PropertyDefinition): string {
        const { name, type, visibility = 'public' } = property;
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        const javaType = type || 'Object';

        return `
    ${visibility} ${javaType} get${capitalizedName}() {
        return this.${name};
    }

    ${visibility} void set${capitalizedName}(${javaType} value) {
        this.${name} = value;
    }`;
    }

    generateConstructor(className: string, params: ConstructorParam[]): string {
        const paramList = params.map(p => {
            const type = p.type || 'Object';
            return `${type} ${p.name}`;
        }).join(', ');

        const assignments = params.map(p => 
            `        this.${p.name} = ${p.name};`
        ).join('\n');

        return `
    public ${className}(${paramList}) {
${assignments}
    }`;
    }

    generateInterfaceFromObject(obj: any, name: string, indent: number = 0): string {
         const indentStr = '    '.repeat(indent);
        // Simplified Map generation or similar
        return `${indentStr}// Interface generation for Java requires more context`;
    }

    generateTypeDefinition(name: string, value: any): string {
        return ''; 
    }

    inferType(value: any): string {
        return 'Object'; // Basic inference
    }
}
