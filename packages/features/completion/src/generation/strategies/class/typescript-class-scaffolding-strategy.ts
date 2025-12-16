
import { ClassScaffoldingStrategy, ClassTemplate } from './class-scaffolding-strategy.interface';

export class TypeScriptClassScaffoldingStrategy implements ClassScaffoldingStrategy {
    supports(languageId: string): boolean {
        return languageId === 'typescript' || languageId === 'javascript' || languageId === 'typescriptreact' || languageId === 'javascriptreact';
    }

    getTemplates(): ClassTemplate[] {
        return [
            {
                name: 'class',
                description: 'Basic TypeScript class',
                template: `export class {ClassName} {
    constructor() {
        // Constructor
    }
}`
            },
            {
                name: 'interface',
                description: 'TypeScript interface',
                template: `export interface {InterfaceName} {
    // Properties
}`
            },
            {
                name: 'abstract-class',
                description: 'Abstract class',
                template: `export abstract class {ClassName} {
    abstract method(): void;
}`
            },
            {
                name: 'singleton',
                description: 'Singleton pattern class',
                template: `export class {ClassName} {
    private static instance: {ClassName};
    
    private constructor() {}
    
    public static getInstance(): {ClassName} {
        if (!{ClassName}.instance) {
            {ClassName}.instance = new {ClassName}();
        }
        return {ClassName}.instance;
    }
}`
            }
        ];
    }

    generateClassFromProperties(className: string, properties: Array<{ name: string; type?: string }>): string {
        const props = properties.map(p => 
            `    ${p.name}${p.type ? ': ' + p.type : ''};`
        ).join('\n');
        
        const constructorParams = properties.map(p =>
            `${p.name}${p.type ? ': ' + p.type : ''}`
        ).join(', ');
        
        const assignments = properties.map(p =>
            `        this.${p.name} = ${p.name};`
        ).join('\n');

        return `export class ${className} {
${props}

    constructor(${constructorParams}) {
${assignments}
    }
}`;
    }

    generateInterface(interfaceName: string, properties: Array<{ name: string; type: string }>): string {
        const props = properties.map(p =>
            `    ${p.name}: ${p.type};`
        ).join('\n');

        return `export interface ${interfaceName} {
${props}
}`;
    }
}
