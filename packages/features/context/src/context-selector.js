"use strict";
/**
 * Context selector for intelligent context selection and prioritization.
 *
 * Features:
 * - Adaptive context selection based on cursor position and intent
 * - Dynamic prefix/suffix ratio optimization
 * - Symbol prioritization by relevance
 * - Token-aware context optimization
 * - Multi-tier context categorization
 */
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
exports.ContextSelector = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Intelligent context selector that optimizes context based on cursor position,
 * user intent, and token constraints.
 */
class ContextSelector {
    constructor() {
        this.maxContextTokens = 4000;
    }
    /**
     * Select optimal context based on cursor position and detected intent.
     *
     * @param document - Current document
     * @param position - Cursor position
     * @param intent - Detected user intent
     * @param availableContext - Full available context
     * @returns Optimized context with prioritized elements
     */
    selectOptimalContext(document, position, intent, availableContext) {
        // Calculate optimal prefix/suffix ratio based on cursor position
        const ratio = this.calculateOptimalRatio(position, document);
        // Adjust context window according to calculated ratio
        const { prefix, suffix } = this.adjustContextRatio(availableContext.prefix, availableContext.suffix, ratio);
        // Prioritize symbols by relevance to current intent and position
        const prioritizedSymbols = this.prioritizeSymbols(availableContext.symbolTable, intent, position);
        // Filter types relevant to current context
        const relevantTypes = this.selectRelevantTypes(availableContext.types, availableContext.interfaces, intent);
        // Select functions most relevant to current position and intent
        const relevantFunctions = this.selectRelevantFunctions(availableContext.functions, intent, position);
        // Suggest imports that might be needed for current context
        const suggestedImports = this.suggestImports(availableContext.imports, intent);
        // Calculate overall context quality score for optimization
        const contextScore = this.calculateContextScore(prioritizedSymbols, relevantTypes, relevantFunctions, intent);
        return {
            prefix,
            suffix,
            prioritizedSymbols,
            relevantTypes,
            relevantFunctions,
            suggestedImports,
            contextScore
        };
    }
    /**
     * Prioritize context elements into tiers based on detected user intent.
     *
     * @param context - Full available context
     * @param intent - Detected user intent
     * @returns Context organized by importance tiers
     */
    prioritizeContext(context, intent) {
        const essential = [];
        const important = [];
        const optional = [];
        if (!intent) {
            // Default prioritization when no specific intent detected
            essential.push('Current file context');
            important.push('Imports', 'Functions', 'Classes');
            optional.push('Types', 'Interfaces', 'Variables');
        }
        else {
            // Intent-specific prioritization for optimal context selection
            switch (intent.type) {
                case 'function_call':
                    essential.push('Function signatures', 'Parameter types');
                    important.push('Return types', 'Related functions');
                    optional.push('Similar code examples');
                    break;
                case 'variable_declaration':
                    essential.push('Type definitions', 'Interfaces');
                    important.push('Similar variables', 'Scope context');
                    optional.push('Coding patterns');
                    break;
                case 'class_method':
                    essential.push('Class context', 'Method signatures');
                    important.push('Property types', 'Parent class');
                    optional.push('Similar methods');
                    break;
                case 'import':
                    essential.push('Available modules', 'Common imports');
                    important.push('Project dependencies');
                    optional.push('Related files');
                    break;
                case 'comment_to_code':
                    essential.push('Similar code', 'Coding patterns');
                    important.push('Function templates', 'Style guide');
                    optional.push('Project config');
                    break;
                case 'type_annotation':
                    essential.push('Type definitions', 'Interfaces');
                    important.push('Generic types', 'Union types');
                    optional.push('Type aliases');
                    break;
            }
        }
        // Calculate total token count for the prioritized context
        const totalTokens = this.estimateTokenCount(essential, important, optional);
        return {
            essential,
            important,
            optional,
            totalTokens
        };
    }
    /**
     * Calculate optimal prefix/suffix ratio based on cursor position in document.
     * Uses adaptive weighting to provide more relevant context.
     *
     * @param position - Current cursor position
     * @param document - Current document
     * @returns Optimal prefix and suffix ratios
     */
    calculateOptimalRatio(position, document) {
        const totalLines = document.lineCount;
        const currentLine = position.line;
        const linePosition = currentLine / totalLines;
        // Adaptive ratio based on cursor position in file
        if (linePosition < 0.2) {
            // Near start of file - prioritize suffix (future context)
            return { prefixRatio: 0.4, suffixRatio: 0.6 };
        }
        else if (linePosition > 0.8) {
            // Near end of file - prioritize prefix (past context)
            return { prefixRatio: 0.8, suffixRatio: 0.2 };
        }
        else if (linePosition > 0.4 && linePosition < 0.6) {
            // Middle of file - balanced context
            return { prefixRatio: 0.5, suffixRatio: 0.5 };
        }
        else {
            // Default - slightly more prefix
            return { prefixRatio: 0.7, suffixRatio: 0.3 };
        }
    }
    /**
     * Adjust context based on ratio
     */
    adjustContextRatio(prefix, suffix, ratio) {
        const totalChars = this.maxContextTokens * 4; // Rough estimate: 1 token ≈ 4 chars
        const prefixChars = Math.floor(totalChars * ratio.prefixRatio);
        const suffixChars = Math.floor(totalChars * ratio.suffixRatio);
        // Trim to calculated sizes
        const adjustedPrefix = prefix.length > prefixChars
            ? prefix.substring(prefix.length - prefixChars)
            : prefix;
        const adjustedSuffix = suffix.length > suffixChars
            ? suffix.substring(0, suffixChars)
            : suffix;
        return {
            prefix: adjustedPrefix,
            suffix: adjustedSuffix
        };
    }
    /**
     * Prioritize symbols based on proximity and intent
     */
    prioritizeSymbols(symbolTable, intent, position) {
        const symbols = Array.from(symbolTable.values());
        // Score each symbol
        const scoredSymbols = symbols.map(symbol => {
            let score = 0;
            // Proximity score (closer = higher)
            const distance = Math.abs(symbol.location.range.start.line - position.line);
            score += Math.max(0, 100 - distance);
            // Intent-based score
            if (intent) {
                switch (intent.type) {
                    case 'function_call':
                        if (symbol.kind === vscode.SymbolKind.Function ||
                            symbol.kind === vscode.SymbolKind.Method) {
                            score += 50;
                        }
                        break;
                    case 'variable_declaration':
                        if (symbol.kind === vscode.SymbolKind.Variable ||
                            symbol.kind === vscode.SymbolKind.Constant) {
                            score += 50;
                        }
                        break;
                    case 'type_annotation':
                        if (symbol.kind === vscode.SymbolKind.Interface ||
                            symbol.kind === vscode.SymbolKind.TypeParameter ||
                            symbol.kind === vscode.SymbolKind.Class) {
                            score += 50;
                        }
                        break;
                }
            }
            return { symbol, score };
        });
        // Sort by score (highest first)
        scoredSymbols.sort((a, b) => b.score - a.score);
        // Return top 20 symbols
        return scoredSymbols.slice(0, 20).map(s => s.symbol);
    }
    /**
     * Select relevant types based on intent
     */
    selectRelevantTypes(types, interfaces, intent) {
        if (!intent || intent.type !== 'type_annotation' && intent.type !== 'variable_declaration') {
            return types.slice(0, 5); // Top 5 types
        }
        // For type-related intents, include more types
        return types.slice(0, 10);
    }
    /**
     * Select relevant functions based on intent and proximity
     */
    selectRelevantFunctions(functions, intent, position) {
        if (!intent) {
            return functions.slice(0, 5);
        }
        // Score functions based on relevance
        const scoredFunctions = functions.map(func => {
            let score = 0;
            // Proximity score
            const distance = Math.abs(func.lineNumber - position.line);
            score += Math.max(0, 50 - distance);
            // Intent-based score
            if (intent.type === 'function_call') {
                score += 30;
            }
            if (intent.type === 'comment_to_code' && func.docstring) {
                score += 20;
            }
            // Async functions are often important
            if (func.isAsync) {
                score += 10;
            }
            // Exported functions are public API
            if (func.isExported) {
                score += 15;
            }
            return { func, score };
        });
        scoredFunctions.sort((a, b) => b.score - a.score);
        return scoredFunctions.slice(0, 10).map(s => s.func);
    }
    /**
     * Suggest imports based on intent
     */
    suggestImports(imports, intent) {
        if (!intent || intent.type !== 'import') {
            return imports.slice(0, 3);
        }
        // For import intent, show more imports
        return imports.slice(0, 10);
    }
    /**
     * Calculate context quality score (0-1)
     */
    calculateContextScore(symbols, types, functions, intent) {
        let score = 0;
        const maxScore = 100;
        // Symbol availability (0-30 points)
        score += Math.min(30, symbols.length * 1.5);
        // Type information (0-25 points)
        score += Math.min(25, types.length * 2.5);
        // Function information (0-25 points)
        score += Math.min(25, functions.length * 2.5);
        // Intent confidence (0-20 points)
        if (intent) {
            score += intent.confidence * 20;
        }
        return Math.min(1, score / maxScore);
    }
    /**
     * Estimate token count for context elements
     */
    estimateTokenCount(essential, important, optional) {
        // Rough estimate: each element ≈ 50 tokens
        return (essential.length * 50) +
            (important.length * 30) +
            (optional.length * 20);
    }
    /**
     * Filter context to fit within token limit
     */
    filterContextByTokenLimit(context, maxTokens) {
        let currentTokens = 0;
        const filtered = {
            essential: [],
            important: [],
            optional: [],
            totalTokens: 0
        };
        // Always include essential
        for (const item of context.essential) {
            const tokens = this.estimateItemTokens(item);
            if (currentTokens + tokens <= maxTokens) {
                filtered.essential.push(item);
                currentTokens += tokens;
            }
        }
        // Include important if space available
        for (const item of context.important) {
            const tokens = this.estimateItemTokens(item);
            if (currentTokens + tokens <= maxTokens) {
                filtered.important.push(item);
                currentTokens += tokens;
            }
        }
        // Include optional if space available
        for (const item of context.optional) {
            const tokens = this.estimateItemTokens(item);
            if (currentTokens + tokens <= maxTokens) {
                filtered.optional.push(item);
                currentTokens += tokens;
            }
        }
        filtered.totalTokens = currentTokens;
        return filtered;
    }
    /**
     * Estimate tokens for a single item
     */
    estimateItemTokens(item) {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(item.length / 4);
    }
    /**
     * Rank context elements by importance
     */
    rankContextElements(context, intent) {
        const ranked = [];
        // Rank imports
        context.imports.forEach(imp => {
            let importance = 5; // Base importance
            if (intent?.type === 'import')
                importance += 10;
            if (imp.isDefault)
                importance += 2;
            ranked.push({
                element: `import ${imp.imports.join(', ')} from '${imp.module}'`,
                type: 'import',
                importance
            });
        });
        // Rank functions
        context.functions.forEach(func => {
            let importance = 7;
            if (intent?.type === 'function_call')
                importance += 10;
            if (func.isAsync)
                importance += 3;
            if (func.isExported)
                importance += 2;
            ranked.push({
                element: func.signature,
                type: 'function',
                importance
            });
        });
        // Rank types
        context.types.forEach(type => {
            let importance = 6;
            if (intent?.type === 'type_annotation')
                importance += 10;
            ranked.push({
                element: `type ${type.name} = ${type.definition}`,
                type: 'type',
                importance
            });
        });
        // Sort by importance (highest first)
        ranked.sort((a, b) => b.importance - a.importance);
        return ranked;
    }
}
exports.ContextSelector = ContextSelector;
//# sourceMappingURL=context-selector.js.map