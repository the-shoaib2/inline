
import { describe, it, expect, beforeEach } from 'vitest';
import { FunctionCompleter } from '../../src/generation/function-completer';

describe('Function Completer E2E - Strategy Pattern', () => {
    let completer: FunctionCompleter;

    beforeEach(() => {
        completer = new FunctionCompleter();
    });

    it('should detect TypeScript function start', () => {
        const prefix = 'function myFunc(';
        const boundary = completer.detectFunctionBoundary(prefix, 'typescript');
        
        expect(boundary.isFunctionStart).toBe(true);
        expect(boundary.functionName).toBe('myFunc');
        expect(boundary.expectedEndPattern).toBe('}');
    });

    it('should complete TypeScript function', () => {
        const prefix = 'function myFunc() {\n';
        const completion = '    return true;';
        const boundary = { 
            isFunctionStart: true, 
            functionType: 'function', 
            indentLevel: 0, 
            needsClosing: true 
        } as any;
        
        // Assuming detect logic sets boundary correctly, we test ensureComplete
        const result = completer.ensureComplete(completion, boundary, 'typescript');
        
        expect(result).toContain('return true;');
        expect(result).toContain('}');
    });

    it('should detect Python function start', () => {
        const prefix = 'def my_func(';
        const boundary = completer.detectFunctionBoundary(prefix, 'python');
        
        expect(boundary.isFunctionStart).toBe(true);
        expect(boundary.functionName).toBe('my_func');
        expect(boundary.expectedEndPattern).toBe('dedent');
    });

    it('should complete Python function', () => {
        const completion = '    print("hello")';
        const boundary = { 
            isFunctionStart: true, 
            functionType: 'function', 
            indentLevel: 0, 
            needsClosing: true 
        } as any;
        
        // This test assumes Python strategy might add pass if empty or handle trailing lines. 
        // With current impl, if 'isComplete' returns true (dedented), it returns as is.
        // '    print("hello")' is indented relative to base 0? Yes.
        // But logic says: check last line indent.
        
        // Let's try an actually INCOMPLETE python code
        // Indent level 4 (for body).
        
        const result = completer.ensureComplete(completion, boundary, 'python');
        // '    print("hello")' : last line indent 4. Boundary indent 0.
        // 4 > 0. So it considers it inside.
        // But what does 'completeFunction' do?
        // It sees lastIndent > boundaryIndent.
        // Checks if lastLine is empty. It is not.
        // So it basically returns it as is, assuming user isn't done?
        // The strategies logic was: if last line is not dedented, we might need to close it?
        // Python doesn't have "closing" char. It ends when dedent.
        // So ensureComplete for Python usually means "do we need to append a line?"
        // Current impl of python-function-strategy:
        // if (lastIndent > boundary.indentLevel && lastLine empty) -> adds pass.
        
        expect(result).toBe(completion);
        
        // Test empty body
        const emptyCompletion = "";
        const resultEmpty = completer.ensureComplete(emptyCompletion, boundary, 'python');
        expect(resultEmpty).toContain('pass');
    });
});
