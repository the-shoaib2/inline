import * as vscode from 'vscode';

/**
 * Telemetry event tracking for the extension.
 *
 * Respects VS Code's telemetry settings and includes platform/version metadata.
 * Events are buffered locally and sent to analytics service (if enabled).
 * Opt-in based on user's VS Code telemetry configuration.
 */
export class TelemetryManager {
    private events: TelemetryEvent[] = [];
    private sessionId: string;
    private enabled: boolean = false;

    constructor() {
        this.sessionId = this.generateSessionId();
        this.checkTelemetryConsent();
    }

    /**
     * Check if telemetry is enabled via VS Code settings.
     */
    private checkTelemetryConsent(): void {
        const config = vscode.workspace.getConfiguration('telemetry');
        this.enabled = config.get('enableTelemetry', false);
    }

    /**
     * Track a generic event with optional properties.
     * Only sends if telemetry is enabled.
     */
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
        this.sendEvent(event);
    }

    /**
     * Add platform and version metadata to all events.
     */
    private getCommonProperties(): Record<string, unknown> {
        return {
            platform: process.platform,
            arch: process.arch,
            version: vscode.version
        };
    }

    /**
     * Track code completion performance metrics.
     */
    public trackCompletion(language: string, duration: number, cached: boolean): void {
        this.trackEvent('completion', {
            language,
            duration,
            cached,
            timestamp: Date.now()
        });
    }

    /**
     * Track model download events with success/failure status.
     */
    public trackModelDownload(modelId: string, success: boolean, duration: number): void {
        this.trackEvent('model_download', {
            modelId,
            success,
            duration
        });
    }

    /**
     * Track errors with context for debugging.
     */
    public trackError(error: Error, context: string): void {
        this.trackEvent('error', {
            message: error.message,
            context,
            stack: error.stack
        });
    }

    /**
     * Send event to analytics service (stub for production integration).
     */
    private sendEvent(event: TelemetryEvent): void {
        // TODO: Integrate with analytics service
        console.log('[Telemetry]', event);
    }

    /**
     * Generate unique session identifier.
     */
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
