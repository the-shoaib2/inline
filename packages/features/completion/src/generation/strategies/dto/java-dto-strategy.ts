import { DTOStrategy, DTOField } from './dto-strategy.interface';

export class JavaDTOStrategy implements DTOStrategy {
    supports(languageId: string): boolean {
        return languageId === 'java';
    }

    generate(name: string, fields: DTOField[]): string {
        const props = fields.map(f => 
            `    private ${this.javaType(f.type)} ${f.name};`
        ).join('\n');

        const getters = fields.map(f => {
            const capitalized = f.name.charAt(0).toUpperCase() + f.name.slice(1);
            const type = this.javaType(f.type);
            return `    public ${type} get${capitalized}() {\n        return ${f.name};\n    }`;
        }).join('\n\n');

        const setters = fields.map(f => {
            const capitalized = f.name.charAt(0).toUpperCase() + f.name.slice(1);
            const type = this.javaType(f.type);
            return `    public void set${capitalized}(${type} ${f.name}) {\n        this.${f.name} = ${f.name};\n    }`;
        }).join('\n\n');

        return `public class ${name}DTO {
${props}

${getters}

${setters}
}`;
    }

    private javaType(tsType: string): string {
         const typeMap: Record<string, string> = {
            'string': 'String',
            'number': 'double', // Safe default
            'boolean': 'boolean',
            'any': 'Object',
            'void': 'void'
        };
        return typeMap[tsType] || tsType;
    }
}
