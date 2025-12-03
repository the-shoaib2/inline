import * as vscode from 'vscode';
import { ModelInfo } from '../core/model-manager';

export class ModelValidator {
    public static validateModelInfo(model: any): model is ModelInfo {
        return (
            typeof model === 'object' &&
            typeof model.id === 'string' &&
            typeof model.name === 'string' &&
            typeof model.size === 'number' &&
            typeof model.description === 'string' &&
            Array.isArray(model.languages) &&
            typeof model.requirements === 'object' &&
            typeof model.isDownloaded === 'boolean'
        );
    }

    public static validateModelFile(filePath: string): boolean {
        // Check if file exists and has correct extension
        const fs = require('fs');
        if (!fs.existsSync(filePath)) {
            return false;
        }

        // Check file extension
        const validExtensions = ['.gguf', '.bin', '.safetensors'];
        const hasValidExtension = validExtensions.some(ext => 
            filePath.toLowerCase().endsWith(ext)
        );

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
            const fs = require('fs');
            const crypto = require('crypto');

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
        const os = require('os');

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
