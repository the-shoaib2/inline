"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIMManager = exports.FIM_TEMPLATES = void 0;
const shared_1 = require("@inline/shared");
/**
 * Registry of known FIM templates.
 */
exports.FIM_TEMPLATES = {
    // Standard/Default (using angle brackets common in many models)
    'default': {
        id: 'default',
        prefix: '<|fim_prefix|>',
        suffix: '<|fim_suffix|>',
        middle: '<|fim_middle|>',
        eot: '<|endoftext|>',
        fileSeparator: '<|file_separator|>'
    },
    'stable-code': {
        id: 'stable-code',
        prefix: '<|fim_prefix|>',
        suffix: '<|fim_suffix|>',
        middle: '<|fim_middle|>',
        eot: '<|endoftext|>'
    },
    'starcoder': {
        id: 'starcoder',
        prefix: '<|fim_prefix|>',
        suffix: '<|fim_suffix|>',
        middle: '<|fim_middle|>',
        eot: '<|endoftext|>',
        fileSeparator: '<|file_separator|>'
    },
    // CodeLlama Style
    'codellama': {
        id: 'codellama',
        prefix: '<PRE>',
        suffix: '<SUF>',
        middle: '<MID>',
        eot: '<EOT>',
        extraStopTokens: ['<END>']
    },
    // DeepSeek / Qwen Style (Curly braces with pipes)
    'deepseek': {
        id: 'deepseek',
        // Use standard placeholders for now, but user regex had { | fim_prefix | } style
        // Let's support the user's observed regex style as primary for "deepseek" if that's what they use,
        // OR standard DeepSeek tokens.
        // The regex in llama-engine had: \{ \| fim_prefix \| \}
        prefix: '{|fim_prefix|}',
        suffix: '{|fim_suffix|}',
        middle: '{|fim_middle|}',
        eot: '<|endoftext|>',
        extraStopTokens: ['{|fim_begin|}', '{|fim_hole|}', '{|fim_end|}', '<｜end of sentence｜>']
    },
    'qwen': {
        id: 'qwen',
        prefix: '<|fim_prefix|>',
        suffix: '<|fim_suffix|>',
        middle: '<|fim_middle|>',
        eot: '<|endoftext|>'
    },
    // Mistral / Codestral Style
    'codestral': {
        id: 'codestral',
        prefix: '[PREFIX]',
        suffix: '[SUFFIX]',
        middle: '[MIDDLE]',
        eot: '</s>'
    },
    // Custom Placeholder (filled by user settings at runtime if needed)
    'custom': {
        id: 'custom',
        prefix: '',
        suffix: '',
        middle: ''
    }
};
class FIMManager {
    constructor() {
        this.logger = new shared_1.Logger('FIMManager');
        this.currentTemplate = exports.FIM_TEMPLATES['default'];
        this.cleanupRegex = this.generateCleanupRegex(this.currentTemplate);
    }
    /**
     * Set the active FIM template by ID.
     */
    setTemplate(templateId, customConfig) {
        let template = exports.FIM_TEMPLATES[templateId] || exports.FIM_TEMPLATES['default'];
        if (templateId === 'custom' && customConfig) {
            template = {
                ...template,
                ...customConfig
            };
        }
        if (this.currentTemplate.id !== template.id) {
            this.logger.info(`Switching FIM template to: ${template.id}`);
            this.currentTemplate = template;
            this.cleanupRegex = this.generateCleanupRegex(template);
        }
    }
    getTemplate() {
        return this.currentTemplate;
    }
    /**
     * Create the prompt with FIM tokens.
     */
    createPrompt(prefix, suffix) {
        return `${this.currentTemplate.prefix}${prefix}${this.currentTemplate.suffix}${suffix}${this.currentTemplate.middle}`;
    }
    /**
     * Clean up FIM tokens from the completion output.
     */
    clean(completion) {
        if (!completion)
            return '';
        // 1. Remove the main FIM tokens for the CURRENT model (most critical)
        let cleaned = completion.replace(this.cleanupRegex, '');
        // 2. Remove orphan artifacts (pipes, braces) that might be left over
        // This resembles the aggressive cleanup from the original engine
        cleaned = cleaned.replace(/\|\s*\|/g, ''); // ||
        cleaned = cleaned.replace(/\{\s*\}/g, ''); // {}
        // 3. Remove common "end of text" markers if they leaked
        const eotTokens = ['<|endoftext|>', '<EOT>', '</s>', '<｜end of sentence｜>'];
        for (const token of eotTokens) {
            cleaned = cleaned.split(token)[0]; // Truncate at EOT
        }
        return cleaned;
    }
    /**
     * Generates a regex that aggressively matches the template's tokens
     * handling optional whitespace or partial escapes common in LLM outputs.
     */
    generateCleanupRegex(template) {
        const tokens = [
            template.prefix,
            template.suffix,
            template.middle,
            template.eot,
            template.fileSeparator,
            ...(template.extraStopTokens || [])
        ].filter(t => t && t.length > 0);
        // Escape regex characters
        const escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        // Create a pattern that allows for some whitespace flexibility around the tokens
        // e.g. < | fim_prefix | >
        const flexiblePatterns = escapedTokens.map(t => {
            // If token looks like <|...|>, allow spaces around pipes
            if (t.startsWith('<\\|') && t.endsWith('\\|>')) {
                const center = t.slice(3, -3); // remove <\| and \|>
                return `<\\s*\\|?\\s*${center}\\s*\\|?\\s*>`;
            }
            // If token looks like {|...|}, allow spaces around pipes
            if (t.startsWith('\\{\\|') && t.endsWith('\\|\\}')) {
                const center = t.slice(4, -4); // remove \{\| and \|\}
                return `\\{\\s*\\|\\s*${center}\\s*\\|\\s*\\}`;
            }
            // Standard exact match as fallback
            return t;
        });
        // Also include the "catch-all" big regex from before?
        // The user wanted "separation" and "scalability". 
        // We should PROBABLY not include the giant 'all existing FIMs' regex unless we are in 'heuristic' mode.
        // However, to be safe and match previous robustness, let's keep a "Generic Cleanup" pass 
        // OR rely on the standard regex being generated correctly.
        // Let's stick to the specific template cleanup + a small set of generic artifacts (step 2 in clean()).
        return new RegExp(flexiblePatterns.join('|'), 'gi');
    }
}
exports.FIMManager = FIMManager;
//# sourceMappingURL=fim-templates.js.map