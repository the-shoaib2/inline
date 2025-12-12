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
exports.SemanticValidator = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Semantic Validator
 * Validates semantic errors in code
 */
class SemanticValidator {
    async validateSemantics(document) {
        const diagnostics = [];
        const text = document.getText();
        // Check for unreachable code
        diagnostics.push(...this.findUnreachableCode(text, document));
        // Check for duplicate declarations
        diagnostics.push(...this.findDuplicateDeclarations(text, document));
        // Check for unused parameters
        diagnostics.push(...this.findUnusedParameters(text, document));
        return diagnostics;
    }
    findUnreachableCode(text, document) {
        const diagnostics = [];
        const lines = text.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith('return') || line.startsWith('throw')) {
                // Check if next non-empty line is not a closing brace
                let nextIndex = i + 1;
                while (nextIndex < lines.length && !lines[nextIndex].trim()) {
                    nextIndex++;
                }
                if (nextIndex < lines.length && !lines[nextIndex].trim().startsWith('}')) {
                    const range = new vscode.Range(nextIndex, 0, nextIndex, lines[nextIndex].length);
                    diagnostics.push(new vscode.Diagnostic(range, 'Unreachable code detected', vscode.DiagnosticSeverity.Warning));
                }
            }
        }
        return diagnostics;
    }
    findDuplicateDeclarations(text, document) {
        const diagnostics = [];
        const declarations = new Map();
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            const match = line.match(/(?:const|let|var|function|class)\s+(\w+)/);
            if (match) {
                const name = match[1];
                if (declarations.has(name)) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(range, `Duplicate declaration of '${name}'`, vscode.DiagnosticSeverity.Error));
                }
                else {
                    declarations.set(name, index);
                }
            }
        });
        return diagnostics;
    }
    findUnusedParameters(text, document) {
        const diagnostics = [];
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            const funcMatch = line.match(/function\s+\w+\s*\(([^)]+)\)/);
            if (funcMatch) {
                const params = funcMatch[1].split(',').map(p => p.trim().split(/[:\s]/)[0]);
                // Check if parameters are used in function body (simple check)
                const functionBody = text.substring(text.indexOf(line));
                params.forEach(param => {
                    if (param && !new RegExp(`\\b${param}\\b`).test(functionBody.substring(line.length))) {
                        const range = new vscode.Range(index, 0, index, line.length);
                        diagnostics.push(new vscode.Diagnostic(range, `Parameter '${param}' is never used`, vscode.DiagnosticSeverity.Hint));
                    }
                });
            }
        });
        return diagnostics;
    }
}
exports.SemanticValidator = SemanticValidator;
//# sourceMappingURL=semantic-validator.js.map