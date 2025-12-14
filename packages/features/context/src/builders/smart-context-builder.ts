import * as vscode from 'vscode';
import { CodeContext } from '../context-engine';
import { FileTypeDetector, FileType, CodeType } from '../analysis/file-type-detector';
import { FileRelationshipMapper, FileRelationship, RelationshipType } from '../analysis/file-relationship-mapper';

/**
 * Context for a single file with metadata
 */
export interface FileContext {
    uri: vscode.Uri;
    fileType: FileType;
    relevance: number;      // 0-1, how relevant to current context
    relationship?: RelationshipType;
    content: {
        imports: string[];
        exports: string[];
        classes: string[];
        functions: string[];
        types: string[];
        summary?: string;   // Brief summary of file purpose
    };
}

/**
 * Context for a class with metadata
 */
export interface ClassContext {
    name: string;
    extends?: string;
    implements?: string[];
    methods: string[];
    properties: string[];
    location: vscode.Location;
    relevance: number;
}

/**
 * Context for a function with metadata
 */
export interface FunctionContext {
    name: string;
    parameters: string[];
    returnType?: string;
    location: vscode.Location;
    relevance: number;
}

/**
 * Context for an interface/type with metadata
 */
export interface InterfaceContext {
    name: string;
    properties: string[];
    extends?: string[];
    location: vscode.Location;
    relevance: number;
}

/**
 * Enhanced smart context with proper organization
 */
export interface SmartContext extends CodeContext {
    // File organization
    currentFile: FileContext;
    relatedFiles: FileContext[];
    testFiles: FileContext[];
    typeDefinitions: FileContext[];
    
    // Code organization (renamed to avoid conflicts with CodeContext)
    extractedClasses: ClassContext[];
    extractedFunctions: FunctionContext[];
    extractedInterfaces: InterfaceContext[];
    
    // Metadata
    fileType: FileType;
    codeTypes: CodeType[];
    relationships: FileRelationship[];
    
    // Quality metrics
    contextQuality: number;  // 0-1, how good is this context
    completeness: number;    // 0-1, how complete is this context
}

/**
 * Prioritized smart context for token-limited scenarios
 */
export interface PrioritizedSmartContext {
    essential: {
        currentFile: FileContext;
        primaryRelated: FileContext[];
    };
    important: {
        classes: ClassContext[];
        functions: FunctionContext[];
        types: InterfaceContext[];
    };
    optional: {
        testFiles: FileContext[];
        siblingFiles: FileContext[];
        documentation: string[];
    };
    totalTokens: number;
    estimatedTokens: {
        essential: number;
        important: number;
        optional: number;
    };
}

/**
 * Builds smart context with proper file and code type separation.
 * 
 * Features:
 * - File type detection and classification
 * - Relationship mapping and prioritization
 * - Code type extraction and organization
 * - Context quality scoring
 */
export class SmartContextBuilder {
    private fileTypeDetector: FileTypeDetector;
    private relationshipMapper: FileRelationshipMapper;
    
    constructor() {
        this.fileTypeDetector = new FileTypeDetector();
        this.relationshipMapper = new FileRelationshipMapper();
    }
    
    /**
     * Build comprehensive smart context for current position
     */
    async buildSmartContext(
        document: vscode.TextDocument,
        position: vscode.Position,
        baseContext: CodeContext
    ): Promise<SmartContext> {
        const uri = document.uri;
        
        // 1. Detect file type and code types
        const fileTypeResult = this.fileTypeDetector.detectFileType(uri, document);
        const codeTypes = this.fileTypeDetector.detectCodeTypes(document);
        
        // 2. Build current file context
        const currentFile = await this.buildFileContext(document, uri, fileTypeResult.fileType, 1.0);
        
        // 3. Find related files
        const relationships = await this.relationshipMapper.findRelatedFiles(uri, 10);
        
        // 4. Extract context from related files
        const relatedFileContexts = await this.extractRelatedFileContext(relationships);
        
        // 5. Separate by file type
        const testFiles = relatedFileContexts.filter(fc => fc.fileType === FileType.TEST);
        const typeDefinitions = relatedFileContexts.filter(fc => fc.fileType === FileType.INTERFACE);
        const sourceFiles = relatedFileContexts.filter(fc => 
            fc.fileType === FileType.SOURCE && fc !== currentFile
        );
        
        // 6. Extract code structures
        const classes = await this.extractClasses(document, position);
        const functions = await this.extractFunctions(document, position);
        const interfaces = await this.extractInterfaces(document, position);
        
        // 7. Calculate quality metrics
        const contextQuality = this.calculateContextQuality(
            currentFile,
            relatedFileContexts,
            classes,
            functions,
            interfaces
        );
        
        const completeness = this.calculateCompleteness(
            fileTypeResult.fileType,
            relationships,
            codeTypes
        );
        
        // 8. Build smart context
        const smartContext: SmartContext = {
            ...baseContext,
            currentFile,
            relatedFiles: sourceFiles,
            testFiles,
            typeDefinitions,
            extractedClasses: classes,
            extractedFunctions: functions,
            extractedInterfaces: interfaces,
            fileType: fileTypeResult.fileType,
            codeTypes,
            relationships,
            contextQuality,
            completeness
        };
        
        return smartContext;
    }
    
    /**
     * Extract context from related files
     */
    async extractRelatedFileContext(
        relationships: FileRelationship[]
    ): Promise<FileContext[]> {
        const contexts: FileContext[] = [];
        
        for (const rel of relationships) {
            try {
                const document = await vscode.workspace.openTextDocument(rel.file);
                const fileTypeResult = this.fileTypeDetector.detectFileType(rel.file, document);
                
                const fileContext = await this.buildFileContext(
                    document,
                    rel.file,
                    fileTypeResult.fileType,
                    rel.strength,
                    rel.relationship
                );
                
                contexts.push(fileContext);
            } catch (error) {
                // Skip files that can't be opened
                continue;
            }
        }
        
        return contexts;
    }
    
    /**
     * Prioritize context for token-limited scenarios
     */
    prioritizeContext(
        context: SmartContext,
        maxTokens: number
    ): PrioritizedSmartContext {
        // Estimate tokens for each section
        const essentialTokens = this.estimateFileContextTokens(context.currentFile) +
                               context.relatedFiles.slice(0, 2).reduce((sum, fc) => 
                                   sum + this.estimateFileContextTokens(fc), 0);
        
        const importantTokens = context.extractedClasses.slice(0, 5).reduce((sum, c) => 
                                   sum + this.estimateClassTokens(c), 0) +
                               context.extractedFunctions.slice(0, 5).reduce((sum, f) => 
                                   sum + this.estimateFunctionTokens(f), 0);
        
        const optionalTokens = context.testFiles.reduce((sum, fc) => 
                                  sum + this.estimateFileContextTokens(fc), 0);
        
        // Build prioritized context
        const prioritized: PrioritizedSmartContext = {
            essential: {
                currentFile: context.currentFile,
                primaryRelated: context.relatedFiles.slice(0, 2)
            },
            important: {
                classes: context.extractedClasses.slice(0, 5),
                functions: context.extractedFunctions.slice(0, 5),
                types: context.extractedInterfaces.slice(0, 5)
            },
            optional: {
                testFiles: context.testFiles,
                siblingFiles: context.relatedFiles.slice(2),
                documentation: []
            },
            totalTokens: essentialTokens + importantTokens + optionalTokens,
            estimatedTokens: {
                essential: essentialTokens,
                important: importantTokens,
                optional: optionalTokens
            }
        };
        
        // Trim if exceeds max tokens
        if (prioritized.totalTokens > maxTokens) {
            // Remove optional first
            if (essentialTokens + importantTokens > maxTokens) {
                // Remove some important items
                const tokensToRemove = (essentialTokens + importantTokens) - maxTokens;
                // Trim functions and classes proportionally
                // (simplified - would need more sophisticated logic)
            }
            prioritized.optional = { testFiles: [], siblingFiles: [], documentation: [] };
        }
        
        return prioritized;
    }
    
    /**
     * Build file context from document
     */
    private async buildFileContext(
        document: vscode.TextDocument,
        uri: vscode.Uri,
        fileType: FileType,
        relevance: number,
        relationship?: RelationshipType
    ): Promise<FileContext> {
        const text = document.getText();
        
        return {
            uri,
            fileType,
            relevance,
            relationship,
            content: {
                imports: this.extractImportStatements(text, document.languageId),
                exports: this.extractExportStatements(text, document.languageId),
                classes: this.extractClassNames(text, document.languageId),
                functions: this.extractFunctionNames(text, document.languageId),
                types: this.extractTypeNames(text, document.languageId),
                summary: this.generateFileSummary(document)
            }
        };
    }
    
    /**
     * Extract classes with context
     */
    private async extractClasses(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<ClassContext[]> {
        const text = document.getText();
        const language = document.languageId;
        const classes: ClassContext[] = [];
        
        if (language === 'typescript' || language === 'javascript' || 
            language === 'typescriptreact' || language === 'javascriptreact') {
            const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{/g;
            let match;
            
            while ((match = classRegex.exec(text)) !== null) {
                const name = match[1];
                const extendsClass = match[2];
                const implementsInterfaces = match[3]?.split(',').map(i => i.trim());
                
                const classLine = text.substring(0, match.index).split('\n').length - 1;
                const location = new vscode.Location(
                    document.uri,
                    new vscode.Position(classLine, 0)
                );
                
                // Calculate relevance based on proximity to cursor
                const distance = Math.abs(classLine - position.line);
                const relevance = Math.max(0, 1 - (distance / 100));
                
                classes.push({
                    name,
                    extends: extendsClass,
                    implements: implementsInterfaces,
                    methods: [],  // Would extract methods
                    properties: [],  // Would extract properties
                    location,
                    relevance
                });
            }
        }
        
        return classes.sort((a, b) => b.relevance - a.relevance);
    }
    
    /**
     * Extract functions with context
     */
    private async extractFunctions(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<FunctionContext[]> {
        const text = document.getText();
        const language = document.languageId;
        const functions: FunctionContext[] = [];
        
        if (language === 'typescript' || language === 'javascript' ||
            language === 'typescriptreact' || language === 'javascriptreact') {
            // Function declarations
            const funcRegex = /function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\w+))?/g;
            let match;
            
            while ((match = funcRegex.exec(text)) !== null) {
                const name = match[1];
                const params = match[2].split(',').map(p => p.trim()).filter(p => p);
                const returnType = match[3];
                
                const funcLine = text.substring(0, match.index).split('\n').length - 1;
                const location = new vscode.Location(
                    document.uri,
                    new vscode.Position(funcLine, 0)
                );
                
                const distance = Math.abs(funcLine - position.line);
                const relevance = Math.max(0, 1 - (distance / 100));
                
                functions.push({
                    name,
                    parameters: params,
                    returnType,
                    location,
                    relevance
                });
            }
        }
        
        return functions.sort((a, b) => b.relevance - a.relevance);
    }
    
    /**
     * Extract interfaces with context
     */
    private async extractInterfaces(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<InterfaceContext[]> {
        const text = document.getText();
        const language = document.languageId;
        const interfaces: InterfaceContext[] = [];
        
        if (language === 'typescript' || language === 'typescriptreact') {
            const interfaceRegex = /interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*{/g;
            let match;
            
            while ((match = interfaceRegex.exec(text)) !== null) {
                const name = match[1];
                const extendsInterfaces = match[2]?.split(',').map(i => i.trim());
                
                const interfaceLine = text.substring(0, match.index).split('\n').length - 1;
                const location = new vscode.Location(
                    document.uri,
                    new vscode.Position(interfaceLine, 0)
                );
                
                const distance = Math.abs(interfaceLine - position.line);
                const relevance = Math.max(0, 1 - (distance / 100));
                
                interfaces.push({
                    name,
                    properties: [],  // Would extract properties
                    extends: extendsInterfaces,
                    location,
                    relevance
                });
            }
        }
        
        return interfaces.sort((a, b) => b.relevance - a.relevance);
    }
    
    /**
     * Calculate context quality score
     */
    private calculateContextQuality(
        currentFile: FileContext,
        relatedFiles: FileContext[],
        classes: ClassContext[],
        functions: FunctionContext[],
        interfaces: InterfaceContext[]
    ): number {
        let score = 0;
        
        // Current file completeness
        if (currentFile.content.imports.length > 0) score += 0.2;
        if (currentFile.content.classes.length > 0 || currentFile.content.functions.length > 0) score += 0.2;
        
        // Related files
        if (relatedFiles.length > 0) score += 0.2;
        if (relatedFiles.length >= 3) score += 0.1;
        
        // Code structures
        if (classes.length > 0) score += 0.1;
        if (functions.length > 0) score += 0.1;
        if (interfaces.length > 0) score += 0.1;
        
        return Math.min(score, 1.0);
    }
    
    /**
     * Calculate completeness score
     */
    private calculateCompleteness(
        fileType: FileType,
        relationships: FileRelationship[],
        codeTypes: CodeType[]
    ): number {
        let score = 0.5; // Base score
        
        // Has relationships
        if (relationships.length > 0) score += 0.2;
        if (relationships.length >= 5) score += 0.1;
        
        // Has code types
        if (codeTypes.length > 0) score += 0.1;
        if (codeTypes.length >= 3) score += 0.1;
        
        return Math.min(score, 1.0);
    }
    
    // Helper methods for extraction (simplified)
    private extractImportStatements(text: string, language: string): string[] {
        const imports: string[] = [];
        const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(text)) !== null) {
            imports.push(match[0]);
        }
        return imports.slice(0, 10); // Limit
    }
    
    private extractExportStatements(text: string, language: string): string[] {
        const exports: string[] = [];
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+(\w+)/g;
        let match;
        while ((match = exportRegex.exec(text)) !== null) {
            exports.push(match[1]);
        }
        return exports;
    }
    
    private extractClassNames(text: string, language: string): string[] {
        const classes: string[] = [];
        const classRegex = /class\s+(\w+)/g;
        let match;
        while ((match = classRegex.exec(text)) !== null) {
            classes.push(match[1]);
        }
        return classes;
    }
    
    private extractFunctionNames(text: string, language: string): string[] {
        const functions: string[] = [];
        const funcRegex = /function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
        let match;
        while ((match = funcRegex.exec(text)) !== null) {
            functions.push(match[1] || match[2]);
        }
        return functions.slice(0, 20);
    }
    
    private extractTypeNames(text: string, language: string): string[] {
        const types: string[] = [];
        const typeRegex = /(?:interface|type)\s+(\w+)/g;
        let match;
        while ((match = typeRegex.exec(text)) !== null) {
            types.push(match[1]);
        }
        return types;
    }
    
    private generateFileSummary(document: vscode.TextDocument): string {
        const text = document.getText();
        const lines = text.split('\n');
        
        // Look for file-level comment
        for (let i = 0; i < Math.min(10, lines.length); i++) {
            const line = lines[i].trim();
            if (line.startsWith('/**') || line.startsWith('/*') || line.startsWith('//')) {
                return line.replace(/^\/\*\*?|\*\/|\/\//g, '').trim();
            }
        }
        
        return `${document.languageId} file`;
    }
    
    // Token estimation helpers
    private estimateFileContextTokens(fc: FileContext): number {
        return fc.content.imports.length * 10 +
               fc.content.classes.length * 20 +
               fc.content.functions.length * 15;
    }
    
    private estimateClassTokens(c: ClassContext): number {
        return 50 + c.methods.length * 10 + c.properties.length * 5;
    }
    
    private estimateFunctionTokens(f: FunctionContext): number {
        return 30 + f.parameters.length * 5;
    }
}
