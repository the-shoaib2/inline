
export interface CRUDField {
    name: string;
    type: string;
}

export interface CRUDStrategy {
    generateCRUD(entityName: string, fields: CRUDField[]): string;
    supports(languageId: string): boolean;
}
