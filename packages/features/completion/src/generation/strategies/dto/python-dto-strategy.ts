import { DTOStrategy, DTOField } from './dto-strategy.interface';

export class PythonDTOStrategy implements DTOStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    generate(name: string, fields: DTOField[]): string {
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

    private pythonType(tsType: string): string {
        const typeMap: Record<string, string> = {
            'string': 'str',
            'number': 'int',
            'boolean': 'bool',
            'any': 'Any',
            'void': 'None',
            'null': 'None',
            'undefined': 'None'
        };
        return typeMap[tsType] || tsType;
    }
}
