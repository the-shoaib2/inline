
export interface ClassTemplate {
    name: string;
    description: string;
    template: string;
}

export interface ClassScaffoldingStrategy {
    getTemplates(): ClassTemplate[];
    generateClassFromProperties(className: string, properties: Array<{ name: string; type?: string }>): string;
    generateInterface(interfaceName: string, properties: Array<{ name: string; type: string }>): string;
    supports(languageId: string): boolean;
}
