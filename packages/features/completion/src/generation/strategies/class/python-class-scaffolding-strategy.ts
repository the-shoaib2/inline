
import { ClassScaffoldingStrategy, ClassTemplate } from './class-scaffolding-strategy.interface';

export class PythonClassScaffoldingStrategy implements ClassScaffoldingStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    getTemplates(): ClassTemplate[] {
        return [
            {
                name: 'class',
                description: 'Python class',
                template: `class {ClassName}:
    def __init__(self):
        pass`
            },
            {
                name: 'dataclass',
                description: 'Python dataclass',
                template: `from dataclasses import dataclass

@dataclass
class {ClassName}:
    # Add fields here
    pass`
            }
        ];
    }

    generateClassFromProperties(className: string, properties: Array<{ name: string; type?: string }>): string {
        const params = properties.map(p => p.name).join(', ');
        const assignments = properties.map(p =>
            `        self.${p.name} = ${p.name}`
        ).join('\n');

        return `class ${className}:
    def __init__(self, ${params}):
${assignments}`;
    }

    generateInterface(interfaceName: string, properties: Array<{ name: string; type: string }>): string {
        // Python doesn't strict interfaces like TS, using Abstract Base Class or Protocol is common, 
        // but for now returning empty as originally implemented or simple pass
        return ''; 
    }
}
