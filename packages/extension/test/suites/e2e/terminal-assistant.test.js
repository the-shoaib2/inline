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
const ui_1 = require("@inline/ui");
const intelligence_1 = require("@inline/intelligence");
suite('Terminal Assistant E2E Tests', () => {
    let assistant;
    let inference;
    suiteSetup(async function () {
        this.timeout(30000);
        inference = new intelligence_1.LlamaInference();
        assistant = new ui_1.TerminalAssistant(inference);
    });
    test('Should provide git command suggestions', () => {
        const gitCommands = assistant.getGitCommands();
        assert.ok(gitCommands.length > 0);
        assert.ok(gitCommands.some((cmd) => cmd.command.includes('git status')));
        assert.ok(gitCommands.some((cmd) => cmd.command.includes('git commit')));
    });
    test('Should provide npm command suggestions', () => {
        const npmCommands = assistant.getPackageManagerCommands('npm');
        assert.ok(npmCommands.length > 0);
        assert.ok(npmCommands.some((cmd) => cmd.command.includes('npm install')));
        assert.ok(npmCommands.some((cmd) => cmd.command.includes('npm test')));
    });
    test('Should convert npm to pnpm commands', () => {
        const pnpmCommands = assistant.getPackageManagerCommands('pnpm');
        assert.ok(pnpmCommands.every((cmd) => cmd.command.includes('pnpm')));
        assert.ok(!pnpmCommands.some((cmd) => /\bnpm\b/.test(cmd.command)));
    });
    test('Should provide Docker commands', () => {
        const dockerCommands = assistant.getDockerCommands();
        assert.ok(dockerCommands.length > 0);
        assert.ok(dockerCommands.some((cmd) => cmd.command.includes('docker ps')));
    });
    test('Should detect dangerous commands', () => {
        assert.strictEqual(assistant.isDangerous('rm -rf /'), true);
        assert.strictEqual(assistant.isDangerous('sudo rm -rf'), true);
        assert.strictEqual(assistant.isDangerous('git status'), false);
        assert.strictEqual(assistant.isDangerous('npm install'), false);
    });
    test('Should detect fork bomb', () => {
        const forkBomb = ':(){ :|: & };:';
        assert.strictEqual(assistant.isDangerous(forkBomb), true);
    });
    test('Should manage command history', () => {
        assistant.addToHistory('git status');
        assistant.addToHistory('npm install');
        assistant.addToHistory('docker ps');
        const history = assistant.getHistory();
        assert.ok(history.length >= 3);
        assert.strictEqual(history[0], 'docker ps'); // Most recent first
    });
    test('Should search command history', () => {
        assistant.addToHistory('git commit -m "test"');
        assistant.addToHistory('git push origin main');
        const gitCommands = assistant.searchHistory('git');
        assert.ok(gitCommands.length >= 2);
    });
    test('Should categorize commands correctly', () => {
        const gitCommands = assistant.getGitCommands();
        assert.ok(gitCommands.every((cmd) => cmd.category === 'git'));
        const npmCommands = assistant.getPackageManagerCommands();
        assert.ok(npmCommands.every((cmd) => cmd.category === 'npm'));
    });
    suiteTeardown(async () => {
        if (inference) {
            await inference.unloadModel();
        }
    });
});
//# sourceMappingURL=terminal-assistant.test.js.map