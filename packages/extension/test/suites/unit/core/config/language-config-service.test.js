"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const path = __importStar(require("path"));
const language_config_service_1 = require("@inline/language/analysis/language-config-service");
const vscode_mock_1 = require("../../vscode-mock");
describe('LanguageConfigService', () => {
    let service;
    let mockContext;
    before(() => {
        service = language_config_service_1.LanguageConfigService.getInstance();
        // Point extensionPath to packages/extension directory
        // This file: test/suites/unit/core/config/language-config-service.test.ts
        // Target: packages/extension/
        const rootPath = path.resolve(__dirname, '../../../../../packages/extension');
        mockContext = (0, vscode_mock_1.createMockContext)();
        mockContext.extensionPath = rootPath;
        service.initialize(mockContext);
    });
    it('should be a singleton', () => {
        const instance2 = language_config_service_1.LanguageConfigService.getInstance();
        assert.strictEqual(service, instance2);
    });
    it('should load patterns for typescript', () => {
        const patterns = service.getPatterns('typescript');
        assert.ok(patterns, 'Should return patterns for typescript');
        assert.ok(patterns.imports.length > 0, 'Should have import patterns');
        assert.ok(patterns.functions.length > 0, 'Should have function patterns');
    });
    it('should load patterns for python', () => {
        const patterns = service.getPatterns('python');
        assert.ok(patterns, 'Should return patterns for python');
        assert.ok(patterns.imports.length > 0, 'Should have import patterns');
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
//# sourceMappingURL=language-config-service.test.js.map