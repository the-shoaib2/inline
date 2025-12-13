"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = exports.DiagnosticSeverity = exports.CodeAction = exports.CodeActionKind = exports.InlineCompletionTriggerKind = exports.ThemeColor = exports.StatusBarAlignment = exports.workspace = exports.window = exports.RelativePattern = exports.Range = exports.Position = exports.Uri = void 0;
exports.createMockContext = createMockContext;
const path = __importStar(require("path"));
exports.Uri = {
    file: (path) => ({ fsPath: path, scheme: 'file' }),
    parse: (path) => ({ fsPath: path, scheme: 'file' }),
    joinPath: (uri, ...pathSegments) => ({ fsPath: path.join(uri.fsPath, ...pathSegments), scheme: 'file' })
};
class Position {
    constructor(line, character) {
        this.line = line;
        this.character = character;
    }
}
exports.Position = Position;
class Range {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}
exports.Range = Range;
class RelativePattern {
    constructor(base, pattern) {
        this.base = base;
        this.pattern = pattern;
    }
}
exports.RelativePattern = RelativePattern;
exports.window = {
    showInformationMessage: () => { },
    showErrorMessage: () => { },
    createStatusBarItem: () => ({
        show: () => { },
        hide: () => { },
        dispose: () => { },
        text: '',
        tooltip: '',
        command: '',
        backgroundColor: ''
    }),
    createOutputChannel: () => ({
        appendLine: () => { },
        dispose: () => { }
    }),
    visibleTextEditors: []
};
exports.workspace = {
    getWorkspaceFolder: (uri) => {
        return { name: 'test-project', uri: uri };
    },
    findFiles: async () => [],
    openTextDocument: async () => ({
        getText: () => '',
        languageId: 'typescript',
        uri: { fsPath: '/test/file.ts' }
    }),
    asRelativePath: (path) => path,
    getConfiguration: () => ({
        get: (key, defaultValue) => defaultValue,
        update: () => Promise.resolve()
    }),
    fs: {
        stat: async () => ({}),
        readFile: async () => new Uint8Array()
    }
};
exports.StatusBarAlignment = {
    Left: 1,
    Right: 2
};
class ThemeColor {
    constructor(id) {
        this.id = id;
    }
}
exports.ThemeColor = ThemeColor;
var InlineCompletionTriggerKind;
(function (InlineCompletionTriggerKind) {
    InlineCompletionTriggerKind[InlineCompletionTriggerKind["Invoke"] = 0] = "Invoke";
    InlineCompletionTriggerKind[InlineCompletionTriggerKind["Automatic"] = 1] = "Automatic";
})(InlineCompletionTriggerKind || (exports.InlineCompletionTriggerKind = InlineCompletionTriggerKind = {}));
class CodeActionKind {
    constructor(value) {
        this.value = value;
    }
}
exports.CodeActionKind = CodeActionKind;
CodeActionKind.QuickFix = new CodeActionKind('quickfix');
CodeActionKind.RefactorRewrite = new CodeActionKind('refactor.rewrite');
class CodeAction {
    constructor(title, kind) {
        this.title = title;
        this.kind = kind;
    }
}
exports.CodeAction = CodeAction;
var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    DiagnosticSeverity[DiagnosticSeverity["Error"] = 0] = "Error";
    DiagnosticSeverity[DiagnosticSeverity["Warning"] = 1] = "Warning";
    DiagnosticSeverity[DiagnosticSeverity["Information"] = 2] = "Information";
    DiagnosticSeverity[DiagnosticSeverity["Hint"] = 3] = "Hint";
})(DiagnosticSeverity || (exports.DiagnosticSeverity = DiagnosticSeverity = {}));
exports.commands = {
    executeCommand: async () => undefined
};
function createMockContext() {
    return {
        subscriptions: [],
        workspaceState: {
            get: () => undefined,
            update: () => Promise.resolve()
        },
        globalState: {
            get: () => undefined,
            update: () => Promise.resolve(),
            setKeysForSync: () => { }
        },
        extensionPath: '/mock/extension/path',
        asAbsolutePath: (relativePath) => path.join('/mock/extension/path', relativePath),
        storagePath: '/mock/storage/path',
        globalStoragePath: '/mock/global/storage/path',
        logPath: '/mock/log/path',
        extensionUri: { fsPath: '/mock/extension/path', scheme: 'file' },
        environmentVariableCollection: {
            replace: () => { },
            append: () => { },
            prepend: () => { },
            get: () => undefined,
            forEach: () => { },
            delete: () => { },
            clear: () => { }
        },
        extensionMode: 1, // Development
        secrets: {
            get: () => Promise.resolve(undefined),
            store: () => Promise.resolve(),
            delete: () => Promise.resolve(),
            onDidChange: () => ({ dispose: () => { } })
        },
        storageUri: { fsPath: '/mock/storage/path', scheme: 'file' },
        globalStorageUri: { fsPath: '/mock/global/storage/path', scheme: 'file' },
        logUri: { fsPath: '/mock/log/path', scheme: 'file' }
    };
}
// Keep default if needed by some other test, but usually named is better
exports.default = {
    Uri: exports.Uri,
    Position,
    Range,
    RelativePattern,
    window: exports.window,
    workspace: exports.workspace,
    StatusBarAlignment: exports.StatusBarAlignment,
    ThemeColor,
    InlineCompletionTriggerKind,
    CodeActionKind,
    CodeAction,
    DiagnosticSeverity,
    commands: exports.commands,
    createMockContext
};
//# sourceMappingURL=vscode-mock.js.map