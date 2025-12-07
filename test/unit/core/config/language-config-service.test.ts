import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageConfigService } from '../../../../src/core/config/language-config-service';
import { createMockContext } from '../../vscode-mock';

describe('LanguageConfigService', () => {
    let service: LanguageConfigService;
    let mockContext: vscode.ExtensionContext;

    before(() => {
        service = LanguageConfigService.getInstance();
        // Point extensionPath to the project root relative to this test file
        // This file: test/unit/core/config/language-config-service.test.ts
        // Root: ../../../../
        const rootPath = path.resolve(__dirname, '../../../../');
        mockContext = createMockContext();
        (mockContext as any).extensionPath = rootPath;
        
        service.initialize(mockContext);
    });

    it('should be a singleton', () => {
        const instance2 = LanguageConfigService.getInstance();
        assert.strictEqual(service, instance2);
    });

    it('should load patterns for typescript', () => {
        const patterns = service.getPatterns('typescript');
        assert.ok(patterns, 'Should return patterns for typescript');
        assert.ok(patterns!.imports.length > 0, 'Should have import patterns');
        assert.ok(patterns!.functions.length > 0, 'Should have function patterns');
    });

    it('should load patterns for python', () => {
        const patterns = service.getPatterns('python');
        assert.ok(patterns, 'Should return patterns for python');
        assert.ok(patterns!.imports.length > 0, 'Should have import patterns');
    });

    it('should return undefined for unknown language', () => {
        const patterns = service.getPatterns('unknown-lang');
        assert.strictEqual(patterns, undefined);
    });

    it('should have regex strings that act as valid RegExps', () => {
        const patterns = service.getPatterns('typescript');
        if (patterns && patterns.imports) {
            for (const pattern of patterns.imports) {
                assert.doesNotThrow(() => new RegExp(pattern, 'gm'));
            }
        }
    });
});
