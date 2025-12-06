import * as path from 'path';

export const Uri = {
    file: (path: string) => ({ fsPath: path, scheme: 'file' }),
    parse: (path: string) => ({ fsPath: path, scheme: 'file' })
};

export class Position {
    line: number;
    character: number;
    constructor(line: number, character: number) {
        this.line = line;
        this.character = character;
    }
}

export class Range {
    start: any;
    end: any;
    constructor(start: any, end: any) {
        this.start = start;
        this.end = end;
    }
}

export class RelativePattern {
    base: any;
    pattern: string;
    constructor(base: any, pattern: string) {
        this.base = base;
        this.pattern = pattern;
    }
}

export const window = {
    showInformationMessage: () => {},
    showErrorMessage: () => {},
    createStatusBarItem: () => ({
        show: () => {},
        hide: () => {},
        dispose: () => {},
        text: '',
        tooltip: '',
        command: '',
        backgroundColor: ''
    }),
    createOutputChannel: () => ({
        appendLine: () => {},
        dispose: () => {}
    })
};

export const workspace = {
    getWorkspaceFolder: (uri: any) => {
        return { name: 'test-project', uri: uri };
    },
    findFiles: async () => [],
    openTextDocument: async () => ({
        getText: () => '',
        languageId: 'typescript',
        uri: { fsPath: '/test/file.ts' }
    }),
    asRelativePath: (path: string) => path,
    getConfiguration: () => ({
        get: (key: string, defaultValue: any) => defaultValue,
        update: () => Promise.resolve()
    })
};

export const StatusBarAlignment = {
    Left: 1,
    Right: 2
};

export class ThemeColor {
    id: string;
    constructor(id: string) {
        this.id = id;
    }
}

export enum InlineCompletionTriggerKind {
    Invoke = 0,
    Automatic = 1,
}

export class CodeActionKind {
    static QuickFix = new CodeActionKind('quickfix');
    static RefactorRewrite = new CodeActionKind('refactor.rewrite');
    
    constructor(public value: string) {}
}

export class CodeAction {
    command?: { command: string, title: string, arguments?: any[] };
    constructor(public title: string, public kind?: CodeActionKind) {}
}


// Keep default if needed by some other test, but usually named is better
export default {
    Uri,
    Position,
    Range,
    RelativePattern,
    window,
    workspace,
    StatusBarAlignment,
    ThemeColor,
    InlineCompletionTriggerKind,
    CodeActionKind,
    CodeAction
};
