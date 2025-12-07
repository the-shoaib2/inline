import * as vscode from 'vscode';

interface RegexPattern {
    name: string;
    pattern: string;
    description: string;
    example: string;
}

/**
 * Regex Completion Provider
 * Provides common regex pattern completions
 */
export class RegexCompletionProvider implements vscode.CompletionItemProvider {
    private patterns: RegexPattern[] = [
        { name: 'email', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', description: 'Email address', example: 'user@example.com' },
        { name: 'url', pattern: '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$', description: 'URL', example: 'https://example.com' },
        { name: 'phone', pattern: '^\\+?[1-9]\\d{1,14}$', description: 'Phone number (E.164)', example: '+1234567890' },
        { name: 'date-iso', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'ISO date (YYYY-MM-DD)', example: '2024-01-15' },
        { name: 'time', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$', description: 'Time (HH:MM)', example: '14:30' },
        { name: 'ipv4', pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$', description: 'IPv4 address', example: '192.168.1.1' },
        { name: 'hex-color', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', description: 'Hex color code', example: '#FF5733' },
        { name: 'username', pattern: '^[a-zA-Z0-9_-]{3,16}$', description: 'Username (3-16 chars)', example: 'user_123' },
        { name: 'password', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', description: 'Strong password', example: 'Pass123!' },
        { name: 'uuid', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', description: 'UUID v4', example: '550e8400-e29b-41d4-a716-446655440000' },
        { name: 'slug', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', description: 'URL slug', example: 'my-blog-post' },
        { name: 'credit-card', pattern: '^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})$', description: 'Credit card number', example: '4111111111111111' },
        { name: 'ssn', pattern: '^\\d{3}-\\d{2}-\\d{4}$', description: 'SSN (US)', example: '123-45-6789' },
        { name: 'zip-code', pattern: '^\\d{5}(-\\d{4})?$', description: 'ZIP code (US)', example: '12345' },
        { name: 'digits-only', pattern: '^\\d+$', description: 'Digits only', example: '12345' },
        { name: 'letters-only', pattern: '^[a-zA-Z]+$', description: 'Letters only', example: 'Hello' },
        { name: 'alphanumeric', pattern: '^[a-zA-Z0-9]+$', description: 'Alphanumeric', example: 'Test123' },
        { name: 'no-whitespace', pattern: '^\\S+$', description: 'No whitespace', example: 'NoSpaces' },
        { name: 'html-tag', pattern: '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)', description: 'HTML tag', example: '<div>content</div>' },
        { name: 'markdown-link', pattern: '\\[([^\\]]+)\\]\\(([^\\)]+)\\)', description: 'Markdown link', example: '[text](url)' }
    ];

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        const lineText = document.lineAt(position.line).text;
        const textBefore = lineText.substring(0, position.character);
        
        // Detect regex context
        const regexContext = this.isInRegexContext(textBefore, document.languageId);
        if (!regexContext) {
            return [];
        }

        const items: vscode.CompletionItem[] = [];

        for (const pattern of this.patterns) {
            const item = new vscode.CompletionItem(pattern.name, vscode.CompletionItemKind.Constant);
            item.detail = pattern.description;
            item.documentation = new vscode.MarkdownString(
                `**Pattern:** \`${pattern.pattern}\`\n\n` +
                `**Example:** \`${pattern.example}\`\n\n` +
                `**Description:** ${pattern.description}`
            );
            item.insertText = pattern.pattern;
            item.sortText = `0${pattern.name}`;
            
            items.push(item);
        }

        return items;
    }

    private isInRegexContext(text: string, languageId: string): boolean {
        // Check for regex literal context
        if (languageId === 'javascript' || languageId === 'typescript') {
            // /regex/ or new RegExp('regex')
            return /\/[^\/]*$/.test(text) || /RegExp\(['"][^'"]*$/.test(text);
        }
        
        if (languageId === 'python') {
            // re.compile(r'regex') or re.match(r'regex')
            return /re\.\w+\([r]?['"][^'"]*$/.test(text);
        }

        // Generic string context that might be regex
        return /['"][^'"]*$/.test(text);
    }
}
