
import { CRUDStrategy, CRUDField } from './crud-strategy.interface';

export class PythonCRUDStrategy implements CRUDStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    generateCRUD(entityName: string, fields: CRUDField[]): string {
        return `# CRUD Operations for ${entityName}

from typing import List, Optional, Dict
from dataclasses import dataclass

@dataclass
class ${entityName}:
${fields.map(f => `    ${f.name}: ${this.pythonType(f.type)}`).join('\n')}

class ${entityName}Service:
    def __init__(self):
        self.items: List[${entityName}] = []
        self.next_id = 1

    def create(self, data: Dict) -> ${entityName}:
        """Create a new ${entityName}"""
        item = ${entityName}(id=self.next_id, **data)
        self.next_id += 1
        self.items.append(item)
        return item

    def get_by_id(self, id: int) -> Optional[${entityName}]:
        """Get ${entityName} by ID"""
        return next((item for item in self.items if item.id == id), None)

    def get_all(self) -> List[${entityName}]:
        """Get all ${entityName}s"""
        return self.items.copy()

    def update(self, id: int, data: Dict) -> Optional[${entityName}]:
        """Update ${entityName}"""
        item = self.get_by_id(id)
        if not item:
            return None
        
        for key, value in data.items():
            setattr(item, key, value)
        return item

    def delete(self, id: int) -> bool:
        """Delete ${entityName}"""
        item = self.get_by_id(id)
        if not item:
            return False
        
        self.items.remove(item)
        return True`;
    }

    private pythonType(tsType: string): string {
        // Handle arrays (e.g., string[] -> List[str])
        if (tsType.endsWith('[]')) {
            const baseType = tsType.slice(0, -2);
            return `List[${this.pythonType(baseType)}]`;
        }
        
        // Handle optional types (e.g., string? -> Optional[str])
        if (tsType.endsWith('?')) {
            const baseType = tsType.slice(0, -1);
            return `Optional[${this.pythonType(baseType)}]`;
        }
        
        const typeMap: Record<string, string> = {
            'string': 'str',
            'number': 'int',
            'boolean': 'bool',
            'any': 'Any',
            'Date': 'datetime',
            'object': 'Dict[str, Any]',
            'void': 'None'
        };
        return typeMap[tsType] || tsType;
    }
}
