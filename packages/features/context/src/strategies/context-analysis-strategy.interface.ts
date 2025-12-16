
import { CodeType } from '../analysis/file-type-detector';

export interface ExtractedImport {
    path: string;
    symbols: string[];
    isRelative: boolean;
    offset: number;
}

export interface ClassDetails {
    name: string;
    extends?: string;
    implements?: string[];
    startLine: number;
    endLine?: number;
}

export interface FunctionDetails {
    name: string;
    parameters: string[];
    returnType?: string;
    startLine: number;
    endLine?: number;
}

export interface InterfaceDetails {
    name: string;
    extends?: string[];
    startLine: number;
    endLine?: number;
}

export interface PatternMatch {
    patternName: string;
    matches: string[];
}

export interface ContextAnalysisStrategy {
    supports(languageId: string): boolean;
    getSupportedExtensions(): string[];
    extractImports(text: string): ExtractedImport[];
    extractClasses(text: string): ClassDetails[];
    extractFunctions(text: string): FunctionDetails[];
    extractInterfaces(text: string): InterfaceDetails[];
    detectCodeTypes(text: string): CodeType[];
    
    // For ContextAnalyzer
    extractCodeBlocks(text: string): string[];
    detectPatterns(text: string): PatternMatch[];
}
