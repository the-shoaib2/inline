/**
 * Telemetry event tracking for the extension.
 *
 * Respects VS Code's telemetry settings and includes platform/version metadata.
 * Events are buffered locally and sent to analytics service (if enabled).
 * Opt-in based on user's VS Code telemetry configuration.
 */
export declare class TelemetryManager {
    private events;
    private sessionId;
    private enabled;
    constructor();
    /**
     * Check if telemetry is enabled via VS Code settings.
     */
    private checkTelemetryConsent;
    /**
     * Track a generic event with optional properties.
     * Only sends if telemetry is enabled.
     */
    trackEvent(eventName: string, properties?: Record<string, unknown>): void;
    /**
     * Add platform and version metadata to all events.
     */
    private getCommonProperties;
    /**
     * Track code completion performance metrics.
     */
    trackCompletion(language: string, duration: number, cached: boolean): void;
    /**
     * Track model download events with success/failure status.
     */
    trackModelDownload(modelId: string, success: boolean, duration: number): void;
    /**
     * Track errors with context for debugging.
     */
    trackError(error: Error, context: string): void;
    /**
     * Send event to analytics service (stub for production integration).
     */
    private sendEvent;
    /**
     * Generate unique session identifier.
     */
    private generateSessionId;
    getSessionId(): string;
    isEnabled(): boolean;
    setEnabled(enabled: boolean): void;
}
//# sourceMappingURL=telemetry-manager.d.ts.map