
declare module 'web-tree-sitter' {
    export class Parser {
        static init(): Promise<void>;
        setLanguage(language: any): void;
        parse(input: string): Tree;
        delete(): void;
    }
    export class Language {
        static load(path: string): Promise<Language>;
        query(source: string): any;
    }
    export class Tree {
        rootNode: any;
        language: any;
        delete(): void;
    }
}
