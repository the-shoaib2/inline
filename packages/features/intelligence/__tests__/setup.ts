import { vi } from 'vitest';

// Mock vscode module before any imports
vi.mock('vscode', () => ({
    workspace: {
        getConfiguration: vi.fn(() => ({
            get: vi.fn((key: string) => {
                if (key === 'fim') {
                    return { prefix: '<|fim_prefix|>', suffix: '<|fim_suffix|>', middle: '<|fim_middle|>' };
                }
                return undefined;
            })
        }))
    },
    window: {
        createOutputChannel: vi.fn(() => ({
            appendLine: vi.fn(),
            append: vi.fn(),
            clear: vi.fn(),
            show: vi.fn(),
            hide: vi.fn(),
            dispose: vi.fn()
        }))
    },
    CancellationTokenSource: vi.fn(() => ({
        token: { isCancellationRequested: false, onCancellationRequested: vi.fn() },
        cancel: vi.fn(),
        dispose: vi.fn()
    })),
    Range: class {
        start: any;
        end: any;
        constructor(startLineOrPos: any, startCharOrEndPos: any, endLine?: any, endChar?: any) {
            // Handle both (start, end) and (startLine, startChar, endLine, endChar) signatures
            if (typeof startLineOrPos === 'object') {
                this.start = startLineOrPos;
                this.end = startCharOrEndPos;
            } else {
                this.start = { line: startLineOrPos, character: startCharOrEndPos };
                this.end = { line: endLine, character: endChar };
            }
        }
    },
    Position: class {
        line: number;
        character: number;
        constructor(line: number, character: number) {
            this.line = line;
            this.character = character;
        }
        translate(lineDelta: number = 0, charDelta: number = 0) {
            return new (this.constructor as any)(this.line + lineDelta, this.character + charDelta);
        }
    },
    Diagnostic: class {
        range: any;
        message: string;
        severity: any;
        constructor(range: any, message: string, severity: any) {
            this.range = range;
            this.message = message;
            this.severity = severity;
        }
    },
    DiagnosticSeverity: {
        Error: 0,
        Warning: 1,
        Information: 2,
        Hint: 3
    }
}));

vi.mock('node-llama-cpp', () => {
    const mockModel = {
        tokenize: vi.fn((text: string) => text.split(/\s+/).map((_, i) => i)),
        detokenize: vi.fn((tokens: number[]) => tokens.map(t => `token_${t}`).join(' ')),
        createContext: vi.fn(async () => mockContext),
        dispose: vi.fn(async () => {})
    };

    const mockSequence = {
        evaluate: vi.fn(async function* (tokens: number[], options: any) {
            const numTokens = options.maxTokens || 10;
            for (let i = 0; i < numTokens; i++) {
                yield i;
            }
        }),
        dispose: vi.fn(async () => {})
    };

    const mockContext = {
        getSequence: vi.fn(() => mockSequence),
        dispose: vi.fn(async () => {})
    };

    const mockLlama = {
        loadModel: vi.fn(async () => mockModel)
    };

    return {
        getLlama: vi.fn(async () => mockLlama),
        LlamaModel: vi.fn(),
        LlamaContext: vi.fn()
    };
});

export const TEST_FIXTURES = {
    MODEL_PATH: '/tmp/test-model.gguf',
    SAMPLE_PROMPTS: {
        simple: 'function add(a, b) {',
        multiline: 'function calculate(x, y) {\n    const sum = x + y;',
        withFIM: '<|fim_prefix|>function test() {<|fim_suffix|>}<|fim_middle|>'
    },
    SAMPLE_COMPLETIONS: {
        simple: '\n    return a + b;\n}',
        withDuplicates: 'line1\nline1\nline1\nline2',
        withFIMTokens: '<|fim_middle|>const x = 1;'
    }
};
