declare module '@inline/native-cpp' {
    export function simdSearch(text: string, pattern: string): number;
    export function mmapRead(filePath: string): string;
}
