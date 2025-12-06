
import * as assert from 'assert';
import * as vscode from 'vscode';
import { SmartFilter } from '../../src/core/smart-filter';

describe('SmartFilter Unit Tests', () => {
    let filter: SmartFilter;
    let mockDocument: any;
    let mockPosition: any;

    beforeEach(() => {
        filter = new SmartFilter();
        mockDocument = {
            lineAt: (line: number) => ({
                text: 'const x = "hello";'
            }),
            languageId: 'typescript'
        };
        mockPosition = new vscode.Position(0, 10); // inside string
    });

    it('Should block suggestions inside strings', () => {
        // "const x = " | cursor | "hello";
        // textBefore = 'const x = "' -> one quote -> inside string
        // position 11 would be after the quote? 
        // Let's refine mock for specific test cases
        
        mockDocument.lineAt = () => ({ text: 'const x = "hello";' });
        const posInside = new vscode.Position(0, 12); // 'const x = "h' -> 1 quote
        
        // We need to mock the document properly for the filter to read textBefore
        const result = filter.shouldRespond(
            mockDocument, 
            posInside, 
            vscode.InlineCompletionTriggerKind.Automatic
        );
        
        // Based on logic: 1 quote before -> inside string -> should return false
        assert.strictEqual(result, false, 'Should block inside string');
    });

    it('Should allow suggestions in code', () => {
        mockDocument.lineAt = () => ({ text: 'const x = ' });
        const posCode = new vscode.Position(0, 10); 
        
        const result = filter.shouldRespond(
            mockDocument, 
            posCode, 
            vscode.InlineCompletionTriggerKind.Automatic
        );
        assert.strictEqual(result, true, 'Should allow in normal code');
    });

    it('Should block rapid typing', async () => {
        // Simulate rapid typing
        // We need to inject time, but the class uses Date.now().
        // For unit test we can just call it rapidly in a loop or spy if we could.
        // Since we can't easily mock Date.now() without a library, we'll try to trigger the threshold.
        // Threshold is 8 chars/sec.
        
        // Push 10 events instantly
        for (let i = 0; i < 10; i++) {
            filter.shouldRespond(mockDocument, mockPosition, vscode.InlineCompletionTriggerKind.Automatic);
        }
        
        const result = filter.shouldRespond(
            mockDocument, 
            mockPosition, 
            vscode.InlineCompletionTriggerKind.Automatic
        );
        
        assert.strictEqual(result, false, 'Should block rapid typing');
    });
    
    it('Should always allow Invoke trigger', () => {
        const result = filter.shouldRespond(
            mockDocument, 
            mockPosition, 
            vscode.InlineCompletionTriggerKind.Invoke
        );
        assert.strictEqual(result, true, 'Should always allow explicit invoke');
    });
});
