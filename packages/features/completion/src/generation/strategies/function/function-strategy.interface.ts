
export interface FunctionPattern {
    regex: RegExp;
    type: 'function' | 'method' | 'arrow' | 'class';
    nameGroup: number;
    endPattern: string;
}

export interface FunctionBoundary {
    isFunctionStart: boolean;
    functionName?: string;
    functionType: 'function' | 'method' | 'arrow' | 'class' | 'unknown';
    indentLevel: number;
    needsClosing: boolean;
    expectedEndPattern?: string;
}

export interface FunctionStrategy {
    supports(languageId: string): boolean;
    getPatterns(): FunctionPattern[];
    isComplete(completion: string, boundary: FunctionBoundary): boolean;
    completeFunction(completion: string, boundary: FunctionBoundary): string;
}
