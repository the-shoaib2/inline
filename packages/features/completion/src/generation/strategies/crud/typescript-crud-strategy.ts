
import { CRUDStrategy, CRUDField } from './crud-strategy.interface';

export class TypeScriptCRUDStrategy implements CRUDStrategy {
    supports(languageId: string): boolean {
        return languageId === 'typescript' || languageId === 'javascript';
    }

    generateCRUD(entityName: string, fields: CRUDField[]): string {
        return `// CRUD Operations for ${entityName}

interface ${entityName} {
    id: number;
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
}
