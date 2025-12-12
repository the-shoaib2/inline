import * as vscode from 'vscode';
import { ContextEngine } from '@inline/context';

interface CompletionEnhancement {
    text: string;
    cursorOffset?: number;
    description?: string;
}

export class SmartCompletionEnhancer {
    private contextEngine: ContextEngine;

    constructor(contextEngine: ContextEngine) {
        this.contextEngine = contextEngine;
    }

    /**
     * Enhance completion with smart bracket/quote pairing
     */
    enhanceWithPairing(
        document: vscode.TextDocument,
        position: vscode.Position,
        completion: string
    ): CompletionEnhancement | null {
        const line = document.lineAt(position.line).text;
        const charBefore = line[position.character - 1];
        const charAfter = line[position.character];

        // Check if we need to add closing bracket/quote
        const pairs: Record<string, string> = {
            '(': ')',
            '[': ']',
            '{': '}',
            '"': '"',
            "'": "'",
            '`': '`',
            '<': '>'
        };

        if (charBefore && pairs[charBefore]) {
            const closingChar = pairs[charBefore];
            
            // Check if closing char is already present
            if (charAfter !== closingChar) {
                // Add closing character and position cursor between them
                return {
                    text: completion + closingChar,
                    cursorOffset: -closingChar.length,
                    description: 'Auto-paired brackets/quotes'
                };
            }
        }

        return null;
    }

    /**
     * Auto-close HTML/XML tags
     */
    enhanceWithAutoClosingTag(
        document: vscode.TextDocument,
        position: vscode.Position,
        completion: string
    ): CompletionEnhancement | null {
        const languageId = document.languageId;
        
        // Only for HTML-like languages
        if (!['html', 'xml', 'jsx', 'tsx', 'vue', 'svelte'].includes(languageId)) {
            return null;
        }

        // Check if completion ends with >
        const tagMatch = completion.match(/<(\w+)([^>]*)>$/);
        if (tagMatch) {
            const tagName = tagMatch[1];
            
            // Self-closing tags don't need closing
            const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
            if (selfClosingTags.includes(tagName.toLowerCase())) {
                return null;
            }

            // Check if closing tag already exists
            const textAfter = document.getText(new vscode.Range(
                position,
                new vscode.Position(position.line, position.character + 20)
            ));

            if (!textAfter.includes(`</${tagName}>`)) {
                return {
                    text: completion + `</${tagName}>`,
                    cursorOffset: -(`</${tagName}>`.length),
                    description: 'Auto-closed tag'
                };
            }
        }

        return null;
    }

    /**
     * Suggest variable names based on type and context
     */
    async suggestVariableName(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<string[]> {
        const line = document.lineAt(position.line).text;
        const suggestions: string[] = [];

        // Detect variable declaration pattern
        const declMatch = line.match(/(const|let|var)\s+$/);
        if (!declMatch) {
            return suggestions;
        }

        // Get context to infer type
        const context = await this.contextEngine.buildContext(document, position);
        
        // Analyze surrounding code for hints
        const textBefore = document.getText(new vscode.Range(
            new vscode.Position(Math.max(0, position.line - 5), 0),
            position
        ));

        // Common patterns
        const patterns = [
            // Function calls: const result = fetchData()
            { regex: /(\w+)\(\)/, prefix: 'result', suffix: 'Data' },
            // Array operations: const items = array.map()
            { regex: /\.map\(/, prefix: 'mapped', suffix: 'Items' },
            { regex: /\.filter\(/, prefix: 'filtered', suffix: 'Items' },
            { regex: /\.reduce\(/, prefix: 'reduced', suffix: 'Value' },
            // API calls
            { regex: /fetch|axios|http/, prefix: 'response', suffix: 'Data' },
            // Database
            { regex: /query|select|find/, prefix: 'result', suffix: 'Set' },
        ];

        for (const pattern of patterns) {
            if (pattern.regex.test(textBefore)) {
                suggestions.push(pattern.prefix);
                suggestions.push(pattern.suffix.toLowerCase());
            }
        }

        // Type-based suggestions
        if (context.currentScope) {
            // Analyze nearby variable names for conventions
            const nearbyVars = Array.from(context.currentScope.variables.keys());
            
            // Detect naming convention (camelCase, snake_case, etc.)
            const hasCamelCase = nearbyVars.some(v => /[a-z][A-Z]/.test(v));
            const hasSnakeCase = nearbyVars.some(v => /_/.test(v));

            // Generic suggestions based on context
            const genericNames = ['value', 'data', 'result', 'item', 'element', 'obj', 'arr'];
            suggestions.push(...genericNames);

            // Add convention-specific variants
            if (hasCamelCase) {
                suggestions.push('newValue', 'currentItem', 'selectedData');
            }
            if (hasSnakeCase) {
                suggestions.push('new_value', 'current_item', 'selected_data');
            }
        }

        // Remove duplicates and return top 5
        return [...new Set(suggestions)].slice(0, 5);
    }

    /**
     * Enhance method chaining completions
     */
    async enhanceMethodChaining(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<string[]> {
        const line = document.lineAt(position.line).text;
        const beforeCursor = line.substring(0, position.character);

        // Check if we're in a method chain
        const chainMatch = beforeCursor.match(/(\w+)\.(\w+)\(\)\.$/);
        if (!chainMatch) {
            return [];
        }

        const objectName = chainMatch[1];
        const lastMethod = chainMatch[2];

        // Common chainable methods by type
        const chainPatterns: Record<string, string[]> = {
            // Array methods
            'map': ['filter', 'reduce', 'forEach', 'find', 'some', 'every', 'slice', 'sort'],
            'filter': ['map', 'reduce', 'forEach', 'slice', 'sort', 'reverse'],
            'reduce': ['toString', 'valueOf'],
            
            // Promise methods
            'then': ['then', 'catch', 'finally'],
            'catch': ['then', 'finally'],
            
            // String methods
            'trim': ['toLowerCase', 'toUpperCase', 'split', 'replace'],
            'toLowerCase': ['trim', 'split', 'replace', 'substring'],
            'split': ['map', 'filter', 'join', 'slice'],
            
            // jQuery-like
            'addClass': ['removeClass', 'toggleClass', 'css', 'attr'],
            'css': ['addClass', 'removeClass', 'show', 'hide'],
        };

        const suggestions = chainPatterns[lastMethod] || [];
        return suggestions;
    }

    /**
     * Smart quote completion
     */
    enhanceWithSmartQuotes(
        document: vscode.TextDocument,
        position: vscode.Position,
        completion: string
    ): CompletionEnhancement | null {
        const line = document.lineAt(position.line).text;
        const charBefore = line[position.character - 1];

        // If we're starting a string
        if (charBefore === '"' || charBefore === "'" || charBefore === '`') {
            const quote = charBefore;
            
            // Check if we need to close the quote
            const textAfter = line.substring(position.character);
            if (!textAfter.startsWith(quote)) {
                return {
                    text: completion + quote,
                    cursorOffset: -1,
                    description: 'Auto-closed quote'
                };
            }
        }

        return null;
    }

    /**
     * Enhance completion with all available enhancements (synchronous version)
     */
    enhanceSync(
        document: vscode.TextDocument,
        position: vscode.Position,
        completion: string
    ): string {
        let enhanced = completion;

        // Try bracket/quote pairing
        const pairing = this.enhanceWithPairing(document, position, enhanced);
        if (pairing) {
            return pairing.text;
        }

        // Try auto-closing tags
        const tag = this.enhanceWithAutoClosingTag(document, position, enhanced);
        if (tag) {
            return tag.text;
        }

        // Try smart quotes
        const quotes = this.enhanceWithSmartQuotes(document, position, enhanced);
        if (quotes) {
            return quotes.text;
        }

        return enhanced;
    }

    /**
     * Enhance completion with all available enhancements
     */
    async enhance(
        document: vscode.TextDocument,
        position: vscode.Position,
        completion: string
    ): Promise<string> {
        // For now, just call sync version
        // Can be extended with async features later
        return this.enhanceSync(document, position, completion);
    }

    /**
     * Get completion items for variable name suggestions
     */
    async getVariableNameCompletions(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.CompletionItem[]> {
        const suggestions = await this.suggestVariableName(document, position);
        
        return suggestions.map((name, index) => {
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
            item.sortText = `0${index}`; // Sort to top
            item.detail = 'Suggested variable name';
            return item;
        });
    }

    /**
     * Get completion items for method chaining
     */
    async getMethodChainCompletions(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.CompletionItem[]> {
        const suggestions = await this.enhanceMethodChaining(document, position);
        
        return suggestions.map((method, index) => {
            const item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Method);
            item.sortText = `0${index}`;
            item.detail = 'Chainable method';
            item.insertText = `${method}()`;
            return item;
        });
    }
}
