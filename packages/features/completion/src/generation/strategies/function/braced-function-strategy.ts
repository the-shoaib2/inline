
import { FunctionStrategy, FunctionPattern, FunctionBoundary } from './function-strategy.interface';

export class BracedFunctionStrategy implements FunctionStrategy {
    supports(languageId: string): boolean {
        return ['typescript', 'javascript', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'php'].includes(languageId);
    }

    getPatterns(): FunctionPattern[] {
        return [
            {
                regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
                type: 'function',
                nameGroup: 1,
                endPattern: '}'
            },
            {
                regex: /^(?:export\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*:\s*\w+\s*{$/,
                type: 'method',
                nameGroup: 1,
                endPattern: '}'
            },
            {
                regex: /^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/,
                type: 'arrow',
                nameGroup: 1,
                endPattern: '}'
            },
            {
                regex: /^(?:export\s+)?class\s+(\w+)/,
                type: 'class',
                nameGroup: 1,
                endPattern: '}'
            }
        ];
    }

    isComplete(completion: string, boundary: FunctionBoundary): boolean {
        const openBraces = (completion.match(/{/g) || []).length;
        const closeBraces = (completion.match(/}/g) || []).length;
        
        let effectiveOpen = openBraces;
        // If we detected a start, we assume it implicitly has an open brace that needs closing
        // UNLESS the regex match didn't include the brace?
        // The patterns in FunctionCompleter included `{` for method but `(` for function.
        // `function foo(` -> usually implies `{` will come or is there.
        // If the text passed todetectFunctionBoundary included the `{`, then yes.
        // But `detectFunctionBoundary` runs on `prefix`.
        // If `prefix` ends with `{`, then yes +1.
        // If `prefix` ends with `)`, we expect `{` then `}`.
        
        // This is getting complicated to guess without prefix content available here.
        // `boundary` doesn't have the prefix content.
        // However, `FunctionCompleter` logic was:
        // "detectFunctionBoundary"
        // "ensureComplete"
        
        // Let's assume `needsClosing` implies we are inside the block or started it.
        if (boundary.needsClosing) {
             effectiveOpen += 1;
        }
        
        return effectiveOpen === closeBraces;
    }

    completeFunction(completion: string, boundary: FunctionBoundary): string {
        const openBraces = (completion.match(/{/g) || []).length;
        const closeBraces = (completion.match(/}/g) || []).length;

        let effectiveOpen = openBraces;
        if (boundary.needsClosing) {
             effectiveOpen += 1;
        }

        if (effectiveOpen > closeBraces) {
            const missing = effectiveOpen - closeBraces;
            const indent = ' '.repeat(boundary.indentLevel);
            
            // Add closing braces with proper indentation
            const closings = Array(missing).fill(indent + '}').join('\n');
            const prefix = completion.length > 0 && !completion.endsWith('\n') ? '\n' : '';
            return completion + prefix + closings;
        }

        return completion;
    }
}
