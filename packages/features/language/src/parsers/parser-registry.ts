import { ParserStrategy } from './strategies/parser-strategy.interface';

export class ParserRegistry {
    private static instance: ParserRegistry;
    private strategies: ParserStrategy[] = [];

    private constructor() {}

    public static getInstance(): ParserRegistry {
        if (!ParserRegistry.instance) {
            ParserRegistry.instance = new ParserRegistry();
        }
        return ParserRegistry.instance;
    }

    public register(strategy: ParserStrategy): void {
        this.strategies.push(strategy);
    }

    public getStrategy(language: string): ParserStrategy | undefined {
        return this.strategies.find(s => s.supports(language));
    }

    public clear(): void {
        this.strategies = [];
    }
}
