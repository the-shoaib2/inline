import * as path from 'path';

const vscodeMock = {
    workspace: {
        getWorkspaceFolder: (uri: any) => {
            return { name: 'test-project', uri: uri };
        },
        findFiles: async () => [],
        openTextDocument: async () => ({
            getText: () => '',
            languageId: 'typescript',
            uri: { fsPath: '/test/file.ts' }
        }),
        asRelativePath: (path: string) => path
    },
    Uri: {
        file: (path: string) => ({ fsPath: path, scheme: 'file' }),
        parse: (path: string) => ({ fsPath: path, scheme: 'file' })
    },
    Position: class {
        line: number;
        character: number;
        constructor(line: number, character: number) {
            this.line = line;
            this.character = character;
        }
    },
    Range: class {
        start: any;
        end: any;
        constructor(start: any, end: any) {
            this.start = start;
            this.end = end;
        }
    },
    RelativePattern: class {
        base: any;
        pattern: string;
        constructor(base: any, pattern: string) {
            this.base = base;
            this.pattern = pattern;
        }
    },
    window: {
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
        })
    },
    StatusBarAlignment: {
        Left: 1,
        Right: 2
    },
    ThemeColor: class {
        id: string;
        constructor(id: string) {
            this.id = id;
        }
    }
};

export default vscodeMock;
