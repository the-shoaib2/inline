import * as vscode from 'vscode';


export class TelemetryManager {
    private events: TelemetryEvent[] = [];
    private sessionId: string;
    private enabled: boolean = false;

    constructor() {
        this.sessionId = this.generateSessionId();
        this.checkTelemetryConsent();
    }

    private checkTelemetryConsent(): void {
        // Respect VS Code's telemetry settings
        const config = vscode.workspace.getConfiguration('telemetry');
        this.enabled = config.get('enableTelemetry', false);
    }

    public trackEvent(eventName: string, properties?: Record<string, unknown>): void {
        if (!this.enabled) {
            return;
        }

        const event: TelemetryEvent = {
            name: eventName,
            properties: { ...this.getCommonProperties(), ...(properties || {}) },
            timestamp: new Date(),
            sessionId: this.sessionId
        };

        this.events.push(event);
        
        // In production, send to analytics service
        this.sendEvent(event);
    }

    private getCommonProperties(): Record<string, unknown> {
        return {
            platform: process.platform,
            arch: process.arch,
            version: vscode.version
        };
    }

    public trackCompletion(language: string, duration: number, cached: boolean): void {
        this.trackEvent('completion', {
            language,
            duration,
            cached,
            timestamp: Date.now()
        });
    }

    public trackModelDownload(modelId: string, success: boolean, duration: number): void {
        this.trackEvent('model_download', {
            modelId,
            success,
            duration
        });
    }

    public trackError(error: Error, context: string): void {
        this.trackEvent('error', {
            message: error.message,
            context,
            stack: error.stack
        });
    }

    private sendEvent(event: TelemetryEvent): void {
        // In production, send to analytics service
        // For now, just log
        console.log('[Telemetry]', event);
    }

    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    public getSessionId(): string {
        return this.sessionId;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }
}

interface TelemetryEvent {
    name: string;
    properties: Record<string, unknown>;
    timestamp: Date;
    sessionId: string;
}
