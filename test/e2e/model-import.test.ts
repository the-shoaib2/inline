import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Model Import E2E Test', () => {
    const extensionId = 'inline.inline';
    let extension: vscode.Extension<any>;

    suiteSetup(async () => {
        extension = vscode.extensions.getExtension(extensionId)!;
        await extension.activate();
    });

    test('Should validate and import GGUF model', async () => {
        // Create a dummy GGUF file
        const tempDir = path.join(os.tmpdir(), 'inline-test-models');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const dummyModelPath = path.join(tempDir, 'test-model.gguf');
        const magic = Buffer.from('GGUF');
        fs.writeFileSync(dummyModelPath, magic);

        // Execute import command (mocking the file picker if possible, or calling the internal method via API)
        // Since we can't easily mock the native file picker in E2E, we'll use the exposed API if available
        // or simulate the command with arguments if the extension supports it.

        // For this test, we'll access the model manager directly through the extension exports
        const api = extension.exports;
        const modelManager = api.modelManager;
        const modelDownloader = api.webviewProvider['_modelDownloader']; // Accessing private property for testing

        assert.ok(modelManager, 'ModelManager should be available');
        assert.ok(modelDownloader, 'ModelDownloader should be available');

        try {
            const importedModel = await modelDownloader.importModel(dummyModelPath);
            assert.ok(importedModel, 'Should return imported model info');
            assert.strictEqual(importedModel.id.startsWith('imported_'), true, 'ID should start with imported_');

            // Verify it's in the model manager
            await modelManager.downloadModel(importedModel.id);
            const models = modelManager.getDownloadedModels();
            const found = models.find((m: any) => m.id === importedModel.id);
            assert.ok(found, 'Imported model should be in downloaded models list');

            // Cleanup
            await modelManager.removeModel(importedModel.id);
        } finally {
            if (fs.existsSync(dummyModelPath)) {
                fs.unlinkSync(dummyModelPath);
            }
            if (fs.existsSync(tempDir)) {
                fs.rmdirSync(tempDir);
            }
        }
    });

    test('Should reject invalid files', async () => {
        const tempDir = path.join(os.tmpdir(), 'inline-test-models');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const invalidPath = path.join(tempDir, 'invalid.txt');
        fs.writeFileSync(invalidPath, 'Not a GGUF file');

        const api = extension.exports;
        const modelDownloader = api.webviewProvider['_modelDownloader'];

        try {
            await modelDownloader.importModel(invalidPath);
            assert.fail('Should have thrown an error');
        } catch (error: any) {
            assert.ok(error.message.includes('Unsupported file format'), 'Should throw unsupported format error');
        } finally {
            if (fs.existsSync(invalidPath)) {
                fs.unlinkSync(invalidPath);
            }
            if (fs.existsSync(tempDir)) {
                fs.rmdirSync(tempDir);
            }
        }
    });
});
