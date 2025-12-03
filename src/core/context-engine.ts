import * as vscode from 'vscode';
import * as fs from 'fs';
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
        
        const prefix = text.substring(Math.max(0, offset - this.maxContextLength), offset);
        const suffix = text.substring(offset, Math.min(text.length, offset + this.maxContextLength));

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
            recentEdits: await this.getRecentEdits(document.uri)
        };

        return context;
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
            cpp: /^#include\s+.*/gm
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
            java: /^public\s+.*\s+\w+\s*\([^)]*\)\s*{|^private\s+.*\s+\w+\s*\([^)]*\)\s*{|^protected\s+.*\s+\w+\s*\([^)]*\)\s*{|^\w+\s*\([^)]*\)\s*{/gm,
            cpp: /^\w+\s+\w+\s*\([^)]*\)\s*{/gm
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
            java: /^public\s+class\s+\w+|^private\s+class\s+\w+|^protected\s+class\s+\w+/gm,
            cpp: /^class\s+\w+/gm
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
            cpp: /\/\/.*$|\/\*[\s\S]*?\*\//gm
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

    private async getRecentEdits(uri: vscode.Uri): Promise<string[]> {
        // TODO: Implement recent edits tracking
        return [];
    }

    async generatePrompt(context: CodeContext): Promise<string> {
        const patterns = this.projectPatterns.get(context.project);
        
        let prompt = `You are an AI coding assistant providing code completions for ${context.language}.\n\n`;
        
        // Add project context
        if (patterns) {
            prompt += `Project: ${context.project}\n`;
            if (patterns.codeStyle.length > 0) {
                prompt += `Code style: ${patterns.codeStyle.join(', ')}\n`;
            }
            if (patterns.commonImports.length > 0) {
                prompt += `Common imports: ${patterns.commonImports.join(', ')}\n`;
            }
        }

        // Add file context
        prompt += `\nFile: ${context.filename}\n`;
        prompt += `Language: ${context.language}\n\n`;

        // Add imports
        if (context.imports.length > 0) {
            prompt += `Imports:\n${context.imports.join('\n')}\n\n`;
        }

        // Add functions and classes
        if (context.functions.length > 0) {
            prompt += `Functions in this file:\n${context.functions.join('\n')}\n\n`;
        }

        if (context.classes.length > 0) {
            prompt += `Classes in this file:\n${context.classes.join('\n')}\n\n`;
        }

        // Add comments for context
        const relevantComments = context.comments.filter(comment => 
            comment.toLowerCase().includes('todo') || 
            comment.toLowerCase().includes('fix') ||
            comment.toLowerCase().includes('implement') ||
            comment.toLowerCase().includes('create')
        );

        if (relevantComments.length > 0) {
            prompt += `Relevant comments:\n${relevantComments.join('\n')}\n\n`;
        }

        // Add code context
        prompt += `Code context:\n${context.prefix}\n\n`;
        prompt += `Complete the code after the cursor:\n`;

        return prompt;
    }

    private loadProjectPatterns(): void {
        // TODO: Load and analyze project patterns
        // This would involve analyzing the codebase to identify patterns
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
                new vscode.RelativePattern(workspaceFolder, '**/*.{js,ts,py,java,cpp,c}'),
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

        // TODO: Add more pattern analysis logic
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
