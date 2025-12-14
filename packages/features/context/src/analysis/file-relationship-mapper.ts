import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Type of relationship between files
 */
export enum RelationshipType {
    IMPORTS = 'imports',           // File A imports from File B
    IMPORTED_BY = 'imported_by',   // File A is imported by File B
    TEST_OF = 'test_of',           // File A tests File B
    TESTED_BY = 'tested_by',       // File A is tested by File B
    SIBLING = 'sibling',           // Same directory, similar purpose
    DEPENDENCY = 'dependency',     // Indirect dependency
    RELATED = 'related'            // Similar names/patterns
}

/**
 * Relationship between two files with metadata
 */
export interface FileRelationship {
    file: vscode.Uri;
    relationship: RelationshipType;
    strength: number;      // 0-1, how strongly related
    reason: string;        // Why they're related
    distance?: number;     // Graph distance (for dependencies)
}

/**
 * Import information extracted from a file
 */
interface ImportInfo {
    source: string;        // Import source (module name or path)
    isRelative: boolean;   // Is it a relative import
    resolvedPath?: string; // Resolved file path
}

/**
 * Maps and analyzes relationships between files in the workspace.
 * 
 * Features:
 * - Import graph building
 * - Relationship detection
 * - Strength calculation
 * - Caching for performance
 */
export class FileRelationshipMapper {
    private importGraph: Map<string, Set<string>> = new Map();
    private reverseImportGraph: Map<string, Set<string>> = new Map();
    private relationshipCache: Map<string, FileRelationship[]> = new Map();
    private cacheTimestamp: Map<string, number> = new Map();
    private readonly CACHE_TTL = 60000; // 1 minute
    
    /**
     * Find all files related to the given file
     */
    async findRelatedFiles(
        uri: vscode.Uri,
        maxFiles: number = 5
    ): Promise<FileRelationship[]> {
        const cacheKey = uri.toString();
        
        // Check cache
        if (this.isCacheValid(cacheKey)) {
            return this.relationshipCache.get(cacheKey)!.slice(0, maxFiles);
        }
        
        const relationships: FileRelationship[] = [];
        
        // 1. Find files this file imports
        const imports = await this.findImports(uri);
        for (const importUri of imports) {
            relationships.push({
                file: importUri,
                relationship: RelationshipType.IMPORTS,
                strength: 0.9,
                reason: 'Direct import'
            });
        }
        
        // 2. Find files that import this file
        const importers = await this.findImporters(uri);
        for (const importerUri of importers) {
            relationships.push({
                file: importerUri,
                relationship: RelationshipType.IMPORTED_BY,
                strength: 0.85,
                reason: 'Imported by this file'
            });
        }
        
        // 3. Find test relationships
        const testRelationships = await this.findTestRelationships(uri);
        relationships.push(...testRelationships);
        
        // 4. Find sibling files
        const siblings = await this.findSiblingFiles(uri);
        relationships.push(...siblings);
        
        // 5. Find related by name pattern
        const nameRelated = await this.findNameRelatedFiles(uri);
        relationships.push(...nameRelated);
        
        // Sort by strength and remove duplicates
        const uniqueRelationships = this.deduplicateRelationships(relationships);
        const sorted = uniqueRelationships.sort((a, b) => b.strength - a.strength);
        
        // Cache results
        this.relationshipCache.set(cacheKey, sorted);
        this.cacheTimestamp.set(cacheKey, Date.now());
        
        return sorted.slice(0, maxFiles);
    }
    
    /**
     * Build import graph for the workspace
     */
    async buildImportGraph(workspaceUri?: vscode.Uri): Promise<Map<string, string[]>> {
        const workspace = workspaceUri || vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!workspace) {
            return new Map();
        }
        
        // Find all source files
        const files = await vscode.workspace.findFiles(
            '**/*.{ts,tsx,js,jsx,py,java,go,rs}',
            '**/node_modules/**',
            1000
        );
        
        // Build graph
        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const imports = this.extractImports(document);
                const resolvedImports = await this.resolveImports(file, imports);
                
                const fileKey = file.toString();
                this.importGraph.set(fileKey, new Set(resolvedImports.map(i => i.toString())));
                
                // Build reverse graph
                for (const importUri of resolvedImports) {
                    const importKey = importUri.toString();
                    if (!this.reverseImportGraph.has(importKey)) {
                        this.reverseImportGraph.set(importKey, new Set());
                    }
                    this.reverseImportGraph.get(importKey)!.add(fileKey);
                }
            } catch (error) {
                // Skip files that can't be opened
                continue;
            }
        }
        
        // Convert to plain Map for return
        const result = new Map<string, string[]>();
        for (const [key, value] of this.importGraph) {
            result.set(key, Array.from(value));
        }
        
        return result;
    }
    
    /**
     * Find files that import the given file
     */
    async findImporters(uri: vscode.Uri): Promise<vscode.Uri[]> {
        const fileKey = uri.toString();
        
        // Build graph if not built
        if (this.reverseImportGraph.size === 0) {
            await this.buildImportGraph();
        }
        
        const importers = this.reverseImportGraph.get(fileKey);
        if (!importers) {
            return [];
        }
        
        return Array.from(importers).map(key => vscode.Uri.parse(key));
    }
    
    /**
     * Find files imported by the given file
     */
    async findImports(uri: vscode.Uri): Promise<vscode.Uri[]> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const imports = this.extractImports(document);
            return await this.resolveImports(uri, imports);
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Calculate relationship strength between two files
     */
    calculateRelationshipStrength(
        fileA: vscode.Uri,
        fileB: vscode.Uri
    ): number {
        let strength = 0;
        
        const pathA = fileA.fsPath;
        const pathB = fileB.fsPath;
        
        // Same directory = stronger relationship
        if (path.dirname(pathA) === path.dirname(pathB)) {
            strength += 0.3;
        }
        
        // Similar names = stronger relationship
        const nameA = path.basename(pathA, path.extname(pathA));
        const nameB = path.basename(pathB, path.extname(pathB));
        
        if (nameA === nameB) {
            strength += 0.4;
        } else if (nameA.includes(nameB) || nameB.includes(nameA)) {
            strength += 0.2;
        }
        
        // Direct import = strongest relationship
        const keyA = fileA.toString();
        const keyB = fileB.toString();
        
        if (this.importGraph.get(keyA)?.has(keyB)) {
            strength += 0.5;
        }
        
        return Math.min(strength, 1.0);
    }
    
    /**
     * Extract import statements from document
     */
    private extractImports(document: vscode.TextDocument): ImportInfo[] {
        const text = document.getText();
        const language = document.languageId;
        const imports: ImportInfo[] = [];
        
        if (language === 'typescript' || language === 'javascript' || 
            language === 'typescriptreact' || language === 'javascriptreact') {
            // ES6 imports
            const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
            let match;
            while ((match = importRegex.exec(text)) !== null) {
                imports.push({
                    source: match[1],
                    isRelative: match[1].startsWith('.') || match[1].startsWith('/')
                });
            }
            
            // Require statements
            const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
            while ((match = requireRegex.exec(text)) !== null) {
                imports.push({
                    source: match[1],
                    isRelative: match[1].startsWith('.') || match[1].startsWith('/')
                });
            }
        } else if (language === 'python') {
            // Python imports
            const importRegex = /^(?:from\s+([\w.]+)\s+)?import\s+([\w\s,*]+)/gm;
            let match;
            while ((match = importRegex.exec(text)) !== null) {
                const source = match[1] || match[2];
                imports.push({
                    source,
                    isRelative: source.startsWith('.')
                });
            }
        }
        
        return imports;
    }
    
    /**
     * Resolve import paths to actual file URIs
     */
    private async resolveImports(
        sourceFile: vscode.Uri,
        imports: ImportInfo[]
    ): Promise<vscode.Uri[]> {
        const resolved: vscode.Uri[] = [];
        const sourceDir = path.dirname(sourceFile.fsPath);
        const ext = path.extname(sourceFile.fsPath);
        
        for (const imp of imports) {
            if (!imp.isRelative) {
                // Skip node_modules imports for now
                continue;
            }
            
            // Resolve relative path
            let resolvedPath = path.resolve(sourceDir, imp.source);
            
            // Try with extension
            if (!path.extname(resolvedPath)) {
                resolvedPath += ext;
            }
            
            try {
                const uri = vscode.Uri.file(resolvedPath);
                // Check if file exists (would need actual check)
                resolved.push(uri);
            } catch (error) {
                continue;
            }
        }
        
        return resolved;
    }
    
    /**
     * Find test relationships (test <-> source)
     */
    private async findTestRelationships(uri: vscode.Uri): Promise<FileRelationship[]> {
        const relationships: FileRelationship[] = [];
        const filePath = uri.fsPath;
        
        // Check if this is a test file
        if (this.isTestFile(uri)) {
            const sourceFile = this.getRelatedSourceFile(uri);
            if (sourceFile) {
                relationships.push({
                    file: sourceFile,
                    relationship: RelationshipType.TEST_OF,
                    strength: 0.95,
                    reason: 'Source file for this test'
                });
            }
        } else {
            // Find test file for this source
            const testFile = this.getRelatedTestFile(uri);
            if (testFile) {
                relationships.push({
                    file: testFile,
                    relationship: RelationshipType.TESTED_BY,
                    strength: 0.9,
                    reason: 'Test file for this source'
                });
            }
        }
        
        return relationships;
    }
    
    /**
     * Find sibling files in the same directory
     */
    private async findSiblingFiles(uri: vscode.Uri): Promise<FileRelationship[]> {
        const relationships: FileRelationship[] = [];
        const dirPath = path.dirname(uri.fsPath);
        const fileName = path.basename(uri.fsPath);
        const baseName = path.basename(fileName, path.extname(fileName));
        
        try {
            const pattern = new vscode.RelativePattern(dirPath, '*.*');
            const files = await vscode.workspace.findFiles(pattern, null, 20);
            
            for (const file of files) {
                if (file.toString() === uri.toString()) continue;
                
                const siblingName = path.basename(file.fsPath);
                const siblingBase = path.basename(siblingName, path.extname(siblingName));
                
                // Check for related names
                if (siblingBase.includes(baseName) || baseName.includes(siblingBase)) {
                    relationships.push({
                        file,
                        relationship: RelationshipType.SIBLING,
                        strength: 0.6,
                        reason: 'Sibling file with similar name'
                    });
                } else {
                    relationships.push({
                        file,
                        relationship: RelationshipType.SIBLING,
                        strength: 0.4,
                        reason: 'File in same directory'
                    });
                }
            }
        } catch (error) {
            // Ignore errors
        }
        
        return relationships;
    }
    
    /**
     * Find files with related names
     */
    private async findNameRelatedFiles(uri: vscode.Uri): Promise<FileRelationship[]> {
        const relationships: FileRelationship[] = [];
        const fileName = path.basename(uri.fsPath);
        const baseName = path.basename(fileName, path.extname(fileName));
        
        // Search for files with similar names
        const searchPattern = `**/*${baseName}*.*`;
        
        try {
            const files = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 10);
            
            for (const file of files) {
                if (file.toString() === uri.toString()) continue;
                
                relationships.push({
                    file,
                    relationship: RelationshipType.RELATED,
                    strength: 0.5,
                    reason: 'Similar file name'
                });
            }
        } catch (error) {
            // Ignore errors
        }
        
        return relationships;
    }
    
    /**
     * Remove duplicate relationships
     */
    private deduplicateRelationships(relationships: FileRelationship[]): FileRelationship[] {
        const seen = new Map<string, FileRelationship>();
        
        for (const rel of relationships) {
            const key = rel.file.toString();
            const existing = seen.get(key);
            
            if (!existing || rel.strength > existing.strength) {
                seen.set(key, rel);
            }
        }
        
        return Array.from(seen.values());
    }
    
    /**
     * Check if cache is valid
     */
    private isCacheValid(key: string): boolean {
        const timestamp = this.cacheTimestamp.get(key);
        if (!timestamp) return false;
        
        return Date.now() - timestamp < this.CACHE_TTL;
    }
    
    /**
     * Clear cache
     */
    clearCache(): void {
        this.relationshipCache.clear();
        this.cacheTimestamp.clear();
    }
    
    /**
     * Helper: Check if file is a test file
     */
    private isTestFile(uri: vscode.Uri): boolean {
        const filePath = uri.fsPath.toLowerCase();
        return /\.(test|spec)\.(ts|tsx|js|jsx|py|java|go|rs)$/.test(filePath) ||
               filePath.includes('/__tests__/') ||
               filePath.includes('/test/') ||
               filePath.includes('/tests/');
    }
    
    /**
     * Helper: Get related source file for test
     */
    private getRelatedSourceFile(testFile: vscode.Uri): vscode.Uri | null {
        const testPath = testFile.fsPath;
        const sourcePath = testPath
            .replace(/\.(test|spec)\.(ts|tsx|js|jsx|py|java|go|rs)$/, '.$2')
            .replace(/\/__tests__\//, '/src/')
            .replace(/\/test\//, '/src/')
            .replace(/\/tests\//, '/src/');
        
        if (sourcePath !== testPath) {
            return vscode.Uri.file(sourcePath);
        }
        
        return null;
    }
    
    /**
     * Helper: Get related test file for source
     */
    private getRelatedTestFile(sourceFile: vscode.Uri): vscode.Uri | null {
        const sourcePath = sourceFile.fsPath;
        const ext = path.extname(sourcePath);
        const base = sourcePath.slice(0, -ext.length);
        
        // Try common test patterns
        const testPath = `${base}.test${ext}`;
        return vscode.Uri.file(testPath);
    }
}
