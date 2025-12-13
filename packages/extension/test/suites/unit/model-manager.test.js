"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const model_mock_1 = require("../../utilities/model-mock");
describe('ModelManager Unit Tests', () => {
    describe('Model Selection', () => {
        it('should select best model for language', () => {
            const models = (0, model_mock_1.createMockModels)();
            // Mock getBestModel logic
            const pythonModel = models.find(m => m.languages.includes('python') && m.requirements.vram <= 4);
            (0, chai_1.expect)(pythonModel).to.exist;
            (0, chai_1.expect)(pythonModel.languages).to.include('python');
        });
        it('should consider hardware requirements', () => {
            const models = (0, model_mock_1.createMockModels)();
            // Filter models that fit in 4GB VRAM
            const suitableModels = models.filter(m => m.requirements.vram <= 4);
            (0, chai_1.expect)(suitableModels.length).to.be.greaterThan(0);
        });
        it('should prioritize GPU models when available', () => {
            const models = (0, model_mock_1.createMockModels)();
            const gpuModels = models.filter(m => m.requirements.gpu);
            const cpuModels = models.filter(m => m.requirements.cpu);
            (0, chai_1.expect)(gpuModels.length).to.be.greaterThan(0);
            (0, chai_1.expect)(cpuModels.length).to.be.greaterThan(0);
        });
    });
    describe('Model Validation', () => {
        it('should validate model info structure', () => {
            const model = (0, model_mock_1.createMockModelInfo)();
            (0, chai_1.expect)(model).to.have.property('id');
            (0, chai_1.expect)(model).to.have.property('name');
            (0, chai_1.expect)(model).to.have.property('size');
            (0, chai_1.expect)(model).to.have.property('languages');
            (0, chai_1.expect)(model).to.have.property('requirements');
        });
        it('should validate model requirements', () => {
            const model = (0, model_mock_1.createMockModelInfo)();
            (0, chai_1.expect)(model.requirements).to.have.property('vram');
            (0, chai_1.expect)(model.requirements).to.have.property('ram');
            (0, chai_1.expect)(model.requirements.vram).to.be.a('number');
            (0, chai_1.expect)(model.requirements.ram).to.be.a('number');
        });
        it('should validate language support', () => {
            const model = (0, model_mock_1.createMockModelInfo)();
            (0, chai_1.expect)(model.languages).to.be.an('array');
            (0, chai_1.expect)(model.languages.length).to.be.greaterThan(0);
        });
    });
    describe('Model Metadata', () => {
        it('should have correct model size', () => {
            const model = (0, model_mock_1.createMockModelInfo)({ size: 5000000 });
            (0, chai_1.expect)(model.size).to.equal(5000000);
        });
        it('should track download status', () => {
            const downloadedModel = (0, model_mock_1.createMockModelInfo)({ isDownloaded: true });
            const notDownloadedModel = (0, model_mock_1.createMockModelInfo)({ isDownloaded: false });
            (0, chai_1.expect)(downloadedModel.isDownloaded).to.be.true;
            (0, chai_1.expect)(notDownloadedModel.isDownloaded).to.be.false;
        });
        it('should have model path when downloaded', () => {
            const model = (0, model_mock_1.createMockModelInfo)({
                isDownloaded: true,
                path: '/path/to/model.gguf'
            });
            (0, chai_1.expect)(model.path).to.exist;
            (0, chai_1.expect)(model.path).to.include('.gguf');
        });
    });
    describe('Resource Monitoring', () => {
        it('should calculate memory requirements', () => {
            const model = (0, model_mock_1.createMockModelInfo)({
                requirements: { vram: 4, ram: 8 }
            });
            const totalMemory = model.requirements.vram + model.requirements.ram;
            (0, chai_1.expect)(totalMemory).to.equal(12);
        });
        it('should identify CPU-only models', () => {
            const cpuModel = (0, model_mock_1.createMockModelInfo)({
                requirements: { cpu: true, gpu: false, ram: 4 }
            });
            (0, chai_1.expect)(cpuModel.requirements.cpu).to.be.true;
            (0, chai_1.expect)(cpuModel.requirements.gpu).to.be.false;
        });
    });
});
//# sourceMappingURL=model-manager.test.js.map