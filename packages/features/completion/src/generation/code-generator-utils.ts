
import * as vscode from 'vscode';
import { CompletionStrategyRegistry, StrategyType } from '../services/strategy-registry';
// @ts-ignore
import { CodeGeneratorUtilsStrategy, PropertyDefinition, ConstructorParam } from './strategies/utils/code-generator-utils-strategy.interface';

export { PropertyDefinition, ConstructorParam };

export class CodeGeneratorUtils {
    constructor() {}

    private getStrategy(languageId: string): CodeGeneratorUtilsStrategy | undefined {
        return CompletionStrategyRegistry.getInstance().getStrategy<CodeGeneratorUtilsStrategy>(StrategyType.CODE_GENERATOR_UTILS, languageId);
    }

    /**
     * Generate getter and setter methods for a property
     */
    generateGetterSetter(languageId: string, property: PropertyDefinition): string {
        const strategy = this.getStrategy(languageId);
        return strategy ? strategy.generateGetterSetter(property) : '';
    }

    /**
     * Generate constructor from properties
     */
    async generateConstructor(languageId: string, className: string, params: ConstructorParam[]): Promise<string> {
        const strategy = this.getStrategy(languageId);
        return strategy ? strategy.generateConstructor(className, params) : '';
    }

    /**
     * Generate interface from JSON
     */
    async generateInterfaceFromJSON(json: string, interfaceName: string, languageId: string): Promise<string> {
        try {
            const obj = JSON.parse(json);
            return await this.generateInterfaceFromObject(languageId, interfaceName, obj);
        } catch (error) {
            throw new Error('Invalid JSON');
        }
    }

    async generateInterfaceFromObject(languageId: string, interfaceName: string, obj: any): Promise<string> {
        const strategy = this.getStrategy(languageId);
        if (!strategy) return '';
        return strategy.generateInterfaceFromObject(obj, interfaceName);
    }

    /**
     * Generate type definition from value
     */
    async generateTypeDefinition(languageId: string, name: string, value: any): Promise<string> {
        const strategy = this.getStrategy(languageId);
        return strategy ? strategy.generateTypeDefinition(name, value) : '';
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
            .map(p => this.generateGetterSetter(languageId, p))
            .join('\n');
    }
}
