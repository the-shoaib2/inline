import * as vscode from 'vscode';
import { LlamaInference } from '@intelligence/engines/llama-engine';
import { Logger } from '@platform/system/logger';

export type DocStyle = 'jsdoc' | 'tsdoc' | 'google' | 'numpy' | 'sphinx' | 'rustdoc' | 'godoc' | 'auto';

export interface DocGenerationOptions {
    style?: DocStyle;
    includeExamples?: boolean;
    includeParams?: boolean;
    includeReturns?: boolean;
    includeThrows?: boolean;
}

export interface GeneratedDoc {
    documentation: string;
    style: DocStyle;
    lineCount: number;
}

export class DocGenerator {
    private inference: LlamaInference;
    private logger: Logger;

    constructor(inference: LlamaInference) {
        this.inference = inference;
        this.logger = new Logger('DocGenerator');
    }

    /**
     * Detect documentation style based on language
     */
    private detectDocStyle(languageId: string): DocStyle {
        const styleMap: Record<string, DocStyle> = {
            'typescript': 'tsdoc',
            'javascript': 'jsdoc',
            'python': 'google',
            'rust': 'rustdoc',
            'go': 'godoc',
            'java': 'jsdoc'
        };

        return styleMap[languageId] || 'jsdoc';
    }

    /**
     * Generate documentation for a function or class
     */
    public async generateDocstring(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: DocGenerationOptions = {}
    ): Promise<GeneratedDoc> {
        const code = document.getText(range);
        const style = options.style === 'auto' || !options.style
            ? this.detectDocStyle(document.languageId)
            : options.style;

        this.logger.info(`Generating ${style} documentation`);

        const prompt = this.buildDocPrompt(code, style, document.languageId, options);
        
        try {
            const doc = await this.inference.generateCompletion(prompt, {
                maxTokens: 512,
                temperature: 0.2,
                stop: ['```\n', '\n\n\n']
            });

            const cleaned = this.cleanDocumentation(doc, style);
            const lineCount = cleaned.split('\n').length;

            return {
                documentation: cleaned,
                style,
                lineCount
            };
        } catch (error) {
            this.logger.error(`Documentation generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Build prompt for documentation generation
     */
    private buildDocPrompt(
        code: string,
        style: DocStyle,
        language: string,
        options: DocGenerationOptions
    ): string {
        const styleInstructions = this.getStyleInstructions(style);
        const exampleInstruction = options.includeExamples
            ? 'Include usage examples.'
            : '';

        return `Generate ${style} documentation for the following ${language} code.
${styleInstructions}
${exampleInstruction}

Code:
\`\`\`${language}
${code}
\`\`\`

Generate only the documentation comment (no code):`;
    }

    private getStyleInstructions(style: DocStyle): string {
        const instructions: Record<DocStyle, string> = {
            'jsdoc': 'Use JSDoc format with @param, @returns, @throws tags.',
            'tsdoc': 'Use TSDoc format with @param, @returns, @throws tags and TypeScript types.',
            'google': 'Use Google Python docstring format with Args:, Returns:, Raises: sections.',
            'numpy': 'Use NumPy docstring format with Parameters, Returns, Raises sections.',
            'sphinx': 'Use Sphinx format with :param, :returns, :raises: directives.',
            'rustdoc': 'Use Rust documentation comments with # Examples and # Panics sections.',
            'godoc': 'Use Go documentation format with simple descriptive comments.',
            'auto': ''
        };

        return instructions[style] || '';
    }

    /**
     * Clean generated documentation
     */
    private cleanDocumentation(doc: string, style: DocStyle): string {
        let cleaned = doc.trim();
        
        // Remove markdown code fences
        cleaned = cleaned.replace(/```[\w]*\n?/g, '');
        
        // Remove common LLM artifacts
        cleaned = cleaned.replace(/^(Here is the documentation:?|Documentation:)\s*/i, '');
        
        // Ensure proper comment format
        if (style === 'jsdoc' || style === 'tsdoc') {
            if (!cleaned.startsWith('/**')) {
                cleaned = '/**\n * ' + cleaned.replace(/\n/g, '\n * ') + '\n */';
            }
        } else if (style === 'google' || style === 'numpy' || style === 'sphinx') {
            if (!cleaned.startsWith('"""') && !cleaned.startsWith("'''")) {
                cleaned = '"""\n' + cleaned + '\n"""';
            }
        } else if (style === 'rustdoc') {
            if (!cleaned.startsWith('///')) {
                cleaned = cleaned.split('\n').map(line => '/// ' + line).join('\n');
            }
        }
        
        return cleaned;
    }

    /**
     * Generate documentation for entire file
     */
    public async documentFile(document: vscode.TextDocument, options: DocGenerationOptions = {}): Promise<string[]> {
        const style = options.style === 'auto' || !options.style
            ? this.detectDocStyle(document.languageId)
            : options.style;

        const text = document.getText();
        const functions = this.extractFunctions(text, document.languageId);
        
        const docs: string[] = [];

        for (const func of functions) {
            try {
                const result = await this.generateDocstring(
                    document,
                    new vscode.Range(
                        document.positionAt(func.start),
                        document.positionAt(func.end)
                    ),
                    options
                );
                docs.push(result.documentation);
            } catch (error) {
                this.logger.error(`Failed to document function: ${error}`);
            }
        }

        return docs;
    }

    /**
     * Extract function definitions from code
     */
    private extractFunctions(code: string, languageId: string): Array<{ start: number; end: number; name: string }> {
        const functions: Array<{ start: number; end: number; name: string }> = [];
        
        const patterns: Record<string, RegExp> = {
            'typescript': /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
            'javascript': /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
            'python': /def\s+(\w+)/g,
            'rust': /fn\s+(\w+)/g,
            'go': /func\s+(\w+)/g,
            'java': /(?:public|private|protected)\s+(?:static\s+)?[\w<>]+\s+(\w+)\s*\(/g
        };

        const pattern = patterns[languageId];
        if (!pattern) return functions;

        let match;
        while ((match = pattern.exec(code)) !== null) {
            functions.push({
                start: match.index,
                end: match.index + match[0].length,
                name: match[1]
            });
        }

        return functions;
    }

    /**
     * Generate README section from code
     */
    public async generateReadmeSection(
        title: string,
        code: string,
        languageId: string
    ): Promise<string> {
        const prompt = `Generate a README.md section titled "${title}" that explains the following ${languageId} code.
Include:
1. Brief description
2. Usage example
3. Key features or parameters

Code:
\`\`\`${languageId}
${code}
\`\`\`

README section in Markdown:`;

        try {
            const section = await this.inference.generateCompletion(prompt, {
                maxTokens: 512,
                temperature: 0.3
            });

            return section.trim();
        } catch (error) {
            this.logger.error(`README generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Generate API documentation
     */
    public async generateAPIDoc(
        className: string,
        methods: string[],
        languageId: string
    ): Promise<string> {
        const prompt = `Generate API documentation for the ${className} class in ${languageId}.

Methods:
${methods.join('\n')}

Generate comprehensive API documentation in Markdown format with:
1. Class description
2. Constructor documentation
3. Method documentation with parameters and return values
4. Usage examples

API Documentation:`;

        try {
            const apiDoc = await this.inference.generateCompletion(prompt, {
                maxTokens: 1024,
                temperature: 0.2
            });

            return apiDoc.trim();
        } catch (error) {
            this.logger.error(`API documentation generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Summarize function behavior
     */
    public async summarizeFunction(
        document: vscode.TextDocument,
        range: vscode.Range
    ): Promise<string> {
        const code = document.getText(range);
        
        const prompt = `Summarize what this ${document.languageId} function does in 1-2 sentences:

\`\`\`${document.languageId}
${code}
\`\`\`

Summary:`;

        try {
            const summary = await this.inference.generateCompletion(prompt, {
                maxTokens: 128,
                temperature: 0.2
            });

            return summary.trim();
        } catch (error) {
            this.logger.error(`Function summarization failed: ${error}`);
            throw error;
        }
    }

    /**
     * Document class purpose
     */
    public async documentClass(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: DocGenerationOptions = {}
    ): Promise<GeneratedDoc> {
        const code = document.getText(range);
        const style = options.style === 'auto' || !options.style
            ? this.detectDocStyle(document.languageId)
            : options.style;

        const prompt = `Generate ${style} documentation for this ${document.languageId} class.
Include:
1. Class purpose and responsibility
2. Key properties (if visible)
3. Usage example

Class code:
\`\`\`${document.languageId}
${code}
\`\`\`

Class documentation:`;

        try {
            const doc = await this.inference.generateCompletion(prompt, {
                maxTokens: 512,
                temperature: 0.2
            });

            const cleaned = this.cleanDocumentation(doc, style);
            const lineCount = cleaned.split('\n').length;

            return {
                documentation: cleaned,
                style,
                lineCount
            };
        } catch (error) {
            this.logger.error(`Class documentation failed: ${error}`);
            throw error;
        }
    }
}
