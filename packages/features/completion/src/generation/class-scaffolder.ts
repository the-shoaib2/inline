import { CompletionStrategyRegistry, StrategyType } from '../services/strategy-registry';
import { ClassScaffoldingStrategy, ClassTemplate } from './strategies/class/class-scaffolding-strategy.interface';

/**
 * Class Scaffolder
 * Generates class and interface scaffolding using pluggable strategies
 */
export class ClassScaffolder {
    constructor() {}
    
    private getStrategy(languageId: string): ClassScaffoldingStrategy | undefined {
        return CompletionStrategyRegistry.getInstance().getStrategy<ClassScaffoldingStrategy>(StrategyType.CLASS_SCAFFOLDING, languageId);
    }

    /**
     * Generate class scaffolding using a named template
     */
    async generateClass(
        className: string,
        languageId: string,
        templateType: string = 'class'
    ): Promise<string> {
        const strategy = this.getStrategy(languageId);
        if (!strategy) return '';

        const templates = strategy.getTemplates();
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
        const strategy = this.getStrategy(languageId);
        return strategy ? strategy.getTemplates() : [];
    }

    /**
     * Generate class from properties
     */
    async generateClassFromProperties(
        className: string,
        properties: Array<{ name: string; type?: string }>,
        languageId: string
    ): Promise<string> {
        const strategy = this.getStrategy(languageId);
        return strategy ? strategy.generateClassFromProperties(className, properties) : '';
    }

    /**
     * Generate interface from object
     */
    generateInterface(
        interfaceName: string,
        properties: Array<{ name: string; type: string }>,
        languageId: string
    ): string {
        const strategy = this.getStrategy(languageId);
        return strategy ? strategy.generateInterface(interfaceName, properties) : '';
    }
}
