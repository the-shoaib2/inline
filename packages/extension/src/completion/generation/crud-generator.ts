import * as vscode from 'vscode';
import { LlamaInference } from '@intelligence/engines/llama-engine';

/**
 * CRUD Generator
 * Generates Create, Read, Update, Delete operations
 */
export class CRUDGenerator {
    constructor(private inference: LlamaInference) {}

    async generateCRUD(
        entityName: string,
        fields: Array<{ name: string; type: string }>,
        languageId: string
    ): Promise<string> {
        if (languageId === 'typescript' || languageId === 'javascript') {
            return this.generateTypeScriptCRUD(entityName, fields);
        } else if (languageId === 'python') {
            return this.generatePythonCRUD(entityName, fields);
        }
        return '';
    }

    private generateTypeScriptCRUD(entityName: string, fields: Array<{ name: string; type: string }>): string {
        const fieldList = fields.map(f => `${f.name}: ${f.type}`).join(', ');
        
        return `// CRUD Operations for ${entityName}

interface ${entityName} {
${fields.map(f => `    ${f.name}: ${f.type};`).join('\n')}
}

class ${entityName}Service {
    private items: ${entityName}[] = [];
    private nextId = 1;

    // Create
    create(data: Omit<${entityName}, 'id'>): ${entityName} {
        const item: ${entityName} = { ...data, id: this.nextId++ };
        this.items.push(item);
        return item;
    }

    // Read
    getById(id: number): ${entityName} | undefined {
        return this.items.find(item => item.id === id);
    }

    getAll(): ${entityName}[] {
        return [...this.items];
    }

    // Update
    update(id: number, data: Partial<${entityName}>): ${entityName} | undefined {
        const index = this.items.findIndex(item => item.id === id);
        if (index === -1) return undefined;
        
        this.items[index] = { ...this.items[index], ...data };
        return this.items[index];
    }

    // Delete
    delete(id: number): boolean {
        const index = this.items.findIndex(item => item.id === id);
        if (index === -1) return false;
        
        this.items.splice(index, 1);
        return true;
    }
}

export default ${entityName}Service;`;
    }

    private generatePythonCRUD(entityName: string, fields: Array<{ name: string; type: string }>): string {
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
        const typeMap: Record<string, string> = {
            'string': 'str',
            'number': 'int',
            'boolean': 'bool',
            'any': 'Any'
        };
        return typeMap[tsType] || tsType;
    }
}
