
export interface PropertyDefinition {
    name: string;
    type?: string;
    visibility?: 'public' | 'private' | 'protected';
    isStatic?: boolean;
    isReadonly?: boolean;
}

export interface ConstructorParam {
    name: string;
    type?: string;
    optional?: boolean;
    defaultValue?: string;
}

export interface CodeGeneratorUtilsStrategy {
    generateGetterSetter(property: PropertyDefinition): string;
    generateConstructor(className: string, params: ConstructorParam[]): string;
    generateInterfaceFromObject(obj: any, name: string, indent?: number): string;
    generateTypeDefinition(name: string, value: any): string;
    supports(languageId: string): boolean;
    inferType(value: any): string;
}
