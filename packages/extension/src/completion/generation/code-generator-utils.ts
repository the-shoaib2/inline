import * as vscode from 'vscode';
import { SemanticAnalyzer } from '@language/analysis/semantic-analyzer';

interface PropertyDefinition {
    name: string;
    type?: string;
    visibility?: 'public' | 'private' | 'protected';
    isStatic?: boolean;
    isReadonly?: boolean;
}

interface ConstructorParam {
    name: string;
    type?: string;
    optional?: boolean;
    defaultValue?: string;
}

export class CodeGeneratorUtils {
    private semanticAnalyzer: SemanticAnalyzer;

    constructor() {
        this.semanticAnalyzer = new SemanticAnalyzer();
    }

    /**
     * Generate getter and setter methods for a property
     */
    generateGetterSetter(property: PropertyDefinition, languageId: string): string {
        const { name, type, visibility = 'public' } = property;
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

        if (languageId === 'typescript' || languageId === 'javascript') {
            const typeAnnotation = type ? `: ${type}` : '';
            const returnType = type || 'any';
            
            return `
    ${visibility} get${capitalizedName}()${typeAnnotation} {
        return this.${name};
    }

    ${visibility} set${capitalizedName}(value${typeAnnotation}): void {
        this.${name} = value;
    }`;
        } else if (languageId === 'python') {
            return `
    @property
    def ${name}(self):
        return self._${name}
    
    @${name}.setter
    def ${name}(self, value):
        self._${name} = value`;
        } else if (languageId === 'java') {
            const javaType = type || 'Object';
            return `
    ${visibility} ${javaType} get${capitalizedName}() {
        return this.${name};
    }

    ${visibility} void set${capitalizedName}(${javaType} value) {
        this.${name} = value;
    }`;
        }

        return '';
    }

    /**
     * Generate constructor from properties
     */
    generateConstructor(
        className: string,
        params: ConstructorParam[],
        languageId: string
    ): string {
        if (languageId === 'typescript' || languageId === 'javascript') {
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
        } else if (languageId === 'python') {
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
        } else if (languageId === 'java') {
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

        return '';
    }

    /**
     * Generate interface from JSON
     */
    generateInterfaceFromJSON(json: string, interfaceName: string, languageId: string): string {
        try {
            const obj = JSON.parse(json);
            return this.generateInterfaceFromObject(obj, interfaceName, languageId);
        } catch (error) {
            throw new Error('Invalid JSON');
        }
    }

    private generateInterfaceFromObject(obj: any, name: string, languageId: string, indent: number = 0): string {
        const indentStr = '    '.repeat(indent);
        
        if (languageId === 'typescript') {
            const properties: string[] = [];
            
            for (const [key, value] of Object.entries(obj)) {
                const type = this.inferType(value, languageId);
                
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Nested object - create nested interface
                    const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
                    const nestedInterface = this.generateInterfaceFromObject(value, nestedName, languageId, indent + 1);
                    properties.push(`${indentStr}    ${key}: ${nestedName};`);
                    properties.push(nestedInterface);
                } else {
                    properties.push(`${indentStr}    ${key}: ${type};`);
                }
            }

            return `${indentStr}interface ${name} {\n${properties.join('\n')}\n${indentStr}}`;
        } else if (languageId === 'python') {
            const properties: string[] = [];
            
            for (const [key, value] of Object.entries(obj)) {
                const type = this.inferType(value, languageId);
                properties.push(`${indentStr}    ${key}: ${type}`);
            }

            return `${indentStr}class ${name}:\n${properties.join('\n')}`;
        }

        return '';
    }

    private inferType(value: any, languageId: string): string {
        if (value === null) {
            return languageId === 'typescript' ? 'null' : 'None';
        }

        const jsType = typeof value;
        
        if (languageId === 'typescript') {
            if (jsType === 'string') return 'string';
            if (jsType === 'number') return 'number';
            if (jsType === 'boolean') return 'boolean';
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    const elementType = this.inferType(value[0], languageId);
                    return `${elementType}[]`;
                }
                return 'any[]';
            }
            if (jsType === 'object') return 'object';
            return 'any';
        } else if (languageId === 'python') {
            if (jsType === 'string') return 'str';
            if (jsType === 'number') {
                return Number.isInteger(value) ? 'int' : 'float';
            }
            if (jsType === 'boolean') return 'bool';
            if (Array.isArray(value)) return 'List';
            if (jsType === 'object') return 'Dict';
            return 'Any';
        }

        return 'any';
    }

    /**
     * Generate type definition from value
     */
    generateTypeDefinition(name: string, value: any, languageId: string): string {
        if (languageId === 'typescript') {
            if (typeof value === 'object' && !Array.isArray(value)) {
                return this.generateInterfaceFromObject(value, name, languageId);
            } else {
                const type = this.inferType(value, languageId);
                return `type ${name} = ${type};`;
            }
        }

        return '';
    }

    /**
     * Extract properties from class code
     */
    async extractPropertiesFromClass(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<PropertyDefinition[]> {
        const text = document.getText();
        const properties: PropertyDefinition[] = [];

        // Simple regex-based extraction (can be enhanced with AST)
        const classMatch = text.match(/class\s+(\w+)/);
        if (!classMatch) {
            return properties;
        }

        // Match TypeScript/JavaScript properties
        const propRegex = /(public|private|protected)?\s*(readonly)?\s*(\w+)(\?)?:\s*([^;=\n]+)/g;
        let match;

        while ((match = propRegex.exec(text)) !== null) {
            properties.push({
                name: match[3],
                type: match[5].trim(),
                visibility: (match[1] as any) || 'public',
                isReadonly: !!match[2]
            });
        }

        return properties;
    }

    /**
     * Generate all getters and setters for a class
     */
    async generateAllGettersSetters(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<string> {
        const properties = await this.extractPropertiesFromClass(document, position);
        const languageId = document.languageId;

        return properties
            .filter(p => !p.isReadonly) // Skip readonly properties for setters
            .map(p => this.generateGetterSetter(p, languageId))
            .join('\n');
    }
}
