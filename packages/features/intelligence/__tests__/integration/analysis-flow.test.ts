import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { ErrorExplainer } from '../../src/analysis/error-explainer';
import { RefactoringEngine } from '../../src/analysis/refactoring-engine';
import { SecurityScanner } from '../../src/analysis/security-scanner';
import { LlamaInference } from '../../src/engines/llama-engine';

// Mock LlamaInference to return predictable responses
class MockLlamaInference extends LlamaInference {
    constructor() {
        super(); // Pass dummy config
    }

    public async generateCompletion(prompt: string, options?: any): Promise<string> {
        // Return responses based on prompt keywords to simulate AI behavior
        if (prompt.includes('Explain this typescript error')) {
            return `
EXPLANATION: The error "Cannot find name 'unknownVar'" means that you are trying to use a variable that has not been defined in the current scope.
FIXES:
1. Define the variable before using it.
2. Check for typos in the variable name.
EXAMPLE:
const unknownVar = "value";
console.log(unknownVar);
`;
        } else if (prompt.includes('Analyze this typescript code and suggest refactorings')) {
            return `
TYPE: extract-method
DESCRIPTION: The code block for data processing is repeated. Extract it into a separate 'processData' method.
PRIORITY: high
`;
        } else if (prompt.includes('Analyze this typescript code for security vulnerabilities')) {
            return `
TYPE: SQL Injection
SEVERITY: critical
DESCRIPTION: User input is directly concatenated into the SQL query string.
FIX: Use parameterized queries to safely insert user input.
`;
        }
        return 'Mock response';
    }
}

describe('Intelligence Analysis Integration Flow', () => {
    let mockInference: any;
    let errorExplainer: ErrorExplainer;
    let refactoringEngine: RefactoringEngine;
    let securityScanner: SecurityScanner;
    let mockDocument: any;

    beforeEach(() => {
        mockInference = new MockLlamaInference();
        errorExplainer = new ErrorExplainer(mockInference);
        refactoringEngine = new RefactoringEngine(mockInference);
        securityScanner = new SecurityScanner(mockInference);

        // Setup a mock document
        const fileContent = `
function processUserData(input) {
    // Vulnerable SQL
    const query = "SELECT * FROM users WHERE id = " + input;
    
    // Repeated code
    console.log("Processing...");
    console.log("Validating...");
    console.log("Saving...");

    console.log("Processing...");
    console.log("Validating...");
    console.log("Saving...");

    // Error
    console.log(unknownVar);
}
`;
        mockDocument = {
            languageId: 'typescript',
            getText: vi.fn((range) => {
                if (range) {
                    // Simplified: return full content for simplicity in this mock, 
                    // or implement substring logic if specific range extraction is critical.
                    // For these integration tests, we mostly rely on the prompt construction which uses the text.
                    // Let's implement basic substring if it's a simple range
                    return fileContent; 
                }
                return fileContent;
            }),
            lineCount: 15,
            lineAt: vi.fn((line) => ({
                text: fileContent.split('\n')[line] || '',
                range: new vscode.Range(line, 0, line, 100), // Approximate
                isEmptyOrWhitespace: false
            })),
            positionAt: vi.fn((offset) => new vscode.Position(0, 0)) // distinct helpers usually needed
        };
    });

    it('should complete a full analysis workflow: Explain Error -> Refactor -> Security Scan', async () => {
        // 1. Error Explanation Flow
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(13, 16, 13, 26), 
            "Cannot find name 'unknownVar'", 
            vscode.DiagnosticSeverity.Error
        );

        const explanation = await errorExplainer.explainError(diagnostic, mockDocument);
        
        expect(explanation.error).toBe("Cannot find name 'unknownVar'");
        expect(explanation.explanation).toContain('not been defined');
        expect(explanation.suggestedFixes).toHaveLength(2);

        // 2. Refactoring Suggestions Flow
        // Mocking simulate a range covering the repeated code
        const refactoringRange = new vscode.Range(5, 4, 10, 30);
        const codeWithRepetition = `
    console.log("Processing...");
    console.log("Validating...");
    console.log("Saving...");
    console.log("Processing...");
    console.log("Validating...");
    console.log("Saving...");
        `;
        // Override mock for this specific call for better precision if needed, 
        // or relying on our mocked LlamaInference response which ignores exact input text details for keywords.
        
        const suggestions = await refactoringEngine.suggestRefactorings(mockDocument, refactoringRange);
        
        // Should find the LLM suggestion
        const extractMethodSuggestion = suggestions.find(s => s.type === 'extract-method');
        expect(extractMethodSuggestion).toBeDefined();
        expect(extractMethodSuggestion?.priority).toBe('high');

        // 3. Security Scan Flow
        // Should detect SQL injection via Regex (fast scan) OR LLM (deep scan)
        // The mock document has: "SELECT * FROM users WHERE id = " + input;
        
        // We'll trust the scanner attempts both.
        const scanResult = await securityScanner.scanDocument(mockDocument);
        
        expect(scanResult.vulnerabilities.length).toBeGreaterThan(0);
        
        // Check for SQL Injection (Pattern based)
        const sqlVuln = scanResult.vulnerabilities.find(v => v.type === 'SQL Injection');
        expect(sqlVuln).toBeDefined();
        expect(sqlVuln?.severity).toBe('critical');

        // Verify report generation
        const report = securityScanner.generateReport(scanResult);
        expect(report).toContain('# Security Scan Report');
        expect(report).toContain('SQL Injection');
    });
});
