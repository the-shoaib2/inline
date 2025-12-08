import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@platform/system/logger';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata?: GGUFMetadata;
}

export interface GGUFMetadata {
    version: number;
    tensorCount?: number;
    architecture?: string;
    quantization?: string;
    contextLength?: number;
    embeddingLength?: number;
    blockCount?: number;
    headCount?: number;
    fileType?: string;
    modelName?: string;
    parameters?: {
        [key: string]: string | number | boolean;
    };
}

export class ModelValidator {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('ModelValidator');
    }

    public validateModel(modelPath: string): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Check if file exists
        if (!fs.existsSync(modelPath)) {
            result.isValid = false;
            result.errors.push('Model file does not exist');
            return result;
        }

        // Check file extension
        const ext = path.extname(modelPath).toLowerCase();
        if (ext !== '.gguf' && ext !== '.bin') {
            result.warnings.push(`Unexpected file extension: ${ext}`);
        }

        // Check file size
        const stats = fs.statSync(modelPath);
        if (stats.size < 1024 * 1024) { // Less than 1MB
            result.isValid = false;
            result.errors.push('Model file is too small to be valid');
            return result;
        }

        // Validate GGUF format if applicable
        if (ext === '.gguf') {
            const ggufValidation = this.validateGGUF(modelPath);
            result.isValid = result.isValid && ggufValidation.isValid;
            result.errors.push(...ggufValidation.errors);
            result.warnings.push(...ggufValidation.warnings);
            result.metadata = ggufValidation.metadata;
        }

        return result;
    }

    private validateGGUF(modelPath: string): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        try {
            const fd = fs.openSync(modelPath, 'r');
            const buffer = Buffer.alloc(1024);

            // Read magic number (4 bytes)
            fs.readSync(fd, buffer as any, 0, 4, 0);
            const magic = buffer.toString('utf8', 0, 4);

            if (magic !== 'GGUF') {
                result.isValid = false;
                result.errors.push('Invalid GGUF magic number');
                fs.closeSync(fd);
                return result;
            }

            // Read version (4 bytes)
            fs.readSync(fd, buffer as any, 0, 4, 4);
            const version = buffer.readUInt32LE(0);

            if (version < 1 || version > 3) {
                result.warnings.push(`Unusual GGUF version: ${version}`);
            }

            // Extract metadata
            result.metadata = this.extractGGUFMetadata(fd, version, modelPath);
            result.metadata.version = version;

            fs.closeSync(fd);

        } catch (error) {
            result.isValid = false;
            result.errors.push(`Failed to validate GGUF: ${error}`);
        }

        return result;
    }

    private extractGGUFMetadata(fd: number, version: number, modelPath: string): GGUFMetadata {
        const metadata: GGUFMetadata = {
            version,
            parameters: {}
        };

        try {
            const buffer = Buffer.alloc(8);

            // Read tensor count (8 bytes at offset 8)
            fs.readSync(fd, buffer as any, 0, 8, 8);
            metadata.tensorCount = Number(buffer.readBigUInt64LE(0));

            // Read metadata count (8 bytes at offset 16)
            fs.readSync(fd, buffer as any, 0, 8, 16);
            const metadataCount = Number(buffer.readBigUInt64LE(0));

            // Infer quantization from filename
            const fileName = path.basename(modelPath);
            metadata.quantization = this.inferQuantizationFromName(fileName);

            // Set default context length
            metadata.contextLength = 4096;

        } catch (error) {
            this.logger.warn(`Failed to extract full metadata: ${error}`);
        }

        return metadata;
    }

    private inferQuantizationFromName(fileName: string): string {
        const lower = fileName.toLowerCase();

        if (lower.includes('q4_0')) return 'Q4_0';
        if (lower.includes('q4_1')) return 'Q4_1';
        if (lower.includes('q5_0')) return 'Q5_0';
        if (lower.includes('q5_1')) return 'Q5_1';
        if (lower.includes('q8_0')) return 'Q8_0';
        if (lower.includes('f16')) return 'F16';
        if (lower.includes('f32')) return 'F32';

        return 'unknown';
    }

    public validateModelSize(modelPath: string, expectedSize?: number): boolean {
        try {
            const stats = fs.statSync(modelPath);
            if (expectedSize) {
                // Allow 5% variance
                const variance = expectedSize * 0.05;
                return Math.abs(stats.size - expectedSize) <= variance;
            }
            return stats.size > 0;
        } catch {
            return false;
        }
    }

    public extractMetadata(modelPath: string): GGUFMetadata | null {
        try {
            const ext = path.extname(modelPath).toLowerCase();
            if (ext !== '.gguf') {
                return null;
            }

            const fd = fs.openSync(modelPath, 'r');
            const buffer = Buffer.alloc(8);

            // Read version
            fs.readSync(fd, buffer as any, 0, 4, 4);
            const version = buffer.readUInt32LE(0);

            const metadata = this.extractGGUFMetadata(fd, version, modelPath);
            fs.closeSync(fd);

            return metadata;
        } catch (error) {
            this.logger.error(`Failed to extract metadata: ${error}`);
            return null;
        }
    }
}
