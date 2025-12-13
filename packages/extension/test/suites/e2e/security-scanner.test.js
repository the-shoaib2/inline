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
const vscode = __importStar(require("vscode"));
const intelligence_1 = require("@inline/intelligence");
suite('Security Scanner E2E Tests', () => {
    let scanner;
    let inference;
    suiteSetup(async function () {
        this.timeout(30000);
        inference = new intelligence_1.LlamaInference();
        scanner = new intelligence_1.SecurityScanner(inference);
    });
    test('Should detect SQL injection vulnerability', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'javascript',
            content: `
const query = "SELECT * FROM users WHERE id = " + userId;
db.execute(query);
            `.trim()
        });
        const result = await scanner.scanDocument(document);
        // Should detect SQL injection
        const sqlInjection = result.vulnerabilities.find(v => v.type === 'SQL Injection');
        assert.ok(sqlInjection, 'Should detect SQL injection');
        assert.strictEqual(sqlInjection?.severity, 'critical');
    });
    test('Should detect XSS vulnerability', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'javascript',
            content: `
const html = "<script>alert('XSS')</script>";
element.innerHTML = html;
            `.trim()
        });
        const result = await scanner.scanDocument(document);
        const xss = result.vulnerabilities.find(v => v.type.includes('XSS'));
        assert.ok(xss, 'Should detect XSS vulnerability');
    });
    test('Should detect hardcoded secrets', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'javascript',
            content: `
const API_KEY = "sk-1234567890abcdef";
const password = "mySecretPassword123";
            `.trim()
        });
        const result = await scanner.scanDocument(document);
        const secrets = result.vulnerabilities.filter(v => v.type === 'Hardcoded Secret');
        assert.ok(secrets.length > 0, 'Should detect hardcoded secrets');
    });
    test('Should detect path traversal', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'javascript',
            content: `
const filePath = userInput + "../../etc/passwd";
fs.readFile(filePath);
            `.trim()
        });
        const result = await scanner.scanDocument(document);
        const pathTraversal = result.vulnerabilities.find(v => v.type === 'Path Traversal');
        assert.ok(pathTraversal, 'Should detect path traversal');
    });
    test('Should generate security report', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'javascript',
            content: `
const query = "SELECT * FROM users WHERE id = " + userId;
const password = "hardcoded123";
            `.trim()
        });
        const result = await scanner.scanDocument(document);
        const report = scanner.generateReport(result);
        assert.ok(report.includes('Security Scan Report'));
        assert.ok(report.includes('Summary'));
        assert.ok(result.vulnerabilities.length > 0);
    });
    test('Should provide CWE IDs for vulnerabilities', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'javascript',
            content: `
db.execute("SELECT * FROM users WHERE id = " + userId);
            `.trim()
        });
        const result = await scanner.scanDocument(document);
        const vuln = result.vulnerabilities[0];
        assert.ok(vuln.cweId, 'Should have CWE ID');
        assert.ok(vuln.cweId?.startsWith('CWE-'));
    });
    suiteTeardown(async () => {
        if (inference) {
            await inference.unloadModel();
        }
    });
});
//# sourceMappingURL=security-scanner.test.js.map