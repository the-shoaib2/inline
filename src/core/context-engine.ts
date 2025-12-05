import * as vscode from 'vscode';
import * as path from 'path';

export interface CodeContext {
    prefix: string;
    suffix: string;
    language: string;
    filename: string;
    project: string;
    imports: string[];
    functions: string[];
    classes: string[];
    comments: string[];
    recentEdits: string[];
    cursorRules?: string;
}

export interface ProjectPatterns {
    namingConventions: string[];
    codeStyle: string[];
    commonImports: string[];
    frequentPatterns: string[];
}

export class ContextEngine {
    private maxContextLength: number = 4000;
    private projectPatterns: Map<string, ProjectPatterns> = new Map();

    constructor() {
        this.loadProjectPatterns();
    }

    async buildContext(document: vscode.TextDocument, position: vscode.Position): Promise<CodeContext> {
        const text = document.getText();
        const offset = document.offsetAt(position);

        // Get more context before cursor, less after
        const prefixLength = Math.floor(this.maxContextLength * 0.75);
        const suffixLength = Math.floor(this.maxContextLength * 0.25);

        const prefix = text.substring(Math.max(0, offset - prefixLength), offset);
        const suffix = text.substring(offset, Math.min(text.length, offset + suffixLength));

        const context: CodeContext = {
            prefix,
            suffix,
            language: document.languageId,
            filename: path.basename(document.uri.fsPath),
            project: this.getProjectName(document.uri),
            imports: this.extractImports(document),
            functions: this.extractFunctions(document),
            classes: this.extractClasses(document),
            comments: this.extractComments(document),
            recentEdits: await this.getRecentEdits(document.uri),
            cursorRules: await this.loadCursorRules(document.uri)
        };

        return context;
    }

    private async loadCursorRules(uri: vscode.Uri): Promise<string | undefined> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) return undefined;

        try {
            const rulesUri = vscode.Uri.joinPath(workspaceFolder.uri, '.cursorrules');
            // Check if file exists
            await vscode.workspace.fs.stat(rulesUri);
            const content = await vscode.workspace.fs.readFile(rulesUri);
            return new TextDecoder().decode(content);
        } catch {
            // Also try .cursorrules (no dot? no, dot is standard) or .rules
            try {
                const rulesUri = vscode.Uri.joinPath(workspaceFolder.uri, '.rules');
                await vscode.workspace.fs.stat(rulesUri);
                const content = await vscode.workspace.fs.readFile(rulesUri);
                return new TextDecoder().decode(content);
            } catch {
                return undefined;
            }
        }
    }

    private getProjectName(uri: vscode.Uri): string {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        return workspaceFolder ? workspaceFolder.name : 'unknown';
    }

    private extractImports(document: vscode.TextDocument): string[] {
        const text = document.getText();
        const imports: string[] = [];

        const patterns = {
            python: /^import\s+.*|^from\s+.*\s+import\s+.*/gm,
            javascript: /^import\s+.*|^const\s+.*=\s*require\(.*/gm,
            typescript: /^import\s+.*|^const\s+.*=\s*require\(.*/gm,
            java: /^import\s+.*;/gm,
            cpp: /^#include\s+.*/gm,
            go: /^import\s+(\([^)]*\)|".*")/gm,
            rust: /^use\s+.*;/gm
        };

        const pattern = patterns[document.languageId as keyof typeof patterns];
        if (pattern) {
            const matches = text.match(pattern);
            if (matches) {
                imports.push(...matches);
            }
        }

        return imports;
    }

    private extractFunctions(document: vscode.TextDocument): string[] {
        const text = document.getText();
        const functions: string[] = [];

        const patterns = {
            python: /^def\s+\w+\s*\([^)]*\):/gm,
            javascript: /^function\s+\w+\s*\([^)]*\)\s*{|^\w+\s*:\s*function\s*\([^)]*\)\s*{|^\w+\s*=\s*\([^)]*\)\s*=>/gm,
            typescript: /^function\s+\w+\s*\([^)]*\)\s*[:{]?|^\w+\s*\([^)]*\)\s*[:{]?|^\w+\s*:\s*\([^)]*\)\s*=>/gm,
            java: /^(?:public|private|protected)?\s+.*\s+\w+\s*\([^)]*\)\s*{/gm,
            cpp: /^\w+\s+\w+\s*\([^)]*\)\s*{/gm,
            go: /^func\s+\w+\s*\([^)]*\)/gm,
            rust: /^fn\s+\w+\s*\([^)]*\)/gm
        };

        const pattern = patterns[document.languageId as keyof typeof patterns];
        if (pattern) {
            const matches = text.match(pattern);
            if (matches) {
                functions.push(...matches);
            }
        }

        return functions;
    }

    private extractClasses(document: vscode.TextDocument): string[] {
        const text = document.getText();
        const classes: string[] = [];

        const patterns = {
            python: /^class\s+\w+/gm,
            javascript: /^class\s+\w+/gm,
            typescript: /^class\s+\w+/gm,
            java: /^(?:public|private|protected)?\s+class\s+\w+/gm,
            cpp: /^class\s+\w+/gm,
            go: /^type\s+\w+\s+struct/gm,
            rust: /^struct\s+\w+/gm
        };

        const pattern = patterns[document.languageId as keyof typeof patterns];
        if (pattern) {
            const matches = text.match(pattern);
            if (matches) {
                classes.push(...matches);
            }
        }

        return classes;
    }

    private extractComments(document: vscode.TextDocument): string[] {
        const text = document.getText();
        const comments: string[] = [];

        const patterns = {
            python: /#.*$/gm,
            javascript: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            typescript: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            java: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            cpp: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            go: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            rust: /\/\/.*$|\/\*[\s\S]*?\*\//gm
        };

        const pattern = patterns[document.languageId as keyof typeof patterns];
        if (pattern) {
            const matches = text.match(pattern);
            if (matches) {
                comments.push(...matches.filter(comment => comment.trim().length > 1));
            }
        }

        return comments;
    }

    private async getRecentEdits(_uri: vscode.Uri): Promise<string[]> {
        // TODO: Implement recent edits tracking
        return [];
    }

    async generatePrompt(context: CodeContext): Promise<string> {
        // Use Fill-In-The-Middle (FIM) format which is standard for code completion models
        // <PRE> prefix <SUF> suffix <MID>

        const fimPrefix = '<PRE>';
        const fimSuffix = '<SUF>';
        const fimMiddle = '<MID>';

        // Construct the prompt
        // We can inject some context before the prefix if needed (like file name, imports)

        let header = '';
        if (context.filename) {
            header += `// File: ${context.filename}\n`;
        }
        if (context.language) {
            header += `// Language: ${context.language}\n`;
        }
        
        // Inject System Prompts / Rules
        if (context.cursorRules) {
            header += `\n/* INSTRUCTIONS:\n${context.cursorRules}\n*/\n`;
        }

        if (context.imports && context.imports.length > 0) {
            header += `// Imports:\n${context.imports.join('\n')}\n`;
        }

        // Add imports if they are not in the prefix (e.g. from other files)
        // For now, we assume imports are in the file content

        const fullPrefix = header + context.prefix;

        return `${fimPrefix} ${fullPrefix} ${fimSuffix} ${context.suffix} ${fimMiddle}`;
    }

    private loadProjectPatterns(): void {
        // TODO: Load and analyze project patterns
    }

    async extractProjectPatterns(workspaceFolder: vscode.WorkspaceFolder): Promise<ProjectPatterns> {
        const patterns: ProjectPatterns = {
            namingConventions: [],
            codeStyle: [],
            commonImports: [],
            frequentPatterns: []
        };

        try {
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, '**/*.{js,ts,py,java,cpp,c,go,rs}'),
                '**/node_modules/**'
            );

            // Analyze files to extract patterns
            for (const file of files.slice(0, 50)) { // Limit to 50 files for performance
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    this.analyzeFileForPatterns(document, patterns);
                } catch (error) {
                    console.error(`Failed to analyze file ${file.fsPath}:`, error);
                }
            }

            this.projectPatterns.set(workspaceFolder.name, patterns);
        } catch (error) {
            console.error('Failed to extract project patterns:', error);
        }

        return patterns;
    }

    private analyzeFileForPatterns(document: vscode.TextDocument, patterns: ProjectPatterns): void {
        const text = document.getText();

        // Extract common imports
        const importMatches = text.match(/^import\s+.*$/gm);
        if (importMatches) {
            patterns.commonImports.push(...importMatches);
        }
    }

    analyzeComments(comments: string[]): { intent: string; requirements: string[] } {
        const intent = this.extractIntent(comments);
        const requirements = this.extractRequirements(comments);

        return { intent, requirements };
    }

    private extractIntent(comments: string[]): string {
        const commentText = comments.join(' ').toLowerCase();

        if (commentText.includes('create') || commentText.includes('implement')) {
            return 'create';
        } else if (commentText.includes('fix') || commentText.includes('bug')) {
            return 'fix';
        } else if (commentText.includes('refactor') || commentText.includes('improve')) {
            return 'refactor';
        } else if (commentText.includes('test')) {
            return 'test';
        }

        return 'complete';
    }

    private extractRequirements(comments: string[]): string[] {
        const requirements: string[] = [];

        comments.forEach(comment => {
            // Look for specific requirements in comments
            const patterns = [
                /should\s+(.+)/i,
                /must\s+(.+)/i,
                /need\s+to\s+(.+)/i,
                /require[sd]?\s+(.+)/i
            ];

            patterns.forEach(pattern => {
                const match = comment.match(pattern);
                if (match) {
                    requirements.push(match[1].trim());
                }
            });
        });

        return requirements;
    }
}
