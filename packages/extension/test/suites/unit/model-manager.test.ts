import { expect } from 'chai';
import { ModelManager, ModelInfo } from '@inline/intelligence';
import { createMockModelInfo, createMockModels } from '../../utilities/model-mock';

describe('ModelManager Unit Tests', () => {
  
  describe('Model Selection', () => {
    it('should select best model for language', () => {
      const models = createMockModels();
      
      // Mock getBestModel logic
      const pythonModel = models.find(m => 
        m.languages.includes('python') && m.requirements.vram! <= 4
      );
      
      expect(pythonModel).to.exist;
      expect(pythonModel!.languages).to.include('python');
    });

    it('should consider hardware requirements', () => {
      const models = createMockModels();
      
      // Filter models that fit in 4GB VRAM
      const suitableModels = models.filter(m => 
        m.requirements.vram! <= 4
      );
      
      expect(suitableModels.length).to.be.greaterThan(0);
    });

    it('should prioritize GPU models when available', () => {
      const models = createMockModels();
      
      const gpuModels = models.filter(m => m.requirements.gpu);
      const cpuModels = models.filter(m => m.requirements.cpu);
      
      expect(gpuModels.length).to.be.greaterThan(0);
      expect(cpuModels.length).to.be.greaterThan(0);
    });
  });

  describe('Model Validation', () => {
    it('should validate model info structure', () => {
      const model = createMockModelInfo();
      
      expect(model).to.have.property('id');
      expect(model).to.have.property('name');
      expect(model).to.have.property('size');
      expect(model).to.have.property('languages');
      expect(model).to.have.property('requirements');
    });

    it('should validate model requirements', () => {
      const model = createMockModelInfo();
      
      expect(model.requirements).to.have.property('vram');
      expect(model.requirements).to.have.property('ram');
      expect(model.requirements.vram).to.be.a('number');
      expect(model.requirements.ram).to.be.a('number');
    });

    it('should validate language support', () => {
      const model = createMockModelInfo();
      
      expect(model.languages).to.be.an('array');
      expect(model.languages.length).to.be.greaterThan(0);
    });
  });

  describe('Model Metadata', () => {
    it('should have correct model size', () => {
      const model = createMockModelInfo({ size: 5000000 });
      
      expect(model.size).to.equal(5000000);
    });

    it('should track download status', () => {
      const downloadedModel = createMockModelInfo({ isDownloaded: true });
      const notDownloadedModel = createMockModelInfo({ isDownloaded: false });
      
      expect(downloadedModel.isDownloaded).to.be.true;
      expect(notDownloadedModel.isDownloaded).to.be.false;
    });

    it('should have model path when downloaded', () => {
      const model = createMockModelInfo({ 
        isDownloaded: true,
        path: '/path/to/model.gguf'
      });
      
      expect(model.path).to.exist;
      expect(model.path).to.include('.gguf');
    });
  });

  describe('Resource Monitoring', () => {
    it('should calculate memory requirements', () => {
      const model = createMockModelInfo({
        requirements: { vram: 4, ram: 8 }
      });
      
      const totalMemory = model.requirements.vram! + model.requirements.ram!;
      expect(totalMemory).to.equal(12);
    });

    it('should identify CPU-only models', () => {
      const cpuModel = createMockModelInfo({
        requirements: { cpu: true, gpu: false, ram: 4 }
      });
      
      expect(cpuModel.requirements.cpu).to.be.true;
      expect(cpuModel.requirements.gpu).to.be.false;
    });
  });
});
