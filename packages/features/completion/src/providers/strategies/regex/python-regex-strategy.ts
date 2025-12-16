
import { RegexContextStrategy } from './regex-strategy.interface';

export class PythonRegexStrategy implements RegexContextStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    isInRegexContext(text: string): boolean {
        // re.compile(r'regex') or re.match(r'regex')
        return /re\.\w+\([r]?['"][^'"]*$/.test(text);
    }
}
