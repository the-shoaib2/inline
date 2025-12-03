import { ModelInfo } from '../core/model-manager';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as os from 'os';
import * as path from 'path';

export class ModelValidator {
    public static validateModelInfo(model: unknown): model is ModelInfo {
        if (!model || typeof model !== 'object') {
            return false;
        }
        const m = model as Record<string, unknown>;
        return (
            typeof m.id === 'string' &&
            typeof m.name === 'string' &&
            typeof m.size === 'number' &&
            typeof m.description === 'string' &&
            Array.isArray(m.languages) &&
            typeof m.requirements === 'object' &&
            typeof m.isDownloaded === 'boolean'
        );
    }

    public static validateModelFile(filePath: string): boolean {
        // Check if file exists and has correct extension
        if (!fs.existsSync(filePath)) {
            return false;
        }

        // Check for GGUF magic number
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(4);
        fs.readSync(fd, buffer, 0, 4, 0);
        fs.closeSync(fd);
        if (buffer.toString('utf8') === 'GGUF') {
            return true; // If it's a GGUF file, we consider it valid for now
        }

        // Check file extension
        const validExtensions = ['.gguf', '.bin', '.safetensors'];
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        const hasValidExtension = validExtensions.some(validExt => validExt.replace('.', '') === ext);

        if (!hasValidExtension) {
            return false;
        }

        // Check file size (should be at least 1MB)
        const stats = fs.statSync(filePath);
        if (stats.size < 1024 * 1024) {
            return false;
        }

        return true;
    }

    public static async validateModelIntegrity(filePath: string): Promise<boolean> {
        try {
            // Calculate file hash
            const fileBuffer = fs.readFileSync(filePath);
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const hex = hashSum.digest('hex');

            // In production, compare with known hash
            // For now, just check if hash was calculated successfully
            return hex.length === 64;
        } catch (error) {
            console.error('Failed to validate model integrity:', error);
            return false;
        }
    }

    public static checkSystemRequirements(model: ModelInfo): {
        canRun: boolean;
        warnings: string[];
    } {
        const warnings: string[] = [];

        // Check RAM
        const totalRAM = os.totalmem() / (1024 * 1024 * 1024); // Convert to GB
        const requiredRAM = model.requirements.ram || 4;
        
        if (totalRAM < requiredRAM) {
            warnings.push(`Insufficient RAM: ${totalRAM.toFixed(1)}GB available, ${requiredRAM}GB required`);
        }

        // Check CPU
        const cpuCount = os.cpus().length;
        if (cpuCount < 2) {
            warnings.push('Low CPU count: At least 2 cores recommended');
        }

        // Check VRAM (if GPU required)
        if (model.requirements.gpu && model.requirements.vram) {
            warnings.push('GPU acceleration recommended but not verified');
        }

        return {
            canRun: warnings.length === 0,
            warnings
        };
    }
}
