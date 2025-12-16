
import { FunctionStrategy, FunctionPattern, FunctionBoundary } from './function-strategy.interface';

export class PythonFunctionStrategy implements FunctionStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    getPatterns(): FunctionPattern[] {
        return [
            {
                regex: /^(?:async\s+)?def\s+(\w+)\s*\(/,
                type: 'function',
                nameGroup: 1,
                endPattern: 'dedent'
            },
            {
                regex: /^class\s+(\w+)/,
                type: 'class',
                nameGroup: 1,
                endPattern: 'dedent'
            }
        ];
    }

    isComplete(completion: string, boundary: FunctionBoundary): boolean {
        if (completion.trim().length === 0) return false;
        
        const lines = completion.split('\n');
        const lastLine = lines[lines.length - 1];
        
        // If empty last line, maybe user is typing?
        if (lastLine.trim().length === 0) return true; // Ambiguous

        const lastIndent = lastLine.length - lastLine.trimStart().length;
        return lastIndent <= boundary.indentLevel;
    }

    completeFunction(completion: string, boundary: FunctionBoundary): string {
        // If completely empty, add pass
        if (completion.trim().length === 0) {
             const indent = ' '.repeat(boundary.indentLevel + 4);
             return `${indent}pass`;
        }

        const lines = completion.split('\n');
        const lastLine = lines[lines.length - 1];
        const lastIndent = lastLine.length - lastLine.trimStart().length;

        // If we are still indented, we might need to close/pass? 
        // Python doesn't need explicit closing.
        // But if we ended with an empty line at indent > boundary, we might want to 'pass'?
        
        if (lastIndent > boundary.indentLevel) {
            if (lastLine.trim().length === 0) {
                 const indent = ' '.repeat(boundary.indentLevel + 4);
                 lines[lines.length - 1] = `${indent}pass`;
                 return lines.join('\n');
            }
        }

        return completion;
    }
}
