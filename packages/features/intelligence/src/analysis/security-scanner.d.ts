import * as vscode from 'vscode';
import { LlamaInference } from '../engines/llama-engine';
export interface SecurityVulnerability {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    location: vscode.Range;
    suggestedFix: string;
    cweId?: string;
}
export interface SecurityScanResult {
    vulnerabilities: SecurityVulnerability[];
    scannedLines: number;
    scanTime: number;
}
export declare class SecurityScanner {
    private inference;
    private logger;
    private static readonly PATTERNS;
    constructor(inference: LlamaInference);
    /**
     * Scan a document for security vulnerabilities
     */
    scanDocument(document: vscode.TextDocument): Promise<SecurityScanResult>;
    /**
     * Quick pattern-based vulnerability detection
     */
    private quickPatternScan;
    /**
     * Find suspicious code sections for deep analysis
     */
    private findSuspiciousCode;
    /**
     * Deep LLM-based security analysis
     */
    private deepScan;
    /**
     * Parse security analysis from LLM response
     */
    private parseSecurityAnalysis;
    /**
     * Generate security report
     */
    generateReport(result: SecurityScanResult): string;
}
//# sourceMappingURL=security-scanner.d.ts.map