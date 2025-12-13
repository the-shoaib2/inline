export declare const Uri: {
    file: (path: string) => {
        fsPath: string;
        scheme: string;
    };
    parse: (path: string) => {
        fsPath: string;
        scheme: string;
    };
    joinPath: (uri: any, ...pathSegments: string[]) => {
        fsPath: string;
        scheme: string;
    };
};
export declare class Position {
    line: number;
    character: number;
    constructor(line: number, character: number);
}
export declare class Range {
    start: any;
    end: any;
    constructor(start: any, end: any);
}
export declare class RelativePattern {
    base: any;
    pattern: string;
    constructor(base: any, pattern: string);
}
export declare const window: {
    showInformationMessage: () => void;
    showErrorMessage: () => void;
    createStatusBarItem: () => {
        show: () => void;
        hide: () => void;
        dispose: () => void;
        text: string;
        tooltip: string;
        command: string;
        backgroundColor: string;
    };
    createOutputChannel: () => {
        appendLine: () => void;
        dispose: () => void;
    };
    visibleTextEditors: never[];
};
export declare const workspace: {
    getWorkspaceFolder: (uri: any) => {
        name: string;
        uri: any;
    };
    findFiles: () => Promise<never[]>;
    openTextDocument: () => Promise<{
        getText: () => string;
        languageId: string;
        uri: {
            fsPath: string;
        };
    }>;
    asRelativePath: (path: string) => string;
    getConfiguration: () => {
        get: (key: string, defaultValue: any) => any;
        update: () => Promise<void>;
    };
    fs: {
        stat: () => Promise<{}>;
        readFile: () => Promise<Uint8Array<ArrayBuffer>>;
    };
};
export declare const StatusBarAlignment: {
    Left: number;
    Right: number;
};
export declare class ThemeColor {
    id: string;
    constructor(id: string);
}
export declare enum InlineCompletionTriggerKind {
    Invoke = 0,
    Automatic = 1
}
export declare class CodeActionKind {
    value: string;
    static QuickFix: CodeActionKind;
    static RefactorRewrite: CodeActionKind;
    constructor(value: string);
}
export declare class CodeAction {
    title: string;
    kind?: CodeActionKind | undefined;
    command?: {
        command: string;
        title: string;
        arguments?: any[];
    };
    constructor(title: string, kind?: CodeActionKind | undefined);
}
export declare enum DiagnosticSeverity {
    Error = 0,
    Warning = 1,
    Information = 2,
    Hint = 3
}
export declare const commands: {
    executeCommand: () => Promise<undefined>;
};
export declare function createMockContext(): any;
declare const _default: {
    Uri: {
        file: (path: string) => {
            fsPath: string;
            scheme: string;
        };
        parse: (path: string) => {
            fsPath: string;
            scheme: string;
        };
        joinPath: (uri: any, ...pathSegments: string[]) => {
            fsPath: string;
            scheme: string;
        };
    };
    Position: typeof Position;
    Range: typeof Range;
    RelativePattern: typeof RelativePattern;
    window: {
        showInformationMessage: () => void;
        showErrorMessage: () => void;
        createStatusBarItem: () => {
            show: () => void;
            hide: () => void;
            dispose: () => void;
            text: string;
            tooltip: string;
            command: string;
            backgroundColor: string;
        };
        createOutputChannel: () => {
            appendLine: () => void;
            dispose: () => void;
        };
        visibleTextEditors: never[];
    };
    workspace: {
        getWorkspaceFolder: (uri: any) => {
            name: string;
            uri: any;
        };
        findFiles: () => Promise<never[]>;
        openTextDocument: () => Promise<{
            getText: () => string;
            languageId: string;
            uri: {
                fsPath: string;
            };
        }>;
        asRelativePath: (path: string) => string;
        getConfiguration: () => {
            get: (key: string, defaultValue: any) => any;
            update: () => Promise<void>;
        };
        fs: {
            stat: () => Promise<{}>;
            readFile: () => Promise<Uint8Array<ArrayBuffer>>;
        };
    };
    StatusBarAlignment: {
        Left: number;
        Right: number;
    };
    ThemeColor: typeof ThemeColor;
    InlineCompletionTriggerKind: typeof InlineCompletionTriggerKind;
    CodeActionKind: typeof CodeActionKind;
    CodeAction: typeof CodeAction;
    DiagnosticSeverity: typeof DiagnosticSeverity;
    commands: {
        executeCommand: () => Promise<undefined>;
    };
    createMockContext: typeof createMockContext;
};
export default _default;
//# sourceMappingURL=vscode-mock.d.ts.map