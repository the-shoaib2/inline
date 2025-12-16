
import { ClassScaffoldingStrategy, ClassTemplate } from './class-scaffolding-strategy.interface';

export class JavaClassScaffoldingStrategy implements ClassScaffoldingStrategy {
    supports(languageId: string): boolean {
        return languageId === 'java';
    }

    getTemplates(): ClassTemplate[] {
        return [
             {
                name: 'class',
                description: 'Java class',
                template: `public class {ClassName} {
    public {ClassName}() {
        // Constructor
    }
}`
            },
            {
                name: 'interface',
                description: 'Java interface',
                template: `public interface {InterfaceName} {
    // Method signatures
}`
            }
        ];
    }

    generateClassFromProperties(className: string, properties: Array<{ name: string; type?: string }>): string {
        // Use default basic template if no specific logic needed or implement fully if required
        // Originally logic was "Fallback to basic template"
        return `public class ${className} {
    public ${className}() {
        // Constructor
    }
}`;
    }

    generateInterface(interfaceName: string, properties: Array<{ name: string; type: string }>): string {
         const methods = properties.map(p =>
            `    ${p.type} get${p.name.charAt(0).toUpperCase() + p.name.slice(1)}();`
        ).join('\n');

        return `public interface ${interfaceName} {
${methods}
}`;
    }
}
