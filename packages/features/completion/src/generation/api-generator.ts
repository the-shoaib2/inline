import * as vscode from 'vscode';

/**
 * API Generator
 * Generates REST API endpoints
 */
export class APIGenerator {
    
    generateRESTAPI(
        resourceName: string,
        fields: Array<{ name: string; type: string }>,
        framework: 'express' | 'fastapi' | 'spring' = 'express'
    ): string {
        if (framework === 'express') {
            return this.generateExpressAPI(resourceName, fields);
        } else if (framework === 'fastapi') {
            return this.generateFastAPI(resourceName, fields);
        }
        return '';
    }

    private generateExpressAPI(resource: string, fields: Array<{ name: string; type: string }>): string {
        const resourceLower = resource.toLowerCase();
        
        return `// Express REST API for ${resource}
import express from 'express';
const router = express.Router();

// GET all ${resource}s
router.get('/${resourceLower}s', async (req, res) => {
    try {
        const items = await ${resource}Service.getAll();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET ${resource} by ID
router.get('/${resourceLower}s/:id', async (req, res) => {
    try {
        const item = await ${resource}Service.getById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: '${resource} not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create ${resource}
router.post('/${resourceLower}s', async (req, res) => {
    try {
        const item = await ${resource}Service.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update ${resource}
router.put('/${resourceLower}s/:id', async (req, res) => {
    try {
        const item = await ${resource}Service.update(req.params.id, req.body);
        if (!item) {
            return res.status(404).json({ error: '${resource} not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE ${resource}
router.delete('/${resourceLower}s/:id', async (req, res) => {
    try {
        const success = await ${resource}Service.delete(req.params.id);
        if (!success) {
            return res.status(404).json({ error: '${resource} not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;`;
    }

    private generateFastAPI(resource: string, fields: Array<{ name: string; type: string }>): string {
        const resourceLower = resource.toLowerCase();
        
        return `# FastAPI REST API for ${resource}
from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel

router = APIRouter()

class ${resource}Base(BaseModel):
${fields.map(f => `    ${f.name}: ${this.pythonType(f.type)}`).join('\n')}

class ${resource}Create(${resource}Base):
    pass

class ${resource}(${resource}Base):
    id: int

@router.get("/${resourceLower}s", response_model=List[${resource}])
async def get_${resourceLower}s():
    """Get all ${resource}s"""
    return await ${resource}Service.get_all()

@router.get("/${resourceLower}s/{id}", response_model=${resource})
async def get_${resourceLower}(id: int):
    """Get ${resource} by ID"""
    item = await ${resource}Service.get_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="${resource} not found")
    return item

@router.post("/${resourceLower}s", response_model=${resource}, status_code=201)
async def create_${resourceLower}(item: ${resource}Create):
    """Create new ${resource}"""
    return await ${resource}Service.create(item.dict())

@router.put("/${resourceLower}s/{id}", response_model=${resource})
async def update_${resourceLower}(id: int, item: ${resource}Create):
    """Update ${resource}"""
    updated = await ${resource}Service.update(id, item.dict())
    if not updated:
        raise HTTPException(status_code=404, detail="${resource} not found")
    return updated

@router.delete("/${resourceLower}s/{id}", status_code=204)
async def delete_${resourceLower}(id: int):
    """Delete ${resource}"""
    success = await ${resource}Service.delete(id)
    if not success:
        raise HTTPException(status_code=404, detail="${resource} not found")`;
    }

    private pythonType(tsType: string): string {
        const typeMap: Record<string, string> = {
            'string': 'str',
            'number': 'int',
            'boolean': 'bool'
        };
        return typeMap[tsType] || 'str';
    }
}
