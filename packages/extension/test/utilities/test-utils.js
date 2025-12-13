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
exports.waitFor = waitFor;
exports.sleep = sleep;
exports.createTestDocument = createTestDocument;
exports.openTestFile = openTestFile;
exports.measureTime = measureTime;
exports.closeAllEditors = closeAllEditors;
exports.getExtension = getExtension;
exports.activateExtension = activateExtension;
exports.enableRealModel = enableRealModel;
exports.setupMockInference = setupMockInference;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/**
 * Wait for a condition to be true
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await sleep(interval);
    }
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Create a test document
 */
async function createTestDocument(content, language = 'typescript') {
    const document = await vscode.workspace.openTextDocument({
        content,
        language
    });
    await vscode.window.showTextDocument(document);
    await vscode.workspace.getConfiguration('editor').update('inlineSuggest.enabled', true, vscode.ConfigurationTarget.Global);
    return document;
}
/**
 * Open a test file from fixtures
 */
async function openTestFile(relativePath) {
    const fixturesPath = path.resolve(__dirname, '../../fixtures/sample-workspace');
    const filePath = path.join(fixturesPath, relativePath);
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    return document;
}
/**
 * Measure execution time
 */
async function measureTime(fn) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
}
/**
 * Clean up all open editors
 */
async function closeAllEditors() {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
}
/**
 * Get extension by ID
 */
function getExtension() {
    return vscode.extensions.getExtension('inline.inline');
}
/**
 * Activate extension and wait for it to be ready
 */
async function activateExtension() {
    const ext = getExtension();
    if (!ext) {
        throw new Error('Extension not found');
    }
    if (!ext.isActive) {
        await ext.activate();
    }
    // Wait a bit for initialization
    await sleep(500);
}
/**
 * Check if real model should be used in tests
 */
function enableRealModel() {
    return process.env.USE_REAL_MODEL === 'true' &&
        process.env.MODEL_PATH !== undefined;
}
/**
 * Setup mock inference engine for testing
 */
async function setupMockInference(provider) {
    const { MockLlamaEngine } = await Promise.resolve().then(() => __importStar(require('./mock-llama-engine')));
    const mockEngine = new MockLlamaEngine();
    // Load mock model
    await mockEngine.loadModel('mock://test-model', {
        threads: 4,
        gpuLayers: 0,
        contextSize: 4096,
        fimTemplate: 'default'
    });
    // Inject mock engine into provider's model manager
    const modelManager = provider.modelManager;
    if (modelManager) {
        modelManager.inferenceEngine = mockEngine;
        console.log('✓ Mock inference engine injected');
    }
    else {
        throw new Error('Model manager not found on provider');
    }
}
//# sourceMappingURL=test-utils.js.map