
import { ContextAnalysisStrategy, ExtractedImport, ClassDetails, FunctionDetails, InterfaceDetails, PatternMatch } from './context-analysis-strategy.interface';
import { CodeType } from '../analysis/file-type-detector';

export class TypeScriptAnalysisStrategy implements ContextAnalysisStrategy {
    supports(languageId: string): boolean {
        return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(languageId);
    }
    
    getSupportedExtensions(): string[] {
        return ['.ts', '.tsx', '.js', '.jsx'];
    }

    extractImports(text: string): ExtractedImport[] {
        const imports: ExtractedImport[] = [];
        // import { foo, bar } from './module'
        const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(text)) !== null) {
            const symbols = match[1] 
                ? match[1].split(',').map(s => s.trim())
                : [match[2]];
            const importPath = match[3];

            imports.push({
                path: importPath,
                symbols,
                isRelative: importPath.startsWith('.'),
                offset: match.index
            });
        }
        
        return imports;
    }

    extractClasses(text: string): ClassDetails[] {
        const classes: ClassDetails[] = [];
        const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{/g;
        let match;

        while ((match = classRegex.exec(text)) !== null) {
            const name = match[1];
            const extendsClass = match[2];
            const implementsInterfaces = match[3]?.split(',').map(i => i.trim());
            const startLine = text.substring(0, match.index).split('\n').length - 1;

            classes.push({
                name,
                extends: extendsClass,
                implements: implementsInterfaces,
                startLine
            });
        }
        return classes;
    }

    extractFunctions(text: string): FunctionDetails[] {
        const functions: FunctionDetails[] = [];
        // Function declarations
        const funcRegex = /function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\w+))?/g;
        let match;

        while ((match = funcRegex.exec(text)) !== null) {
            const name = match[1];
            const params = match[2].split(',').map(p => p.trim()).filter(p => p);
            const returnType = match[3];
            const startLine = text.substring(0, match.index).split('\n').length - 1;

            functions.push({
                name,
                parameters: params,
                returnType,
                startLine
            });
        }
        
        // Arrow functions/const assignments
        const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*(?::\s*(\w+))?\s*=>/g;
        while ((match = arrowRegex.exec(text)) !== null) {
             const name = match[1];
             const params = match[2].split(',').map(p => p.trim()).filter(p => p);
             const returnType = match[3];
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
        const interfaces: InterfaceDetails[] = [];
        const interfaceRegex = /interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*{/g;
        let match;

        while ((match = interfaceRegex.exec(text)) !== null) {
            const name = match[1];
            const extendsInterfaces = match[2]?.split(',').map(i => i.trim());
            const startLine = text.substring(0, match.index).split('\n').length - 1;

            interfaces.push({
                name,
                extends: extendsInterfaces,
                startLine
            });
        }
        return interfaces;
    }

    detectCodeTypes(text: string): CodeType[] {
        const codeTypes: Set<CodeType> = new Set();
        
        if (/\bclass\s+\w+/.test(text)) codeTypes.add(CodeType.CLASS);
        if (/\bfunction\s+\w+/.test(text) || /const\s+\w+\s*=\s*\([^)]*\)\s*=>/.test(text)) {
            codeTypes.add(CodeType.FUNCTION);
        }
        if (/\binterface\s+\w+/.test(text)) codeTypes.add(CodeType.INTERFACE);
        if (/\btype\s+\w+\s*=/.test(text)) codeTypes.add(CodeType.TYPE);
        if (/\benum\s+\w+/.test(text)) codeTypes.add(CodeType.ENUM);
        if (/\bconst\s+[A-Z_]+\s*=/.test(text)) codeTypes.add(CodeType.CONSTANT);
        
        if (/React\.FC|FunctionComponent|React\.Component/.test(text) || 
            /export\s+(default\s+)?function\s+[A-Z]\w*/.test(text)) {
            codeTypes.add(CodeType.COMPONENT);
        }
        if (/\buse[A-Z]\w*/.test(text)) codeTypes.add(CodeType.HOOK);

        return Array.from(codeTypes);
    }

    extractCodeBlocks(text: string): string[] {
        const blocks: string[] = [];
        // Heuristic split by top-level declarations
        const regex = /(?:export\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type)\s+\w+[\s\S]*?(?=\n(?:export\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type)\s+|\n*$)/g;
        const matches = text.match(regex);
        if (matches) {
            blocks.push(...matches);
        }
        return blocks;
    }

    detectPatterns(text: string): PatternMatch[] {
        const patterns: PatternMatch[] = [];
        
        const checks = [
            { regex: /async\s+function/g, name: 'async-functions' },
            { regex: /\.map\(/g, name: 'array-map' },
            { regex: /\.filter\(/g, name: 'array-filter' },
            { regex: /\.reduce\(/g, name: 'array-reduce' },
            { regex: /try\s*{[\s\S]*?}\s*catch/g, name: 'try-catch' },
            { regex: /Promise\.all/g, name: 'promise-all' },
            { regex: /await\s+/g, name: 'await-usage' },
            { regex: /export\s+(?:default\s+)?(?:class|function|const)/g, name: 'exports' }
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
