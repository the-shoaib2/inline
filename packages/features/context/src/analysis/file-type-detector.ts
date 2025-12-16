
import * as vscode from 'vscode';
import * as path from 'path';
import { ContextAnalysisStrategy } from '../strategies/context-analysis-strategy.interface';
import { ContextAnalysisRegistry } from '../context-analysis-registry';
// Strategies imported here only to register defaults (can be moved to package activation)
import { TypeScriptAnalysisStrategy } from '../strategies/typescript-analysis-strategy';
import { PythonAnalysisStrategy } from '../strategies/python-analysis-strategy';

/**
 * File type classification for smart context detection
 */
export enum FileType {
    SOURCE = 'source',           // Main implementation files
    TEST = 'test',               // Test files
    INTERFACE = 'interface',     // Type definitions, interfaces
    CONFIG = 'config',           // Configuration files
    DOCUMENTATION = 'docs',      // README, docs
    BUILD = 'build',             // Build scripts, package.json
    STYLE = 'style',             // CSS, SCSS
    DATA = 'data',               // JSON, YAML data files
    UNKNOWN = 'unknown'          // Unknown file type
}

/**
 * Code type classification for context strategies
 */
export enum CodeType {
    CLASS = 'class',
    FUNCTION = 'function',
    INTERFACE = 'interface',
    TYPE = 'type',
    CONSTANT = 'constant',
    ENUM = 'enum',
    MODULE = 'module',
    COMPONENT = 'component',     // React/Vue components
    HOOK = 'hook',               // React hooks
    DIRECTIVE = 'directive',     // Angular directives
    SERVICE = 'service'          // Services/providers
}

/**
 * File type detection result with confidence score
 */
export interface FileTypeResult {
    fileType: FileType;
    confidence: number;  // 0-1
    reasons: string[];   // Why this type was detected
}

/**
 * Intelligent file type detector for smart context detection.
 */
export class FileTypeDetector {
    private registry: ContextAnalysisRegistry;

    constructor() {
        this.registry = ContextAnalysisRegistry.getInstance();
        this.registerDefaultStrategies();
    }

    private registerDefaultStrategies() {
        // Register default strategies safely
        this.registry.register(new TypeScriptAnalysisStrategy());
        this.registry.register(new PythonAnalysisStrategy());
    }
    
    private getStrategy(languageId: string): ContextAnalysisStrategy {
        const strategy = this.registry.getStrategy(languageId);
        if (strategy) {
            return strategy;
        }
        return this.registry.getStrategy('typescript') || new TypeScriptAnalysisStrategy();
    }

    /**
     * Detect file type from URI and optional content
     */
    detectFileType(uri: vscode.Uri, document?: vscode.TextDocument): FileTypeResult {
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName);
        
        const reasons: string[] = [];
        let fileType = FileType.UNKNOWN;
        let confidence = 0.5;
        
        // 1. Test file detection (highest priority)
        if (this.isTestFile(uri)) {
            fileType = FileType.TEST;
            confidence = 0.95;
            reasons.push('Test file pattern detected');
            return { fileType, confidence, reasons };
        }
        
        // 2. Type definition files
        if (ext === '.d.ts') {
            fileType = FileType.INTERFACE;
            confidence = 1.0;
            reasons.push('TypeScript declaration file');
            return { fileType, confidence, reasons };
        }
        
        // 3. Configuration files
        if (this.isConfigFile(fileName)) {
            fileType = FileType.CONFIG;
            confidence = 0.95;
            reasons.push('Configuration file pattern');
            return { fileType, confidence, reasons };
        }
        
        // 4. Documentation files
        if (this.isDocumentationFile(fileName)) {
            fileType = FileType.DOCUMENTATION;
            confidence = 0.95;
            reasons.push('Documentation file');
            return { fileType, confidence, reasons };
        }
        
        // 5. Build files
        if (this.isBuildFile(fileName)) {
            fileType = FileType.BUILD;
            confidence = 0.9;
            reasons.push('Build/package file');
            return { fileType, confidence, reasons };
        }
        
        // 6. Style files
        if (this.isStyleFile(ext)) {
            fileType = FileType.STYLE;
            confidence = 1.0;
            reasons.push('Style file extension');
            return { fileType, confidence, reasons };
        }
        
        // 7. Data files
        if (this.isDataFile(ext)) {
            fileType = FileType.DATA;
            confidence = 0.9;
            reasons.push('Data file extension');
            return { fileType, confidence, reasons };
        }
        
        // 8. Content-based detection (if document provided)
        if (document) {
            const contentResult = this.detectFromContent(document);
            if (contentResult.confidence > confidence) {
                return contentResult;
            }
        }
        
        // 9. Default to source file
        if (this.isSourceFile(ext)) {
            fileType = FileType.SOURCE;
            confidence = 0.8;
            reasons.push('Source code file extension');
        }
        
        return { fileType, confidence, reasons };
    }
    
    /**
     * Detect if file is a test file
     */
    isTestFile(uri: vscode.Uri): boolean {
        const filePath = uri.fsPath.toLowerCase();
        const fileName = path.basename(filePath);
        
        // Test file patterns
        const testPatterns = [
            /\.test\.(ts|tsx|js|jsx|py|java|go|rs)$/,
            /\.spec\.(ts|tsx|js|jsx|py|java|go|rs)$/,
            /_test\.(ts|tsx|js|jsx|py|java|go|rs)$/,
            /_spec\.(ts|tsx|js|jsx|py|java|go|rs)$/,
            /test_.*\.(py|rb)$/,
        ];
        
        // Test directory patterns
        const testDirs = [
            '/__tests__/',
            '/tests/',
            '/test/',
            '/spec/',
            '/__test__/',
            '/e2e/',
            '/integration/'
        ];
        
        if (testPatterns.some(pattern => pattern.test(fileName))) {
            return true;
        }
        
        if (testDirs.some(dir => filePath.includes(dir) || filePath.includes(dir.replace(/\//g, '\\')))) {
            return true;
        }
        
        return false;
    }
    
    // ... getRelatedSourceFile, getRelatedTestFile (unchanged for now or move to separate util)

    /**
     * Detect code types present in document
     */
    detectCodeTypes(document: vscode.TextDocument): CodeType[] {
        return this.getStrategy(document.languageId).detectCodeTypes(document.getText());
    }
    
    /**
     * Detect file type from content analysis
     */
    private detectFromContent(document: vscode.TextDocument): FileTypeResult {
        const text = document.getText();
        const strategy = this.getStrategy(document.languageId);
        const reasons: string[] = [];
        
        const imports = strategy.extractImports(text);
        
        // Check for test framework imports
        const testFrameworks = [
            'jest', 'vitest', 'mocha', 'chai', 'jasmine',
            'pytest', 'unittest', 'testing',
            'junit', 'testng'
        ];
        
        // Check extracted imports (cleaner)
        if (imports.some(i => testFrameworks.some(fw => i.path.includes(fw) || i.symbols.some(s => s.toLowerCase().includes(fw))))) {
             reasons.push('Test framework import detected');
             return { fileType: FileType.TEST, confidence: 0.9, reasons };
        }
        
        // Check for specific tokens in text (fallback)
        if (testFrameworks.some(fw => text.includes(`from '${fw}'`) || text.includes(`import ${fw}`))) {
            reasons.push('Test framework token detected');
            return { fileType: FileType.TEST, confidence: 0.9, reasons };
        }
        
        // Check for type-only content
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const codeTypes = strategy.detectCodeTypes(text);
        
        // If mostly interfaces/types
        if (codeTypes.includes(CodeType.INTERFACE) && !codeTypes.includes(CodeType.FUNCTION) && !codeTypes.includes(CodeType.CLASS)) {
             // Heuristic: if file has interfaces/types but no logical blocks, likely interface file
             // Roughly check line counts
             const typeLines = lines.filter(l => 
                /^\s*(export\s+)?(interface|type|enum)\s+/.test(l) ||
                /^\s*import\s+type/.test(l)
            );
            if (typeLines.length > lines.length * 0.7) {
                reasons.push('Mostly type definitions');
                return { fileType: FileType.INTERFACE, confidence: 0.85, reasons };
            }
        }
        
        return { fileType: FileType.SOURCE, confidence: 0.6, reasons: ['Default source file'] };
    }
    
    /**
     * Check if file is a configuration file
     */
    private isConfigFile(fileName: string): boolean {
        const configPatterns = [
            /\.config\.(js|ts|json|yaml|yml)$/,
            /^(tsconfig|jsconfig|webpack|vite|rollup|babel|eslint|prettier)\..*$/,
            /^\.(eslintrc|prettierrc|babelrc|editorconfig|env|gitignore)$/,
            /^(package|composer|Cargo|go\.mod|requirements)\..*$/,
        ];
        
        return configPatterns.some(pattern => pattern.test(fileName.toLowerCase()));
    }
    
    // ... isDocumentationFile, isBuildFile, isStyleFile, isDataFile, isSourceFile (keep unchanged)
    
    private isDocumentationFile(fileName: string): boolean {
        const docPatterns = [/^README/i, /^CHANGELOG/i, /^CONTRIBUTING/i, /^LICENSE/i, /\.md$/, /\.mdx$/, /\.rst$/, /\.adoc$/];
        return docPatterns.some(pattern => pattern.test(fileName));
    }
    
    private isBuildFile(fileName: string): boolean {
        const buildFiles = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Makefile', 'Dockerfile', 'docker-compose.yml', 'turbo.json'];
        return buildFiles.includes(fileName.toLowerCase());
    }
    
    private isStyleFile(ext: string): boolean {
        return ['.css', '.scss', '.sass', '.less', '.styl'].includes(ext.toLowerCase());
    }
    
    private isDataFile(ext: string): boolean {
        return ['.json', '.yaml', '.yml', '.xml', '.toml', '.ini'].includes(ext.toLowerCase());
    }
    
    private isSourceFile(ext: string): boolean {
        return ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h', '.hpp', '.rb', '.php', '.swift', '.kt'].includes(ext.toLowerCase());
    }
}
