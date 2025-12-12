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
exports.TypeChecker = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Basic type checker for code diagnostics.
 *
 * Detects:
 * - Type mismatches in assignments
 * - Missing return type annotations
 * - Implicit 'any' type parameters
 * - Type inference from literal values
 *
 * Supports TypeScript and JavaScript.
 * Uses regex-based heuristic analysis (not full type system).
 */
class TypeChecker {
    /**
     * Check types in a document and return diagnostics.
     * Currently supports TypeScript/JavaScript.
     *
     * @param document VS Code document to check
     * @returns Array of type-related diagnostics
     */
    async checkTypes(document) {
        const diagnostics = [];
        const text = document.getText();
        const languageId = document.languageId;
        if (languageId === 'typescript' || languageId === 'javascript') {
            diagnostics.push(...this.checkTypeScriptTypes(text, document));
        }
        return diagnostics;
    }
    /**
     * Check TypeScript/JavaScript specific type issues.
     * Detects assignment mismatches, missing annotations, and implicit any.
     */
    checkTypeScriptTypes(text, document) {
        const diagnostics = [];
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            // Detect type mismatches: const x: string = 123
            const assignMatch = line.match(/(\w+):\s*(string|number|boolean)\s*=\s*(.+)/);
            if (assignMatch) {
                const [, varName, declaredType, value] = assignMatch;
                const actualType = this.inferType(value.trim());
                // Report error if inferred type doesn't match declared type
                if (actualType && actualType !== declaredType && actualType !== 'any') {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(range, `Type '${actualType}' is not assignable to type '${declaredType}'`, vscode.DiagnosticSeverity.Error));
                }
            }
            // Detect missing return type annotations on functions
            const funcMatch = line.match(/function\s+\w+\s*\([^)]*\)\s*{/);
            if (funcMatch && !line.includes(':')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(range, 'Missing return type annotation', vscode.DiagnosticSeverity.Information));
            }
            // Detect implicit 'any' type on function parameters
            const paramMatch = line.match(/function\s+\w+\s*\((\w+)\s*\)/);
            if (paramMatch && !line.includes(':')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(range, `Parameter '${paramMatch[1]}' implicitly has an 'any' type`, vscode.DiagnosticSeverity.Warning));
            }
        });
        return diagnostics;
    }
    /**
     * Infer type from a literal value.
     * Handles strings, numbers, booleans, arrays, and objects.
     *
     * @param value Value to infer type from
     * @returns Inferred type name or null if unknown
     */
    inferType(value) {
        value = value.replace(/;$/, '').trim();
        // String literals
        if (value.startsWith('"') || value.startsWith("'") || value.startsWith('`')) {
            return 'string';
        }
        // Number literals
        if (/^\d+$/.test(value) || /^\d+\.\d+$/.test(value)) {
            return 'number';
        }
        // Boolean literals
        if (value === 'true' || value === 'false') {
            return 'boolean';
        }
        // Array literals
        if (value.startsWith('[')) {
            return 'array';
        }
        if (value.startsWith('{')) {
            return 'object';
        }
        if (value === 'null' || value === 'undefined') {
            return value;
        }
        return null;
    }
}
exports.TypeChecker = TypeChecker;
//# sourceMappingURL=type-checker.js.map