import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface FeatureStatus {
    id: string;
    category: string;
    name: string;
    implemented: boolean;
    implementedAt?: string;
    notes?: string;
}

export class FeatureTracker {
    private features: Map<string, FeatureStatus> = new Map();
    private storagePath: string;

    constructor(context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, 'features.json');
        this.loadFeatures();
    }

    private loadFeatures(): void {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = fs.readFileSync(this.storagePath, 'utf8');
                const features = JSON.parse(data);
                this.features = new Map(Object.entries(features));
            }
        } catch (error) {
            console.error('Failed to load features:', error);
        }
    }

    private saveFeatures(): void {
        try {
            const dir = path.dirname(this.storagePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = Object.fromEntries(this.features);
            fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save features:', error);
        }
    }

    markImplemented(featureId: string, notes?: string): void {
        const feature = this.features.get(featureId);
        if (feature && !feature.implemented) {
            feature.implemented = true;
            feature.implementedAt = new Date().toISOString();
            feature.notes = notes;
            this.saveFeatures();
        }
    }

    registerFeature(feature: FeatureStatus): void {
        if (!this.features.has(feature.id)) {
            this.features.set(feature.id, feature);
            this.saveFeatures();
        }
    }

    getImplementedFeatures(): FeatureStatus[] {
        return Array.from(this.features.values()).filter(f => f.implemented);
    }

    generateMarkdown(): string {
        const categories = new Map<string, FeatureStatus[]>();
        
        for (const feature of this.features.values()) {
            if (!categories.has(feature.category)) {
                categories.set(feature.category, []);
            }
            categories.get(feature.category)!.push(feature);
        }

        let markdown = '# AI Code Editor Features - Implementation Status\n\n';
        
        for (const [category, features] of categories) {
            const implemented = features.filter(f => f.implemented).length;
            const total = features.length;
            const percentage = total > 0 ? Math.round((implemented / total) * 100) : 0;
            
            markdown += `## ${category} (${implemented}/${total} - ${percentage}%)\n\n`;
            
            for (const feature of features) {
                const status = feature.implemented ? '✅' : '❌';
                markdown += `- ${status} **${feature.name}**`;
                if (feature.notes) {
                    markdown += ` - ${feature.notes}`;
                }
                markdown += '\n';
            }
            markdown += '\n';
        }

        return markdown;
    }
}
