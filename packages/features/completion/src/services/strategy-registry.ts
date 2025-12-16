
export enum StrategyType {
    DTO = 'dto',
    MOCK = 'mock',
    CRUD = 'crud',
    INTEGRATION_TEST = 'integration_test',
    CLASS_SCAFFOLDING = 'class_scaffolding',
    CODE_GENERATOR_UTILS = 'code_generator_utils',
    TEST = 'test',
    REGEX_COMPLETION = 'regex_completion',
    FUNCTION_COMPLETER = 'function_completer'
}

export interface BaseStrategy {
    supports(languageId: string): boolean;
}

export class CompletionStrategyRegistry {
    private static instance: CompletionStrategyRegistry;
    private strategies: Map<StrategyType, BaseStrategy[]> = new Map();

    private constructor() {}

    public static getInstance(): CompletionStrategyRegistry {
        if (!CompletionStrategyRegistry.instance) {
            CompletionStrategyRegistry.instance = new CompletionStrategyRegistry();
        }
        return CompletionStrategyRegistry.instance;
    }

    public register(type: StrategyType, strategy: BaseStrategy): void {
        if (!this.strategies.has(type)) {
            this.strategies.set(type, []);
        }
        this.strategies.get(type)!.push(strategy);
    }

    public getStrategy<T extends BaseStrategy>(type: StrategyType, languageId: string): T | undefined {
        const list = this.strategies.get(type);
        if (!list) return undefined;
        return list.find(s => s.supports(languageId)) as T | undefined;
    }

    public clear(): void {
        this.strategies.clear();
    }
}
