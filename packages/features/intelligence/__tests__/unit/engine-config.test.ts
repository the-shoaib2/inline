import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigValidator, DEFAULT_ENGINE_CONFIG } from '../../src/engines/core/engine-config';

describe('ConfigValidator', () => {
    describe('validateModelPath', () => {
        it('should accept valid model path', () => {
            expect(() => ConfigValidator.validateModelPath('/path/to/model.gguf')).not.toThrow();
        });

        it('should reject empty string', () => {
            expect(() => ConfigValidator.validateModelPath('')).toThrow('Model path must be a non-empty string');
        });

        it('should reject non-string values', () => {
            expect(() => ConfigValidator.validateModelPath(null as any)).toThrow('Model path must be a non-empty string');
        });
    });

    describe('validateThreads', () => {
        it('should accept positive integers', () => {
            expect(() => ConfigValidator.validateThreads(4)).not.toThrow();
            expect(() => ConfigValidator.validateThreads(8)).not.toThrow();
        });

        it('should accept undefined', () => {
            expect(() => ConfigValidator.validateThreads(undefined)).not.toThrow();
        });

        it('should reject zero', () => {
            expect(() => ConfigValidator.validateThreads(0)).toThrow('Threads must be a positive integer');
        });

        it('should reject negative numbers', () => {
            expect(() => ConfigValidator.validateThreads(-1)).toThrow('Threads must be a positive integer');
        });

        it('should reject non-integers', () => {
            expect(() => ConfigValidator.validateThreads(4.5)).toThrow('Threads must be a positive integer');
        });
    });

    describe('validateGPULayers', () => {
        it('should accept non-negative integers', () => {
            expect(() => ConfigValidator.validateGPULayers(0)).not.toThrow();
            expect(() => ConfigValidator.validateGPULayers(32)).not.toThrow();
        });

        it('should reject negative numbers', () => {
            expect(() => ConfigValidator.validateGPULayers(-1)).toThrow('GPU layers must be a non-negative integer');
        });
    });

    describe('validateContextSize', () => {
        it('should accept valid context sizes', () => {
            expect(() => ConfigValidator.validateContextSize(512)).not.toThrow();
            expect(() => ConfigValidator.validateContextSize(16384)).not.toThrow();
        });

        it('should reject sizes below 512', () => {
            expect(() => ConfigValidator.validateContextSize(256)).toThrow('Context size must be at least 512');
        });
    });

    describe('validateTemperature', () => {
        it('should accept values between 0 and 2', () => {
            expect(() => ConfigValidator.validateTemperature(0)).not.toThrow();
            expect(() => ConfigValidator.validateTemperature(0.7)).not.toThrow();
            expect(() => ConfigValidator.validateTemperature(2)).not.toThrow();
        });

        it('should reject values outside range', () => {
            expect(() => ConfigValidator.validateTemperature(-0.1)).toThrow('Temperature must be between 0 and 2');
            expect(() => ConfigValidator.validateTemperature(2.1)).toThrow('Temperature must be between 0 and 2');
        });
    });

    describe('validateTopP', () => {
        it('should accept values between 0 and 1', () => {
            expect(() => ConfigValidator.validateTopP(0)).not.toThrow();
            expect(() => ConfigValidator.validateTopP(0.95)).not.toThrow();
            expect(() => ConfigValidator.validateTopP(1)).not.toThrow();
        });

        it('should reject values outside range', () => {
            expect(() => ConfigValidator.validateTopP(-0.1)).toThrow('Top-p must be between 0 and 1');
            expect(() => ConfigValidator.validateTopP(1.1)).toThrow('Top-p must be between 0 and 1');
        });
    });

    describe('DEFAULT_ENGINE_CONFIG', () => {
        it('should have expected default values', () => {
            expect(DEFAULT_ENGINE_CONFIG.MAX_TOKENS).toBe(512);
            expect(DEFAULT_ENGINE_CONFIG.TEMPERATURE).toBe(0.7);
            expect(DEFAULT_ENGINE_CONFIG.TOP_P).toBe(0.95);
            expect(DEFAULT_ENGINE_CONFIG.TOP_K).toBe(40);
            expect(DEFAULT_ENGINE_CONFIG.REPEAT_PENALTY).toBe(1.2);
            expect(DEFAULT_ENGINE_CONFIG.CONTEXT_SIZE).toBe(16384);
        });
    });
});
