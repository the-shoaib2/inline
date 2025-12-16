
export interface RegexContextStrategy {
    supports(languageId: string): boolean;
    isInRegexContext(text: string): boolean;
}
