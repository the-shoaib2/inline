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
exports.SyntaxValidator = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Syntax Validator
 * Validates syntax errors in code
 */
class SyntaxValidator {
    async validateSyntax(document) {
        const diagnostics = [];
        const text = document.getText();
        const languageId = document.languageId;
        if (languageId === 'typescript' || languageId === 'javascript') {
            diagnostics.push(...this.validateJavaScriptSyntax(text, document));
        }
        else if (languageId === 'python') {
            diagnostics.push(...this.validatePythonSyntax(text, document));
        }
        return diagnostics;
    }
    validateJavaScriptSyntax(text, document) {
        const diagnostics = [];
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            // Check for unclosed brackets
            const openBrackets = (line.match(/[{[(]/g) || []).length;
            const closeBrackets = (line.match(/[}\])]/g) || []).length;
            if (openBrackets > closeBrackets && !line.trim().endsWith(',')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(range, 'Unclosed bracket detected', vscode.DiagnosticSeverity.Error));
            }
            // Check for missing semicolons (simple heuristic)
            if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') &&
                !line.trim().endsWith('}') && !line.trim().endsWith(',') &&
                !line.trim().startsWith('//') && !line.trim().startsWith('*') &&
                /^(const|let|var|return)\s/.test(line.trim())) {
                const range = new vscode.Range(index, line.length, index, line.length);
                diagnostics.push(new vscode.Diagnostic(range, 'Missing semicolon', vscode.DiagnosticSeverity.Warning));
            }
            // Check for undefined variables (basic)
            const match = line.match(/\b(\w+)\s+is\s+not\s+defined/);
            if (match) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(range, `'${match[1]}' is not defined`, vscode.DiagnosticSeverity.Error));
            }
        });
        return diagnostics;
    }
    validatePythonSyntax(text, document) {
        const diagnostics = [];
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            // Check for incorrect indentation
            if (line.match(/^\s+/) && line.match(/^\s+/)[0].length % 4 !== 0) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(range, 'Incorrect indentation (should be multiple of 4 spaces)', vscode.DiagnosticSeverity.Warning));
            }
            // Check for missing colons
            if (/^(if|elif|else|for|while|def|class|try|except|finally|with)\s/.test(line.trim()) &&
                !line.trim().endsWith(':')) {
                const range = new vscode.Range(index, line.length, index, line.length);
                diagnostics.push(new vscode.Diagnostic(range, 'Missing colon', vscode.DiagnosticSeverity.Error));
            }
        });
        return diagnostics;
    }
}
exports.SyntaxValidator = SyntaxValidator;
//# sourceMappingURL=syntax-validator.js.map