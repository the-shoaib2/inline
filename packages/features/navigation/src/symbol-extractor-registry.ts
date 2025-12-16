import { SymbolExtractorStrategy } from './strategies/symbol-extractor-strategy.interface';

export class SymbolExtractorRegistry {
    private static instance: SymbolExtractorRegistry;
    private strategies: SymbolExtractorStrategy[] = [];

    private constructor() {}

    public static getInstance(): SymbolExtractorRegistry {
        if (!SymbolExtractorRegistry.instance) {
            SymbolExtractorRegistry.instance = new SymbolExtractorRegistry();
        }
        return SymbolExtractorRegistry.instance;
    }

    public register(strategy: SymbolExtractorStrategy): void {
        this.strategies.push(strategy);
    }

    public getStrategy(languageId: string): SymbolExtractorStrategy | undefined {
        return this.strategies.find(s => s.supports(languageId));
    }

    public clear(): void {
        this.strategies = [];
    }
}
