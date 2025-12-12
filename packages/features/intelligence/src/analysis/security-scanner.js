"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityScanner = void 0;
const vscode = __importStar(require("vscode"));
const shared_1 = require("@inline/shared");
class SecurityScanner {
    constructor(inference) {
        this.inference = inference;
        this.logger = new shared_1.Logger('SecurityScanner');
    }
    /**
     * Scan a document for security vulnerabilities
     */
    async scanDocument(document) {
        const startTime = Date.now();
        const vulnerabilities = [];
        // Quick pattern-based scan
        const patternVulns = this.quickPatternScan(document);
        vulnerabilities.push(...patternVulns);
        // Deep LLM-based analysis for suspicious code
        const suspiciousRanges = this.findSuspiciousCode(document);
        for (const range of suspiciousRanges) {
            try {
                const deepVulns = await this.deepScan(document, range);
                vulnerabilities.push(...deepVulns);
            }
            catch (error) {
                this.logger.error(`Deep scan failed: ${error}`);
            }
        }
        const scanTime = Date.now() - startTime;
        return {
            vulnerabilities,
            scannedLines: document.lineCount,
            scanTime
        };
    }
    /**
     * Quick pattern-based vulnerability detection
     */
    quickPatternScan(document) {
        const vulnerabilities = [];
        const text = document.getText();
        // SQL Injection
        const sqlMatches = text.matchAll(SecurityScanner.PATTERNS.sqlInjection);
        for (const match of sqlMatches) {
            const pos = document.positionAt(match.index);
            vulnerabilities.push({
                type: 'SQL Injection',
                severity: 'critical',
                description: 'Potential SQL injection vulnerability detected. User input is concatenated into SQL query.',
                location: new vscode.Range(pos, pos.translate(0, match[0].length)),
                suggestedFix: 'Use parameterized queries or prepared statements instead of string concatenation.',
                cweId: 'CWE-89'
            });
        }
        // XSS
        const xssMatches = text.matchAll(SecurityScanner.PATTERNS.xss);
        for (const match of xssMatches) {
            const pos = document.positionAt(match.index);
            vulnerabilities.push({
                type: 'Cross-Site Scripting (XSS)',
                severity: 'high',
                description: 'Potential XSS vulnerability. Unsafe HTML or JavaScript detected.',
                location: new vscode.Range(pos, pos.translate(0, match[0].length)),
                suggestedFix: 'Sanitize user input and use safe DOM manipulation methods.',
                cweId: 'CWE-79'
            });
        }
        // Hardcoded Secrets
        const secretMatches = text.matchAll(SecurityScanner.PATTERNS.hardcodedSecrets);
        for (const match of secretMatches) {
            const pos = document.positionAt(match.index);
            vulnerabilities.push({
                type: 'Hardcoded Secret',
                severity: 'high',
                description: 'Hardcoded password, API key, or secret detected.',
                location: new vscode.Range(pos, pos.translate(0, match[0].length)),
                suggestedFix: 'Use environment variables or a secure secret management system.',
                cweId: 'CWE-798'
            });
        }
        // Path Traversal
        const pathMatches = text.matchAll(SecurityScanner.PATTERNS.pathTraversal);
        for (const match of pathMatches) {
            const pos = document.positionAt(match.index);
            vulnerabilities.push({
                type: 'Path Traversal',
                severity: 'high',
                description: 'Potential path traversal vulnerability detected.',
                location: new vscode.Range(pos, pos.translate(0, match[0].length)),
                suggestedFix: 'Validate and sanitize file paths. Use path.resolve() and check if the result is within allowed directories.',
                cweId: 'CWE-22'
            });
        }
        // Command Injection
        const cmdMatches = text.matchAll(SecurityScanner.PATTERNS.commandInjection);
        for (const match of cmdMatches) {
            const pos = document.positionAt(match.index);
            vulnerabilities.push({
                type: 'Command Injection',
                severity: 'critical',
                description: 'Potential command injection vulnerability. User input is used in system commands.',
                location: new vscode.Range(pos, pos.translate(0, match[0].length)),
                suggestedFix: 'Avoid using exec/system with user input. Use safe alternatives or validate input strictly.',
                cweId: 'CWE-78'
            });
        }
        return vulnerabilities;
    }
    /**
     * Find suspicious code sections for deep analysis
     */
    findSuspiciousCode(document) {
        const ranges = [];
        const text = document.getText();
        // Look for database operations
        const dbPatterns = [/(?:query|execute|exec|prepare)/gi];
        // Look for file operations
        const filePatterns = [/(?:readFile|writeFile|unlink|rm)/gi];
        // Look for network operations
        const netPatterns = [/(?:fetch|axios|request|http)/gi];
        const allPatterns = [...dbPatterns, ...filePatterns, ...netPatterns];
        for (const pattern of allPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const pos = document.positionAt(match.index);
                const line = document.lineAt(pos.line);
                ranges.push(line.range);
            }
        }
        return ranges;
    }
    /**
     * Deep LLM-based security analysis
     */
    async deepScan(document, range) {
        const code = document.getText(range);
        const prompt = `Analyze this ${document.languageId} code for security vulnerabilities.

Code:
\`\`\`${document.languageId}
${code}
\`\`\`

Check for:
1. SQL Injection
2. XSS (Cross-Site Scripting)
3. Command Injection
4. Path Traversal
5. Insecure Deserialization
6. Hardcoded Secrets
7. Unsafe Regex (ReDoS)

For each vulnerability found, provide:
- TYPE: vulnerability type
- SEVERITY: critical/high/medium/low
- DESCRIPTION: what's wrong
- FIX: how to fix it

Response:`;
        try {
            const analysis = await this.inference.generateCompletion(prompt, {
                maxTokens: 512,
                temperature: 0.1
            });
            return this.parseSecurityAnalysis(analysis, range);
        }
        catch (error) {
            this.logger.error(`Deep security scan failed: ${error}`);
            return [];
        }
    }
    /**
     * Parse security analysis from LLM response
     */
    parseSecurityAnalysis(analysis, range) {
        const vulnerabilities = [];
        const lines = analysis.split('\n');
        let currentVuln = {};
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.match(/^TYPE:/i)) {
                if (currentVuln.type) {
                    vulnerabilities.push(currentVuln);
                }
                currentVuln = {
                    type: trimmed.replace(/^TYPE:\s*/i, ''),
                    location: range
                };
            }
            else if (trimmed.match(/^SEVERITY:/i)) {
                const severity = trimmed.replace(/^SEVERITY:\s*/i, '').toLowerCase();
                currentVuln.severity = severity;
            }
            else if (trimmed.match(/^DESCRIPTION:/i)) {
                currentVuln.description = trimmed.replace(/^DESCRIPTION:\s*/i, '');
            }
            else if (trimmed.match(/^FIX:/i)) {
                currentVuln.suggestedFix = trimmed.replace(/^FIX:\s*/i, '');
            }
        }
        if (currentVuln.type) {
            vulnerabilities.push(currentVuln);
        }
        return vulnerabilities;
    }
    /**
     * Generate security report
     */
    generateReport(result) {
        const critical = result.vulnerabilities.filter(v => v.severity === 'critical').length;
        const high = result.vulnerabilities.filter(v => v.severity === 'high').length;
        const medium = result.vulnerabilities.filter(v => v.severity === 'medium').length;
        const low = result.vulnerabilities.filter(v => v.severity === 'low').length;
        let report = `# Security Scan Report\n\n`;
        report += `**Scan Time:** ${result.scanTime}ms\n`;
        report += `**Lines Scanned:** ${result.scannedLines}\n\n`;
        report += `## Summary\n\n`;
        report += `- 🔴 Critical: ${critical}\n`;
        report += `- 🟠 High: ${high}\n`;
        report += `- 🟡 Medium: ${medium}\n`;
        report += `- 🟢 Low: ${low}\n\n`;
        if (result.vulnerabilities.length === 0) {
            report += `✅ No vulnerabilities detected!\n`;
            return report;
        }
        report += `## Vulnerabilities\n\n`;
        for (const vuln of result.vulnerabilities) {
            const icon = {
                critical: '🔴',
                high: '🟠',
                medium: '🟡',
                low: '🟢'
            }[vuln.severity];
            report += `### ${icon} ${vuln.type} (${vuln.severity.toUpperCase()})\n\n`;
            report += `**Location:** Line ${vuln.location.start.line + 1}\n\n`;
            report += `**Description:** ${vuln.description}\n\n`;
            report += `**Suggested Fix:** ${vuln.suggestedFix}\n\n`;
            if (vuln.cweId) {
                report += `**CWE:** ${vuln.cweId}\n\n`;
            }
            report += `---\n\n`;
        }
        return report;
    }
}
exports.SecurityScanner = SecurityScanner;
// Common vulnerability patterns
SecurityScanner.PATTERNS = {
    sqlInjection: /(?:execute|query|exec)\s*\([^)]*\+[^)]*\)|(?:["'](?:SELECT|INSERT|UPDATE|DELETE|FROM)\b[^"']*\s*["']\s*\+)/gi,
    xss: /<script|javascript:|onerror=|onload=/gi,
    hardcodedSecrets: /(?:password|api_key|secret|token)\s*=\s*["'][^"']+["']/gi,
    pathTraversal: /\.\.[\/\\]/g,
    commandInjection: /(?:exec|system|spawn)\s*\([^)]*\+[^)]*\)/gi,
    unsafeRegex: /new\s+RegExp\([^)]*\+[^)]*\)/gi
};
//# sourceMappingURL=security-scanner.js.map