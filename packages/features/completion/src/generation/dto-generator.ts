/**
 * DTO Generator
 * Generates Data Transfer Object classes
 */
export class DTOGenerator {
    
    generateDTO(
        name: string,
        fields: Array<{ name: string; type: string; optional?: boolean }>,
        languageId: string
    ): string {
        if (languageId === 'typescript') {
            return this.generateTypeScriptDTO(name, fields);
        } else if (languageId === 'python') {
            return this.generatePythonDTO(name, fields);
        } else if (languageId === 'java') {
            return this.generateJavaDTO(name, fields);
        }
        return '';
    }

    private generateTypeScriptDTO(name: string, fields: Array<{ name: string; type: string; optional?: boolean }>): string {
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

    private generatePythonDTO(name: string, fields: Array<{ name: string; type: string; optional?: boolean }>): string {
        const props = fields.map(f => 
            `    ${f.name}: ${this.pythonType(f.type)}`
        ).join('\n');

        return `from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any

@dataclass
class ${name}DTO:
${props}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> '${name}DTO':
        """Create from dictionary"""
        return cls(**data)

    def to_json(self) -> str:
        """Convert to JSON string"""
        import json
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, json_str: str) -> '${name}DTO':
        """Create from JSON string"""
        import json
        return cls.from_dict(json.loads(json_str))`;
    }

    private generateJavaDTO(name: string, fields: Array<{ name: string; type: string; optional?: boolean }>): string {
        const props = fields.map(f => 
            `    private ${f.type} ${f.name};`
        ).join('\n');

        const getters = fields.map(f => {
            const capitalized = f.name.charAt(0).toUpperCase() + f.name.slice(1);
            return `    public ${f.type} get${capitalized}() {\n        return ${f.name};\n    }`;
        }).join('\n\n');

        const setters = fields.map(f => {
            const capitalized = f.name.charAt(0).toUpperCase() + f.name.slice(1);
            return `    public void set${capitalized}(${f.type} ${f.name}) {\n        this.${f.name} = ${f.name};\n    }`;
        }).join('\n\n');

        return `public class ${name}DTO {
${props}

${getters}

${setters}
}`;
    }

    private pythonType(tsType: string): string {
        const typeMap: Record<string, string> = {
            'string': 'str',
            'number': 'int',
            'boolean': 'bool',
            'any': 'Any'
        };
        return typeMap[tsType] || tsType;
    }
}
