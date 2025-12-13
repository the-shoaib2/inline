import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageConfigService } from '@inline/language/analysis/language-config-service';
import { createMockContext } from '../../vscode-mock';

describe('LanguageConfigService', () => {
    let service: LanguageConfigService;
    let mockContext: vscode.ExtensionContext;

    before(() => {
        service = LanguageConfigService.getInstance();
        // Point extensionPath to packages/extension directory
        // This file: test/suites/unit/core/config/language-config-service.test.ts
        // Target: packages/extension/
        // __dirname is .../dist/test/suites/unit/core/config
        // We want .../packages/extension
        // Up 6 levels: config->core->unit->suites->test->dist->extension
        const rootPath = path.resolve(__dirname, '../../../../../../');
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

    it('should return fallback for unknown language', () => {
        const patterns = service.getPatterns('unknown-lang');
        assert.ok(patterns, 'Should return fallback patterns');
        assert.strictEqual(patterns!.commentPrefix, '//', 'Fallback should have default comment prefix');
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
