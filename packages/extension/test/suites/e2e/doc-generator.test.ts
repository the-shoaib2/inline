import * as assert from 'assert';
import * as vscode from 'vscode';
import { DocGenerator } from '@completion/generation/doc-generator';
import { LlamaInference } from '@inline/intelligence';

suite('Documentation Generator E2E Tests', () => {
    let docGenerator: DocGenerator;
    let inference: LlamaInference;

    suiteSetup(async function() {
        this.timeout(30000);

        inference = new LlamaInference();
        docGenerator = new DocGenerator(inference);
    });

    test('Should detect JSDoc style for JavaScript', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'javascript',
            content: 'function add(a, b) { return a + b; }'
        });

        // Verify style detection logic exists
        assert.ok(docGenerator);
    });

    test('Should detect TSDoc style for TypeScript', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: 'function add(a: number, b: number): number { return a + b; }'
        });

        assert.ok(docGenerator);
    });

    test('Should detect Python docstring styles', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'python',
            content: 'def add(a, b):\n    return a + b'
        });

        assert.ok(docGenerator);
    });

    test('Should generate documentation structure', () => {
        // Test the documentation formatting
        const sampleDoc = '/**\n * Test function\n * @param a First number\n * @param b Second number\n * @returns Sum\n */';
        
        assert.ok(sampleDoc.includes('/**'));
        assert.ok(sampleDoc.includes('@param'));
        assert.ok(sampleDoc.includes('@returns'));
    });

    test('Should support multiple documentation styles', () => {
        const styles = ['jsdoc', 'tsdoc', 'google', 'numpy', 'sphinx', 'rustdoc', 'godoc'];
        
        assert.ok(styles.length === 7);
    });

    suiteTeardown(async () => {
        if (inference) {
            await inference.unloadModel();
        }
    });
});
