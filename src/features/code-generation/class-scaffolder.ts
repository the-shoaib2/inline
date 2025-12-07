import * as vscode from 'vscode';

interface ClassTemplate {
    name: string;
    template: string;
    description: string;
}

/**
 * Class Scaffolder
 * Generates class and interface scaffolding
 */
export class ClassScaffolder {
    
    private templates: Record<string, ClassTemplate[]> = {
        typescript: [
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
        ],
        javascript: [
            {
                name: 'class',
                description: 'ES6 class',
                template: `class {ClassName} {
    constructor() {
        // Constructor
    }
}`
            },
            {
                name: 'class-export',
                description: 'Exported ES6 class',
                template: `export class {ClassName} {
    constructor() {
        // Constructor
    }
}`
            }
        ],
        python: [
            {
                name: 'class',
                description: 'Python class',
                template: `class {ClassName}:
    def __init__(self):
        pass`
            },
            {
                name: 'dataclass',
                description: 'Python dataclass',
                template: `from dataclasses import dataclass

@dataclass
class {ClassName}:
    # Add fields here
    pass`
            }
        ],
        java: [
            {
                name: 'class',
                description: 'Java class',
                template: `public class {ClassName} {
    public {ClassName}() {
        // Constructor
    }
}`
            },
            {
                name: 'interface',
                description: 'Java interface',
                template: `public interface {InterfaceName} {
    // Method signatures
}`
            }
        ]
    };

    /**
     * Generate class scaffolding
     */
    async generateClass(
        className: string,
        languageId: string,
        templateType: string = 'class'
    ): Promise<string> {
        const templates = this.templates[languageId] || this.templates.typescript;
        const template = templates.find(t => t.name === templateType);
        
        if (!template) {
            throw new Error(`Template '${templateType}' not found for language '${languageId}'`);
        }

        return template.template
            .replace(/{ClassName}/g, className)
            .replace(/{InterfaceName}/g, className);
    }

    /**
     * Get available templates for a language
     */
    getTemplates(languageId: string): ClassTemplate[] {
        return this.templates[languageId] || this.templates.typescript;
    }

    /**
     * Generate class from properties
     */
    async generateClassFromProperties(
        className: string,
        properties: Array<{ name: string; type?: string }>,
        languageId: string
    ): Promise<string> {
        if (languageId === 'typescript') {
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
        } else if (languageId === 'python') {
            const params = properties.map(p => p.name).join(', ');
            const assignments = properties.map(p =>
                `        self.${p.name} = ${p.name}`
            ).join('\n');

            return `class ${className}:
    def __init__(self, ${params}):
${assignments}`;
        }

        // Fallback to basic template
        return await this.generateClass(className, languageId);
    }

    /**
     * Generate interface from object
     */
    generateInterface(
        interfaceName: string,
        properties: Array<{ name: string; type: string }>,
        languageId: string
    ): string {
        if (languageId === 'typescript') {
            const props = properties.map(p =>
                `    ${p.name}: ${p.type};`
            ).join('\n');

            return `export interface ${interfaceName} {
${props}
}`;
        } else if (languageId === 'java') {
            const methods = properties.map(p =>
                `    ${p.type} get${p.name.charAt(0).toUpperCase() + p.name.slice(1)}();`
            ).join('\n');

            return `public interface ${interfaceName} {
${methods}
}`;
        }

        return '';
    }
}
