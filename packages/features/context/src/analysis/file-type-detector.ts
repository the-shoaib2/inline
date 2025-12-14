import * as vscode from 'vscode';
import * as path from 'path';

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
 * 
 * Detects file types based on:
 * - File path patterns
 * - File naming conventions
 * - Content analysis
 * - Language-specific patterns
 */
export class FileTypeDetector {
    
    /**
     * Detect file type from URI and optional content
     */
    detectFileType(uri: vscode.Uri, document?: vscode.TextDocument): FileTypeResult {
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName);
        const dirName = path.basename(path.dirname(filePath));
        
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
        const dirName = path.basename(path.dirname(filePath));
        
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
            '__tests__',
            'tests',
            'test',
            'spec',
            '__test__',
            'e2e',
            'integration'
        ];
        
        // Check file name patterns
        if (testPatterns.some(pattern => pattern.test(fileName))) {
            return true;
        }
        
        // Check directory patterns
        if (testDirs.some(dir => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`))) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get related source file for a test file
     */
    getRelatedSourceFile(testFile: vscode.Uri): vscode.Uri | null {
        const testPath = testFile.fsPath;
        const fileName = path.basename(testPath);
        
        // Remove test suffixes
        let sourceName = fileName
            .replace(/\.test\.(ts|tsx|js|jsx|py|java|go|rs)$/, '.$1')
            .replace(/\.spec\.(ts|tsx|js|jsx|py|java|go|rs)$/, '.$1')
            .replace(/_test\.(ts|tsx|js|jsx|py|java|go|rs)$/, '.$1')
            .replace(/_spec\.(ts|tsx|js|jsx|py|java|go|rs)$/, '.$1')
            .replace(/test_(.*)/, '$1');
        
        // Try different source locations
        const testDir = path.dirname(testPath);
        const possiblePaths = [
            // Same directory
            path.join(testDir, sourceName),
            // Parent directory (if in __tests__)
            path.join(testDir, '..', sourceName),
            // src directory
            path.join(testDir, '..', 'src', sourceName),
            // Remove test directory from path
            testPath.replace(/\/(test|tests|__tests__|spec|e2e|integration)\//, '/src/').replace(/\.test\./, '.').replace(/\.spec\./, '.')
        ];
        
        // Return first existing file (would need actual file system check)
        // For now, return most likely candidate
        return vscode.Uri.file(possiblePaths[0]);
    }
    
    /**
     * Get related test file for a source file
     */
    getRelatedTestFile(sourceFile: vscode.Uri): vscode.Uri | null {
        const sourcePath = sourceFile.fsPath;
        const ext = path.extname(sourcePath);
        const baseName = path.basename(sourcePath, ext);
        const sourceDir = path.dirname(sourcePath);
        
        // Common test file patterns
        const testPatterns = [
            `${baseName}.test${ext}`,
            `${baseName}.spec${ext}`,
            `${baseName}_test${ext}`,
        ];
        
        // Common test directories
        const testDirs = [
            path.join(sourceDir, '__tests__'),
            path.join(sourceDir, '..', 'test'),
            path.join(sourceDir, '..', 'tests'),
            path.join(sourceDir, '..', '__tests__'),
        ];
        
        // Try patterns in current directory first
        for (const pattern of testPatterns) {
            const testPath = path.join(sourceDir, pattern);
            // Would check if file exists
            return vscode.Uri.file(testPath);
        }
        
        // Try test directories
        for (const testDir of testDirs) {
            for (const pattern of testPatterns) {
                const testPath = path.join(testDir, pattern);
                return vscode.Uri.file(testPath);
            }
        }
        
        return null;
    }
    
    /**
     * Detect code types present in document
     */
    detectCodeTypes(document: vscode.TextDocument): CodeType[] {
        const text = document.getText();
        const language = document.languageId;
        const codeTypes: Set<CodeType> = new Set();
        
        // TypeScript/JavaScript patterns
        if (language === 'typescript' || language === 'javascript' || language === 'typescriptreact' || language === 'javascriptreact') {
            if (/\bclass\s+\w+/.test(text)) codeTypes.add(CodeType.CLASS);
            if (/\bfunction\s+\w+/.test(text) || /const\s+\w+\s*=\s*\([^)]*\)\s*=>/.test(text)) {
                codeTypes.add(CodeType.FUNCTION);
            }
            if (/\binterface\s+\w+/.test(text)) codeTypes.add(CodeType.INTERFACE);
            if (/\btype\s+\w+\s*=/.test(text)) codeTypes.add(CodeType.TYPE);
            if (/\benum\s+\w+/.test(text)) codeTypes.add(CodeType.ENUM);
            if (/\bconst\s+[A-Z_]+\s*=/.test(text)) codeTypes.add(CodeType.CONSTANT);
            
            // React patterns
            if (/React\.FC|FunctionComponent|React\.Component/.test(text) || 
                /export\s+(default\s+)?function\s+[A-Z]\w*/.test(text)) {
                codeTypes.add(CodeType.COMPONENT);
            }
            if (/\buse[A-Z]\w*/.test(text)) codeTypes.add(CodeType.HOOK);
        }
        
        // Python patterns
        if (language === 'python') {
            if (/\bclass\s+\w+/.test(text)) codeTypes.add(CodeType.CLASS);
            if (/\bdef\s+\w+/.test(text)) codeTypes.add(CodeType.FUNCTION);
            if (/^[A-Z_]+\s*=/.test(text)) codeTypes.add(CodeType.CONSTANT);
        }
        
        // Java patterns
        if (language === 'java') {
            if (/\bclass\s+\w+/.test(text)) codeTypes.add(CodeType.CLASS);
            if (/\binterface\s+\w+/.test(text)) codeTypes.add(CodeType.INTERFACE);
            if (/\benum\s+\w+/.test(text)) codeTypes.add(CodeType.ENUM);
            if (/(public|private|protected)\s+\w+\s+\w+\s*\(/.test(text)) {
                codeTypes.add(CodeType.FUNCTION);
            }
        }
        
        // Go patterns
        if (language === 'go') {
            if (/\btype\s+\w+\s+struct/.test(text)) codeTypes.add(CodeType.CLASS);
            if (/\btype\s+\w+\s+interface/.test(text)) codeTypes.add(CodeType.INTERFACE);
            if (/\bfunc\s+\w+/.test(text)) codeTypes.add(CodeType.FUNCTION);
            if (/\bconst\s+[A-Z]/.test(text)) codeTypes.add(CodeType.CONSTANT);
        }
        
        return Array.from(codeTypes);
    }
    
    /**
     * Detect file type from content analysis
     */
    private detectFromContent(document: vscode.TextDocument): FileTypeResult {
        const text = document.getText();
        const reasons: string[] = [];
        
        // Check for test framework imports
        const testFrameworks = [
            'jest', 'vitest', 'mocha', 'chai', 'jasmine',
            'pytest', 'unittest', 'testing',
            'junit', 'testng',
            'testing/quick'
        ];
        
        if (testFrameworks.some(fw => text.includes(`from '${fw}'`) || text.includes(`from "${fw}"`) || 
                                       text.includes(`import ${fw}`) || text.includes(`require('${fw}')`))) {
            reasons.push('Test framework import detected');
            return { fileType: FileType.TEST, confidence: 0.9, reasons };
        }
        
        // Check for type-only content
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const typeLines = lines.filter(l => 
            /^\s*(export\s+)?(interface|type|enum)\s+/.test(l) ||
            /^\s*import\s+type/.test(l)
        );
        
        if (typeLines.length > lines.length * 0.7) {
            reasons.push('Mostly type definitions');
            return { fileType: FileType.INTERFACE, confidence: 0.85, reasons };
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
    
    /**
     * Check if file is documentation
     */
    private isDocumentationFile(fileName: string): boolean {
        const docPatterns = [
            /^README/i,
            /^CHANGELOG/i,
            /^CONTRIBUTING/i,
            /^LICENSE/i,
            /\.md$/,
            /\.mdx$/,
            /\.rst$/,
            /\.adoc$/,
        ];
        
        return docPatterns.some(pattern => pattern.test(fileName));
    }
    
    /**
     * Check if file is a build file
     */
    private isBuildFile(fileName: string): boolean {
        const buildFiles = [
            'package.json',
            'package-lock.json',
            'yarn.lock',
            'pnpm-lock.yaml',
            'Makefile',
            'Dockerfile',
            'docker-compose.yml',
            'turbo.json',
        ];
        
        return buildFiles.includes(fileName.toLowerCase());
    }
    
    /**
     * Check if file is a style file
     */
    private isStyleFile(ext: string): boolean {
        const styleExts = ['.css', '.scss', '.sass', '.less', '.styl'];
        return styleExts.includes(ext.toLowerCase());
    }
    
    /**
     * Check if file is a data file
     */
    private isDataFile(ext: string): boolean {
        const dataExts = ['.json', '.yaml', '.yml', '.xml', '.toml', '.ini'];
        return dataExts.includes(ext.toLowerCase());
    }
    
    /**
     * Check if file is a source code file
     */
    private isSourceFile(ext: string): boolean {
        const sourceExts = [
            '.ts', '.tsx', '.js', '.jsx',
            '.py', '.java', '.go', '.rs',
            '.c', '.cpp', '.h', '.hpp',
            '.rb', '.php', '.swift', '.kt'
        ];
        return sourceExts.includes(ext.toLowerCase());
    }
}
