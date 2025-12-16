
export interface DTOField {
    name: string;
    type: string;
    optional?: boolean;
}

export interface DTOStrategy {
    generate(name: string, fields: DTOField[]): string;
    supports(languageId: string): boolean;
}
