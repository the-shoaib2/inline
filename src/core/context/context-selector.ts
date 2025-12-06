// Context Selector - Intelligent context selection and prioritization
// Provides adaptive, intent-based context selection for optimal completions

import * as vscode from 'vscode';
import type {
    CodeContext, CursorIntent, FunctionInfo, ClassInfo, ImportInfo,
    TypeInfo, InterfaceInfo, SymbolInfo
} from './context-engine';

export interface OptimizedContext {
    prefix: string;
    suffix: string;
    prioritizedSymbols: SymbolInfo[];
    relevantTypes: TypeInfo[];
    relevantFunctions: FunctionInfo[];
    suggestedImports: ImportInfo[];
    contextScore: number;
}

export interface PrioritizedContext {
    essential: string[];      // Must include
    important: string[];      // Should include
    optional: string[];       // Nice to have
    totalTokens: number;
}

export class ContextSelector {
    private maxContextTokens: number = 4000;

    /**
     * Select optimal context based on cursor position and intent
     */
    selectOptimalContext(
        document: vscode.TextDocument,
        position: vscode.Position,
        intent: CursorIntent | null,
        availableContext: CodeContext
    ): OptimizedContext {
        // Calculate adaptive prefix/suffix ratio
        const ratio = this.calculateOptimalRatio(position, document);
        
        // Adjust prefix and suffix based on ratio
        const { prefix, suffix } = this.adjustContextRatio(
            availableContext.prefix,
            availableContext.suffix,
            ratio
        );

        // Prioritize symbols based on intent
        const prioritizedSymbols = this.prioritizeSymbols(
            availableContext.symbolTable,
            intent,
            position
        );

        // Select relevant types
        const relevantTypes = this.selectRelevantTypes(
            availableContext.types,
            availableContext.interfaces,
            intent
        );

        // Select relevant functions
        const relevantFunctions = this.selectRelevantFunctions(
            availableContext.functions,
            intent,
            position
        );

        // Suggest imports based on intent
        const suggestedImports = this.suggestImports(
            availableContext.imports,
            intent
        );

        // Calculate context quality score
        const contextScore = this.calculateContextScore(
            prioritizedSymbols,
            relevantTypes,
            relevantFunctions,
            intent
        );

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
     * Prioritize context elements based on intent
     */
    prioritizeContext(
        context: CodeContext,
        intent: CursorIntent | null
    ): PrioritizedContext {
        const essential: string[] = [];
        const important: string[] = [];
        const optional: string[] = [];

        if (!intent) {
            // Default prioritization
            essential.push('Current file context');
            important.push('Imports', 'Functions', 'Classes');
            optional.push('Types', 'Interfaces', 'Variables');
        } else {
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

        // Estimate token count
        const totalTokens = this.estimateTokenCount(essential, important, optional);

        return {
            essential,
            important,
            optional,
            totalTokens
        };
    }

    /**
     * Calculate optimal prefix/suffix ratio based on cursor position
     */
    calculateOptimalRatio(
        position: vscode.Position,
        document: vscode.TextDocument
    ): { prefixRatio: number; suffixRatio: number } {
        const totalLines = document.lineCount;
        const currentLine = position.line;
        const linePosition = currentLine / totalLines;

        // Adaptive ratio based on position
        if (linePosition < 0.2) {
            // Near start of file - more suffix context
            return { prefixRatio: 0.4, suffixRatio: 0.6 };
        } else if (linePosition > 0.8) {
            // Near end of file - more prefix context
            return { prefixRatio: 0.8, suffixRatio: 0.2 };
        } else if (linePosition > 0.4 && linePosition < 0.6) {
            // Middle of file - balanced
            return { prefixRatio: 0.5, suffixRatio: 0.5 };
        } else {
            // Default - slightly more prefix
            return { prefixRatio: 0.7, suffixRatio: 0.3 };
        }
    }

    /**
     * Adjust context based on ratio
     */
    private adjustContextRatio(
        prefix: string,
        suffix: string,
        ratio: { prefixRatio: number; suffixRatio: number }
    ): { prefix: string; suffix: string } {
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
    private prioritizeSymbols(
        symbolTable: Map<string, SymbolInfo>,
        intent: CursorIntent | null,
        position: vscode.Position
    ): SymbolInfo[] {
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
    private selectRelevantTypes(
        types: TypeInfo[],
        interfaces: InterfaceInfo[],
        intent: CursorIntent | null
    ): TypeInfo[] {
        if (!intent || intent.type !== 'type_annotation' && intent.type !== 'variable_declaration') {
            return types.slice(0, 5); // Top 5 types
        }

        // For type-related intents, include more types
        return types.slice(0, 10);
    }

    /**
     * Select relevant functions based on intent and proximity
     */
    private selectRelevantFunctions(
        functions: FunctionInfo[],
        intent: CursorIntent | null,
        position: vscode.Position
    ): FunctionInfo[] {
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
    private suggestImports(
        imports: ImportInfo[],
        intent: CursorIntent | null
    ): ImportInfo[] {
        if (!intent || intent.type !== 'import') {
            return imports.slice(0, 3);
        }

        // For import intent, show more imports
        return imports.slice(0, 10);
    }

    /**
     * Calculate context quality score (0-1)
     */
    private calculateContextScore(
        symbols: SymbolInfo[],
        types: TypeInfo[],
        functions: FunctionInfo[],
        intent: CursorIntent | null
    ): number {
        let score = 0;
        let maxScore = 100;

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
    private estimateTokenCount(
        essential: string[],
        important: string[],
        optional: string[]
    ): number {
        // Rough estimate: each element ≈ 50 tokens
        return (essential.length * 50) +
               (important.length * 30) +
               (optional.length * 20);
    }

    /**
     * Filter context to fit within token limit
     */
    filterContextByTokenLimit(
        context: PrioritizedContext,
        maxTokens: number
    ): PrioritizedContext {
        let currentTokens = 0;
        const filtered: PrioritizedContext = {
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
    private estimateItemTokens(item: string): number {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(item.length / 4);
    }

    /**
     * Rank context elements by importance
     */
    rankContextElements(
        context: CodeContext,
        intent: CursorIntent | null
    ): Array<{ element: string; type: string; importance: number }> {
        const ranked: Array<{ element: string; type: string; importance: number }> = [];

        // Rank imports
        context.imports.forEach(imp => {
            let importance = 5; // Base importance
            if (intent?.type === 'import') importance += 10;
            if (imp.isDefault) importance += 2;
            
            ranked.push({
                element: `import ${imp.imports.join(', ')} from '${imp.module}'`,
                type: 'import',
                importance
            });
        });

        // Rank functions
        context.functions.forEach(func => {
            let importance = 7;
            if (intent?.type === 'function_call') importance += 10;
            if (func.isAsync) importance += 3;
            if (func.isExported) importance += 2;
            
            ranked.push({
                element: func.signature,
                type: 'function',
                importance
            });
        });

        // Rank types
        context.types.forEach(type => {
            let importance = 6;
            if (intent?.type === 'type_annotation') importance += 10;
            
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
