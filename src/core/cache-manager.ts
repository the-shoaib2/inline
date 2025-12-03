import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class CacheManager {
    private cacheDir: string;
    private maxCacheSize: number = 100 * 1024 * 1024; // 100MB
    private cacheIndex: Map<string, CacheEntry> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this.cacheDir = path.join(context.globalStorageUri.fsPath, 'cache');
        this.ensureCacheDirectory();
        this.loadCacheIndex();
    }

    private ensureCacheDirectory(): void {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    private loadCacheIndex(): void {
        const indexPath = path.join(this.cacheDir, 'index.json');
        if (fs.existsSync(indexPath)) {
            try {
                const data = fs.readFileSync(indexPath, 'utf-8');
                const entries = JSON.parse(data);
                this.cacheIndex = new Map(entries);
            } catch (error) {
                console.error('Failed to load cache index:', error);
            }
        }
    }

    private saveCacheIndex(): void {
        const indexPath = path.join(this.cacheDir, 'index.json');
        try {
            const entries = Array.from(this.cacheIndex.entries());
            fs.writeFileSync(indexPath, JSON.stringify(entries, null, 2));
        } catch (error) {
            console.error('Failed to save cache index:', error);
        }
    }

    public set(key: string, value: any): void {
        const hash = this.hashKey(key);
        const filePath = path.join(this.cacheDir, `${hash}.json`);
        
        try {
            fs.writeFileSync(filePath, JSON.stringify(value));
            
            this.cacheIndex.set(key, {
                hash,
                size: Buffer.byteLength(JSON.stringify(value)),
                timestamp: Date.now()
            });
            
            this.saveCacheIndex();
            this.enforceMaxSize();
        } catch (error) {
            console.error('Failed to write cache:', error);
        }
    }

    public get(key: string): any | null {
        const entry = this.cacheIndex.get(key);
        if (!entry) {
            return null;
        }

        const filePath = path.join(this.cacheDir, `${entry.hash}.json`);
        if (!fs.existsSync(filePath)) {
            this.cacheIndex.delete(key);
            return null;
        }

        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to read cache:', error);
            return null;
        }
    }

    public clear(): void {
        try {
            const files = fs.readdirSync(this.cacheDir);
            for (const file of files) {
                if (file !== 'index.json') {
                    fs.unlinkSync(path.join(this.cacheDir, file));
                }
            }
            this.cacheIndex.clear();
            this.saveCacheIndex();
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }

    public getSize(): number {
        let total = 0;
        for (const entry of this.cacheIndex.values()) {
            total += entry.size;
        }
        return total;
    }

    private enforceMaxSize(): void {
        let currentSize = this.getSize();
        
        if (currentSize <= this.maxCacheSize) {
            return;
        }

        // Sort by timestamp (oldest first)
        const entries = Array.from(this.cacheIndex.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        for (const [key, entry] of entries) {
            if (currentSize <= this.maxCacheSize) {
                break;
            }

            const filePath = path.join(this.cacheDir, `${entry.hash}.json`);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                this.cacheIndex.delete(key);
                currentSize -= entry.size;
            } catch (error) {
                console.error('Failed to delete cache file:', error);
            }
        }

        this.saveCacheIndex();
    }

    private hashKey(key: string): string {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
}

interface CacheEntry {
    hash: string;
    size: number;
    timestamp: number;
}
