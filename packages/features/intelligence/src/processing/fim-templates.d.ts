/**
 * Defines the token structure for a specific model family.
 */
export interface FIMTemplate {
    id: string;
    prefix: string;
    suffix: string;
    middle: string;
    eot?: string;
    fileSeparator?: string;
    extraStopTokens?: string[];
}
/**
 * Registry of known FIM templates.
 */
export declare const FIM_TEMPLATES: Record<string, FIMTemplate>;
export declare class FIMManager {
    private logger;
    private currentTemplate;
    private cleanupRegex;
    constructor();
    /**
     * Set the active FIM template by ID.
     */
    setTemplate(templateId: string, customConfig?: {
        prefix: string;
        suffix: string;
        middle: string;
    }): void;
    getTemplate(): FIMTemplate;
    /**
     * Create the prompt with FIM tokens.
     */
    createPrompt(prefix: string, suffix: string): string;
    /**
     * Clean up FIM tokens from the completion output.
     */
    clean(completion: string): string;
    /**
     * Generates a regex that aggressively matches the template's tokens
     * handling optional whitespace or partial escapes common in LLM outputs.
     */
    private generateCleanupRegex;
}
//# sourceMappingURL=fim-templates.d.ts.map