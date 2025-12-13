/**
 * Pre-defined completion fixtures for E2E testing.
 * Provides realistic, deterministic completions for common scenarios.
 */
export interface CompletionFixture {
    prompt: string;
    completion: string;
    description: string;
}
export declare const COMPLETION_FIXTURES: {
    typescript: {
        functionFromComment: {
            prompt: string;
            completion: string;
            description: string;
        };
        asyncFunction: {
            prompt: string;
            completion: string;
            description: string;
        };
        classMethod: {
            prompt: string;
            completion: string;
            description: string;
        };
        interface: {
            prompt: string;
            completion: string;
            description: string;
        };
        importStatement: {
            prompt: string;
            completion: string;
            description: string;
        };
        arrowFunction: {
            prompt: string;
            completion: string;
            description: string;
        };
    };
    python: {
        functionFromComment: {
            prompt: string;
            completion: string;
            description: string;
        };
        classMethod: {
            prompt: string;
            completion: string;
            description: string;
        };
        importStatement: {
            prompt: string;
            completion: string;
            description: string;
        };
        decorator: {
            prompt: string;
            completion: string;
            description: string;
        };
        listComprehension: {
            prompt: string;
            completion: string;
            description: string;
        };
    };
    javascript: {
        functionFromComment: {
            prompt: string;
            completion: string;
            description: string;
        };
        classMethod: {
            prompt: string;
            completion: string;
            description: string;
        };
        arrowFunction: {
            prompt: string;
            completion: string;
            description: string;
        };
        promiseChain: {
            prompt: string;
            completion: string;
            description: string;
        };
    };
    java: {
        functionFromComment: {
            prompt: string;
            completion: string;
            description: string;
        };
        classConstructor: {
            prompt: string;
            completion: string;
            description: string;
        };
        getter: {
            prompt: string;
            completion: string;
            description: string;
        };
    };
    go: {
        functionFromComment: {
            prompt: string;
            completion: string;
            description: string;
        };
        structMethod: {
            prompt: string;
            completion: string;
            description: string;
        };
        errorHandling: {
            prompt: string;
            completion: string;
            description: string;
        };
    };
    rust: {
        functionFromComment: {
            prompt: string;
            completion: string;
            description: string;
        };
        implBlock: {
            prompt: string;
            completion: string;
            description: string;
        };
    };
    cpp: {
        functionFromComment: {
            prompt: string;
            completion: string;
            description: string;
        };
        classMethod: {
            prompt: string;
            completion: string;
            description: string;
        };
    };
    php: {
        functionFromComment: {
            prompt: string;
            completion: string;
            description: string;
        };
        classMethod: {
            prompt: string;
            completion: string;
            description: string;
        };
    };
    ruby: {
        functionFromComment: {
            prompt: string;
            completion: string;
            description: string;
        };
        classMethod: {
            prompt: string;
            completion: string;
            description: string;
        };
    };
};
/**
 * Get a completion fixture by language and scenario
 */
export declare function getFixture(language: string, scenario: string): CompletionFixture | null;
/**
 * Get all fixtures for a language
 */
export declare function getLanguageFixtures(language: string): Record<string, CompletionFixture> | null;
/**
 * Get all supported languages
 */
export declare function getSupportedLanguages(): string[];
//# sourceMappingURL=completion-fixtures.d.ts.map