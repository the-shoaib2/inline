
import { ContextAnalysisStrategy, ExtractedImport, ClassDetails, FunctionDetails, InterfaceDetails, PatternMatch } from './context-analysis-strategy.interface';
import { CodeType } from '../analysis/file-type-detector';

export class PythonAnalysisStrategy implements ContextAnalysisStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    getSupportedExtensions(): string[] {
        return ['.py'];
    }

    extractImports(text: string): ExtractedImport[] {
        const imports: ExtractedImport[] = [];
        // from module import foo, bar
        const fromImportRegex = /from\s+([\w.]+)\s+import\s+([^#\n]+)/g;
        let match;

        while ((match = fromImportRegex.exec(text)) !== null) {
            const importPath = match[1];
            const symbols = match[2].split(',').map(s => s.trim());

            imports.push({
                path: importPath,
                symbols,
                isRelative: importPath.startsWith('.'),
                offset: match.index
            });
        }
        
        // import module
        const importRegex = /^\s*import\s+([\w.]+)(?:\s+as\s+\w+)?/gm;
        while ((match = importRegex.exec(text)) !== null) {
            imports.push({
                path: match[1],
                symbols: [],
                isRelative: false,
                offset: match.index
            });
        }

        return imports;
    }

    extractClasses(text: string): ClassDetails[] {
        const classes: ClassDetails[] = [];
        const classRegex = /class\s+(\w+)(?:\(([^)]+)\))?:/g;
        let match;

        while ((match = classRegex.exec(text)) !== null) {
            const name = match[1];
            const extendsClass = match[2];
            const startLine = text.substring(0, match.index).split('\n').length - 1;

            classes.push({
                name,
                extends: extendsClass,
                startLine
            });
        }
        return classes;
    }

    extractFunctions(text: string): FunctionDetails[] {
        const functions: FunctionDetails[] = [];
        const funcRegex = /def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:/g;
        let match;

        while ((match = funcRegex.exec(text)) !== null) {
            const name = match[1];
            const params = match[2].split(',').map(p => p.trim()).filter(p => p);
            const returnType = match[3]?.trim();
            const startLine = text.substring(0, match.index).split('\n').length - 1;

            functions.push({
                name,
                parameters: params,
                returnType,
                startLine
            });
        }
        return functions;
    }

    extractInterfaces(text: string): InterfaceDetails[] {
        return [];
    }

    detectCodeTypes(text: string): CodeType[] {
        const codeTypes: Set<CodeType> = new Set();
        
        if (/\bclass\s+\w+/.test(text)) codeTypes.add(CodeType.CLASS);
        if (/\bdef\s+\w+/.test(text)) codeTypes.add(CodeType.FUNCTION);
        if (/^[A-Z_]+\s*=/.test(text)) codeTypes.add(CodeType.CONSTANT);
        
        return Array.from(codeTypes);
    }

    extractCodeBlocks(text: string): string[] {
        const blocks: string[] = [];
        // Pattern: def or class, capture until next def/class at same indentation (start of line)
        // Heuristic: top level def/class starts at ^
        
        const regex = /^(?:def|class)\s+\w+[\s\S]*?(?=\n(?:def|class)\s+|\n*$)/gm;
        const matches = text.match(regex);
        if (matches) {
            blocks.push(...matches);
        }
        return blocks;
    }

    detectPatterns(text: string): PatternMatch[] {
        const patterns: PatternMatch[] = [];
        
        const checks = [
            { regex: /async\s+def/g, name: 'async-functions' },
            { regex: /\[.*for.*in.*\]/g, name: 'list-comprehension' },
            { regex: /with\s+.*:/g, name: 'context-manager' },
            { regex: /@\w+/g, name: 'decorators' },
            { regex: /try:[\s\S]*?except:/g, name: 'try-except' }
        ];

        for (const check of checks) {
            const matches = text.match(check.regex);
            if (matches) {
                patterns.push({
                    patternName: check.name,
                    matches: matches
                });
            }
        }
        
        return patterns;
    }
}
