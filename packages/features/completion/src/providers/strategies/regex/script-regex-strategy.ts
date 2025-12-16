
import { RegexContextStrategy } from './regex-strategy.interface';

export class ScriptRegexStrategy implements RegexContextStrategy {
    supports(languageId: string): boolean {
        return languageId === 'javascript' || languageId === 'typescript' || languageId === 'typescriptreact' || languageId === 'javascriptreact';
    }

    isInRegexContext(text: string): boolean {
        // /regex/ or new RegExp('regex')
        return /\/[^\/]*$/.test(text) || /RegExp\(['"][^'"]*$/.test(text);
    }
}
