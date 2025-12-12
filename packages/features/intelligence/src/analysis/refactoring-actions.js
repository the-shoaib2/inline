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
exports.RefactoringActions = void 0;
const vscode = __importStar(require("vscode"));
const language_1 = require("@inline/language");
class RefactoringActions {
    constructor() {
        this.semanticAnalyzer = new language_1.SemanticAnalyzer();
    }
    /**
     * Rename symbol across all references
     */
    async renameSymbol(document, position, newName) {
        const edits = [];
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return { success: false, edits: [], description: 'No symbol at position' };
        }
        const oldName = document.getText(wordRange);
        const text = document.getText();
        // Find all occurrences of the symbol
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            const matchPosition = document.positionAt(match.index);
            const matchRange = new vscode.Range(matchPosition, document.positionAt(match.index + oldName.length));
            edits.push(vscode.TextEdit.replace(matchRange, newName));
        }
        return {
            success: true,
            edits,
            description: `Renamed '${oldName}' to '${newName}' (${edits.length} occurrences)`
        };
    }
    /**
     * Extract variable from selected expression
     */
    async extractVariable(document, range, variableName) {
        const selectedText = document.getText(range);
        const edits = [];
        // Generate variable name if not provided
        const varName = variableName || this.generateVariableName(selectedText);
        // Determine variable declaration type based on language
        const languageId = document.languageId;
        let declaration = '';
        if (languageId === 'typescript' || languageId === 'javascript') {
            declaration = `const ${varName} = ${selectedText};\n`;
        }
        else if (languageId === 'python') {
            declaration = `${varName} = ${selectedText}\n`;
        }
        // Find the line to insert the declaration
        const insertLine = range.start.line;
        const lineText = document.lineAt(insertLine).text;
        const indentation = lineText.match(/^\s*/)?.[0] || '';
        // Insert variable declaration
        edits.push(vscode.TextEdit.insert(new vscode.Position(insertLine, 0), indentation + declaration));
        // Replace selected text with variable name
        edits.push(vscode.TextEdit.replace(range, varName));
        return {
            success: true,
            edits,
            description: `Extracted variable '${varName}'`
        };
    }
    /**
     * Extract function/method from selected code
     */
    async extractFunction(document, range, functionName) {
        const selectedText = document.getText(range);
        const edits = [];
        const languageId = document.languageId;
        // Generate function name if not provided
        const funcName = functionName || 'extractedFunction';
        // Analyze selected code to find variables used
        const usedVariables = this.findUsedVariables(selectedText, document, range);
        // Generate function
        let functionCode = '';
        if (languageId === 'typescript' || languageId === 'javascript') {
            const params = usedVariables.join(', ');
            functionCode = `\nfunction ${funcName}(${params}) {\n${selectedText}\n}\n`;
        }
        else if (languageId === 'python') {
            const params = usedVariables.join(', ');
            functionCode = `\ndef ${funcName}(${params}):\n    ${selectedText.replace(/\n/g, '\n    ')}\n`;
        }
        // Insert function before current function/class
        const insertPosition = this.findInsertPositionForFunction(document, range);
        edits.push(vscode.TextEdit.insert(insertPosition, functionCode));
        // Replace selected code with function call
        const callParams = usedVariables.join(', ');
        const functionCall = `${funcName}(${callParams})`;
        edits.push(vscode.TextEdit.replace(range, functionCall));
        return {
            success: true,
            edits,
            description: `Extracted function '${funcName}'`
        };
    }
    /**
     * Inline variable - replace all usages with the variable's value
     */
    async inlineVariable(document, position) {
        const edits = [];
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return { success: false, edits: [], description: 'No variable at position' };
        }
        const variableName = document.getText(wordRange);
        const text = document.getText();
        const lines = text.split('\n');
        // Find variable declaration
        const declRegex = new RegExp(`(?:const|let|var)\\s+${variableName}\\s*=\\s*([^;\\n]+)`);
        const declMatch = text.match(declRegex);
        if (!declMatch) {
            return { success: false, edits: [], description: 'Variable declaration not found' };
        }
        const variableValue = declMatch[1].trim();
        const declLine = text.substring(0, text.indexOf(declMatch[0])).split('\n').length - 1;
        // Find all usages of the variable (excluding declaration)
        const usageRegex = new RegExp(`\\b${variableName}\\b`, 'g');
        let match;
        let usageCount = 0;
        while ((match = usageRegex.exec(text)) !== null) {
            const matchLine = text.substring(0, match.index).split('\n').length - 1;
            // Skip the declaration line
            if (matchLine === declLine)
                continue;
            const matchPosition = document.positionAt(match.index);
            const matchRange = new vscode.Range(matchPosition, document.positionAt(match.index + variableName.length));
            edits.push(vscode.TextEdit.replace(matchRange, variableValue));
            usageCount++;
        }
        // Remove the variable declaration
        const declLineRange = new vscode.Range(declLine, 0, declLine + 1, 0);
        edits.push(vscode.TextEdit.delete(declLineRange));
        return {
            success: true,
            edits,
            description: `Inlined variable '${variableName}' (${usageCount} usages)`
        };
    }
    /**
     * Generate a variable name from an expression
     */
    generateVariableName(expression) {
        // Simple heuristic: use first word or 'value'
        const match = expression.match(/(\w+)/);
        return match ? match[1].toLowerCase() + 'Value' : 'extractedValue';
    }
    /**
     * Find variables used in selected code
     */
    findUsedVariables(code, document, range) {
        const variables = new Set();
        const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
        let match;
        while ((match = identifierRegex.exec(code)) !== null) {
            const identifier = match[1];
            // Skip keywords
            const keywords = ['const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return', 'true', 'false', 'null', 'undefined'];
            if (!keywords.includes(identifier)) {
                variables.add(identifier);
            }
        }
        return Array.from(variables);
    }
    /**
     * Find position to insert extracted function
     */
    findInsertPositionForFunction(document, range) {
        // Insert before the current function or at the beginning of the file
        const text = document.getText();
        const beforeRange = text.substring(0, document.offsetAt(range.start));
        // Find the last function declaration before the range
        const functionMatch = beforeRange.match(/function\s+\w+|class\s+\w+/g);
        if (functionMatch) {
            // Insert after the previous function
            return new vscode.Position(range.start.line, 0);
        }
        // Insert at the beginning
        return new vscode.Position(0, 0);
    }
}
exports.RefactoringActions = RefactoringActions;
//# sourceMappingURL=refactoring-actions.js.map