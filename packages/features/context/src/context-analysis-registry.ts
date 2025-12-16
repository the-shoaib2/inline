import { ContextAnalysisStrategy } from './strategies/context-analysis-strategy.interface';

export class ContextAnalysisRegistry {
    private static instance: ContextAnalysisRegistry;
    private strategies: ContextAnalysisStrategy[] = [];

    private constructor() {}

    public static getInstance(): ContextAnalysisRegistry {
        if (!ContextAnalysisRegistry.instance) {
            ContextAnalysisRegistry.instance = new ContextAnalysisRegistry();
        }
        return ContextAnalysisRegistry.instance;
    }

    public register(strategy: ContextAnalysisStrategy): void {
        this.strategies.push(strategy);
    }

    public getStrategy(languageId: string): ContextAnalysisStrategy | undefined {
        return this.strategies.find(s => s.supports(languageId));
    }

    public getSupportedExtensions(): string[] {
        return this.strategies.flatMap(s => s.getSupportedExtensions());
    }
    
    public clear(): void {
        this.strategies = [];
    }
}
