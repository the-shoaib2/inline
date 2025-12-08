/**
 * Regex Generator
 * Generates regex patterns from natural language descriptions
 */
export class RegexGenerator {
    
    private patterns: Record<string, { pattern: string; flags?: string }> = {
        'email': { pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
        'url': { pattern: '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$' },
        'phone': { pattern: '^\\+?[1-9]\\d{1,14}$' },
        'date': { pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        'time': { pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        'ipv4': { pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$' },
        'hex color': { pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
        'username': { pattern: '^[a-zA-Z0-9_-]{3,16}$' },
        'password strong': { pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$' },
        'uuid': { pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', flags: 'i' },
        'credit card': { pattern: '^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})$' },
        'ssn': { pattern: '^\\d{3}-\\d{2}-\\d{4}$' },
        'zip code': { pattern: '^\\d{5}(-\\d{4})?$' },
        'digits only': { pattern: '^\\d+$' },
        'letters only': { pattern: '^[a-zA-Z]+$' },
        'alphanumeric': { pattern: '^[a-zA-Z0-9]+$' },
        'no whitespace': { pattern: '^\\S+$' },
        'html tag': { pattern: '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)' },
        'markdown link': { pattern: '\\[([^\\]]+)\\]\\(([^\\)]+)\\)' }
    };

    generateFromDescription(description: string): { pattern: string; flags?: string; explanation: string } | null {
        const lowerDesc = description.toLowerCase();
        
        // Find matching pattern
        for (const [key, value] of Object.entries(this.patterns)) {
            if (lowerDesc.includes(key)) {
                return {
                    ...value,
                    explanation: `Pattern for ${key}`
                };
            }
        }

        // Generate custom patterns based on keywords
        if (lowerDesc.includes('starts with')) {
            const word = this.extractWord(description, 'starts with');
            return {
                pattern: `^${word}`,
                explanation: `Matches strings starting with "${word}"`
            };
        }

        if (lowerDesc.includes('ends with')) {
            const word = this.extractWord(description, 'ends with');
            return {
                pattern: `${word}$`,
                explanation: `Matches strings ending with "${word}"`
            };
        }

        if (lowerDesc.includes('contains')) {
            const word = this.extractWord(description, 'contains');
            return {
                pattern: word,
                explanation: `Matches strings containing "${word}"`
            };
        }

        if (lowerDesc.includes('exactly') && lowerDesc.includes('characters')) {
            const num = this.extractNumber(description);
            return {
                pattern: `^.{${num}}$`,
                explanation: `Matches strings with exactly ${num} characters`
            };
        }

        if (lowerDesc.includes('at least') && lowerDesc.includes('characters')) {
            const num = this.extractNumber(description);
            return {
                pattern: `^.{${num},}$`,
                explanation: `Matches strings with at least ${num} characters`
            };
        }

        return null;
    }

    private extractWord(text: string, after: string): string {
        const match = text.match(new RegExp(`${after}\\s+"([^"]+)"|${after}\\s+(\\w+)`, 'i'));
        return match ? (match[1] || match[2]) : '';
    }

    private extractNumber(text: string): number {
        const match = text.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
    }

    testPattern(pattern: string, testString: string, flags?: string): boolean {
        try {
            const regex = new RegExp(pattern, flags);
            return regex.test(testString);
        } catch {
            return false;
        }
    }
}
