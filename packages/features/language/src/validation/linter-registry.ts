import { LinterStrategy } from './strategies/linter-strategy.interface';

export class LinterRegistry {
    private static instance: LinterRegistry;
    private strategies: LinterStrategy[] = [];

    private constructor() {}

    public static getInstance(): LinterRegistry {
        if (!LinterRegistry.instance) {
            LinterRegistry.instance = new LinterRegistry();
        }
        return LinterRegistry.instance;
    }

    public register(strategy: LinterStrategy): void {
        this.strategies.push(strategy);
    }

    public getStrategy(languageId: string): LinterStrategy | undefined {
        return this.strategies.find(s => s.supports(languageId));
    }

    public clear(): void {
        this.strategies = [];
    }
}
