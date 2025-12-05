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

        const dummyModelPath = path.join(tempDir, 'imported_test-model.gguf'); // Use imported_ prefix
        const magic = Buffer.from('GGUF'); // Magic header
        fs.writeFileSync(dummyModelPath, magic);

        const api = extension.exports;
        const modelManager = api.modelManager;
        // Accessing private property for testing via type casting
        const modelDownloader = (api.webviewProvider as any)['_modelDownloader'];

        assert.ok(modelManager, 'ModelManager should be available');
        assert.ok(modelDownloader, 'ModelDownloader should be available');

        try {
            // 1. Import using the downloader (physically copies file)
            const importedModel = await modelDownloader.importModel(dummyModelPath);
            assert.ok(importedModel, 'Should return imported model info');
            assert.strictEqual(importedModel.id.startsWith('imported_'), true, 'ID should start with imported_');

            // 2. Refresh models (The Fix)
            modelManager.refreshModels();

            // 3. Verify it's in the available models
            const models = modelManager.getAllModels(); // Should include it now
            const found = models.find((m: any) => m.id === importedModel.id);
            assert.ok(found, 'Imported model should be in model list after refresh');
            assert.strictEqual(found.isDownloaded, true, 'Model should be marked as downloaded');

            // 4. Try to "download" (activate) it
            await modelManager.downloadModel(importedModel.id);
            const downloadedModels = modelManager.getDownloadedModels();
            const foundDownloaded = downloadedModels.find((m: any) => m.id === importedModel.id);
            assert.ok(foundDownloaded, 'Model should be in downloaded list');

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
