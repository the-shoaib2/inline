
export interface MockMethod {
    name: string;
    params: string[];
    returnType: string;
}

export interface MockStrategy {
    generateMock(interfaceName: string, methods: MockMethod[]): string;
    generateStub(className: string, methods: string[]): string;
    supports(languageId: string): boolean;
}
