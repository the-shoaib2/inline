import { Logger } from '@inline/shared';
import { FIMManager } from '../fim-templates';

/**
 * Cleans and normalizes model output
 */
export class OutputCleaner {
    private logger: Logger;
    private fimManager: FIMManager;

    constructor(fimManager: FIMManager) {
        this.logger = new Logger('OutputCleaner');
        this.fimManager = fimManager;
    }

    /**
     * Clean completion output
     */
    clean(completion: string): string {
        if (!completion) {
            return '';
        }

        // Step 1: Remove FIM tokens using FIMManager
        let cleaned = this.fimManager.clean(completion);

        // Step 2: Remove escaped backslashes before angle brackets
        cleaned = cleaned.replace(/\\+</g, '<');

        // Step 3: Remove orphaned angle bracket artifacts
        cleaned = cleaned.replace(/<[|]+/g, ''); // Orphaned <|
        cleaned = cleaned.replace(/[|]+>/g, ''); // Orphaned |>

        // Step 4: Clean up excessive whitespace/newlines
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines

        // Step 5: Trim trailing whitespace
        cleaned = cleaned.trimEnd();

        return cleaned;
    }

    /**
     * Normalize whitespace in completion
     */
    normalizeWhitespace(text: string): string {
        return text
            .replace(/\r\n/g, '\n') // Normalize line endings
            .replace(/\t/g, '    ') // Convert tabs to spaces
            .replace(/ +$/gm, ''); // Remove trailing spaces from lines
    }
}
