import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Language-specific patterns for code analysis.
 */
export interface LanguagePatterns {
    imports: string[];
    functions: string[];
    classes: string[];
    interfaces?: string[];
    types?: string[];
    variables?: string[];
    comments: string[];
}

/**
 * Manages language-specific configuration and patterns.
 *
 * Responsibilities:
 * - Load language patterns from configuration files
 * - Provide singleton access to language configs
 * - Support dynamic pattern updates
 * - Handle initialization and error cases
 *
 * Used by context engine and semantic analyzer.
 */
export class LanguageConfigService {
    private static instance: LanguageConfigService;
    private patterns: Map<string, LanguagePatterns> = new Map();
    private context: vscode.ExtensionContext | null = null;
    private initialized = false;

    private constructor() {}

    /**
     * Get singleton instance of LanguageConfigService.
     * @returns Service instance
     */
    public static getInstance(): LanguageConfigService {
        if (!LanguageConfigService.instance) {
            LanguageConfigService.instance = new LanguageConfigService();
        }
        return LanguageConfigService.instance;
    }

    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        this.loadPatterns();
        this.initialized = true;

        // Watch for changes (development only usually, but good for dynamic updates)
        const configPath = path.join(context.extensionPath, 'src', 'resources', 'languages.json');
        if (fs.existsSync(configPath)) {
            // Simple polling or just reload on extension restart.
            // fs.watch might be too aggressive or platform dependent.
            // For now, load once.
        }
    }

    private loadPatterns(): void {
        if (!this.context) {
            console.warn('[LanguageConfigService] Context not set, cannot load patterns');
            return;
        }

        try {
            const configPath = path.join(this.context.extensionPath, 'src', 'resources', 'languages.json');
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                const config = JSON.parse(content);

                for (const [lang, patterns] of Object.entries(config)) {
                    this.patterns.set(lang, patterns as LanguagePatterns);
                }
                console.log(`[LanguageConfigService] Loaded patterns for ${this.patterns.size} languages`);
            } else {
                console.warn(`[LanguageConfigService] Config file not found at ${configPath}`);
            }
        } catch (error) {
            console.error(`[LanguageConfigService] Failed to load patterns: ${error}`);
        }
    }

    public getPatterns(languageId: string): LanguagePatterns | undefined {
        return this.patterns.get(languageId);
    }
}
