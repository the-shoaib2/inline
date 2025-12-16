import { DTOStrategy, DTOField } from './dto-strategy.interface';

export class TypeScriptDTOStrategy implements DTOStrategy {
    supports(languageId: string): boolean {
        return languageId === 'typescript' || languageId === 'typescriptreact';
    }

    generate(name: string, fields: DTOField[]): string {
        const props = fields.map(f => 
            `    ${f.name}${f.optional ? '?' : ''}: ${f.type};`
        ).join('\n');

        return `export interface ${name}DTO {
${props}
}

export class ${name}DTOImpl implements ${name}DTO {
${props}

    constructor(data: Partial<${name}DTO>) {
        Object.assign(this, data);
    }

    toJSON(): ${name}DTO {
        return {
${fields.map(f => `            ${f.name}: this.${f.name}`).join(',\n')}
        };
    }

    static fromJSON(json: any): ${name}DTOImpl {
        return new ${name}DTOImpl(json);
    }
}`;
    }
}
