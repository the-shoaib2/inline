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
exports.Linter = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Linter
 * Checks code style and best practices
 */
class Linter {
    async lint(document) {
        const diagnostics = [];
        const text = document.getText();
        const languageId = document.languageId;
        // Common linting rules
        diagnostics.push(...this.checkLineLength(text, document));
        diagnostics.push(...this.checkNamingConventions(text, document, languageId));
        diagnostics.push(...this.checkComplexity(text, document));
        diagnostics.push(...this.checkBestPractices(text, document, languageId));
        return diagnostics;
    }
    checkLineLength(text, document, maxLength = 120) {
        const diagnostics = [];
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            if (line.length > maxLength) {
                const range = new vscode.Range(index, maxLength, index, line.length);
                diagnostics.push(new vscode.Diagnostic(range, `Line exceeds maximum length of ${maxLength} characters`, vscode.DiagnosticSeverity.Warning));
            }
        });
        return diagnostics;
    }
    checkNamingConventions(text, document, languageId) {
        const diagnostics = [];
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            // Check for camelCase in JavaScript/TypeScript
            if (languageId === 'typescript' || languageId === 'javascript') {
                const varMatch = line.match(/(?:const|let|var)\s+([A-Z]\w+)\s*=/);
                if (varMatch) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(range, `Variable '${varMatch[1]}' should use camelCase`, vscode.DiagnosticSeverity.Warning));
                }
                // Check for PascalCase in class names
                const classMatch = line.match(/class\s+([a-z]\w+)/);
                if (classMatch) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(range, `Class '${classMatch[1]}' should use PascalCase`, vscode.DiagnosticSeverity.Warning));
                }
            }
            // Check for snake_case in Python
            if (languageId === 'python') {
                const varMatch = line.match(/(\w+[A-Z]\w+)\s*=/);
                if (varMatch && !line.includes('class ')) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(range, `Variable '${varMatch[1]}' should use snake_case`, vscode.DiagnosticSeverity.Warning));
                }
            }
        });
        return diagnostics;
    }
    checkComplexity(text, document) {
        const diagnostics = [];
        const lines = text.split('\n');
        let functionStart = -1;
        let complexity = 0;
        lines.forEach((line, index) => {
            if (/function\s+\w+|=>\s*{/.test(line)) {
                functionStart = index;
                complexity = 1;
            }
            if (functionStart !== -1) {
                // Count complexity indicators
                if (/\b(if|else|for|while|case|catch|\?|&&|\|\|)\b/.test(line)) {
                    complexity++;
                }
                if (line.includes('}') && functionStart !== -1) {
                    if (complexity > 10) {
                        const range = new vscode.Range(functionStart, 0, index, line.length);
                        diagnostics.push(new vscode.Diagnostic(range, `Function has cyclomatic complexity of ${complexity} (threshold: 10)`, vscode.DiagnosticSeverity.Warning));
                    }
                    functionStart = -1;
                }
            }
        });
        return diagnostics;
    }
    checkBestPractices(text, document, languageId) {
        const diagnostics = [];
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            // Check for console.log in production code
            if (line.includes('console.log') && !line.trim().startsWith('//')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(range, 'Unexpected console.log statement', vscode.DiagnosticSeverity.Information));
            }
            // Check for == instead of ===
            if (languageId === 'javascript' || languageId === 'typescript') {
                if (/[^=!]==[^=]/.test(line)) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(range, 'Use === instead of ==', vscode.DiagnosticSeverity.Warning));
                }
            }
            // Check for var instead of let/const
            if ((languageId === 'javascript' || languageId === 'typescript') && /\bvar\s+/.test(line)) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(range, 'Use let or const instead of var', vscode.DiagnosticSeverity.Warning));
            }
        });
        return diagnostics;
    }
}
exports.Linter = Linter;
//# sourceMappingURL=linter.js.map