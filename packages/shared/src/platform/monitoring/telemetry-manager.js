"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryManager = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Telemetry event tracking for the extension.
 *
 * Respects VS Code's telemetry settings and includes platform/version metadata.
 * Events are buffered locally and sent to analytics service (if enabled).
 * Opt-in based on user's VS Code telemetry configuration.
 */
class TelemetryManager {
    constructor() {
        this.events = [];
        this.enabled = false;
        this.sessionId = this.generateSessionId();
        this.checkTelemetryConsent();
    }
    /**
     * Check if telemetry is enabled via VS Code settings.
     */
    checkTelemetryConsent() {
        const config = vscode.workspace.getConfiguration('telemetry');
        this.enabled = config.get('enableTelemetry', false);
    }
    /**
     * Track a generic event with optional properties.
     * Only sends if telemetry is enabled.
     */
    trackEvent(eventName, properties) {
        if (!this.enabled) {
            return;
        }
        const event = {
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
    getCommonProperties() {
        return {
            platform: process.platform,
            arch: process.arch,
            version: vscode.version
        };
    }
    /**
     * Track code completion performance metrics.
     */
    trackCompletion(language, duration, cached) {
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
    trackModelDownload(modelId, success, duration) {
        this.trackEvent('model_download', {
            modelId,
            success,
            duration
        });
    }
    /**
     * Track errors with context for debugging.
     */
    trackError(error, context) {
        this.trackEvent('error', {
            message: error.message,
            context,
            stack: error.stack
        });
    }
    /**
     * Send event to analytics service (stub for production integration).
     */
    sendEvent(event) {
        // Analytics service integration can be added later if needed
        console.log('[Telemetry]', event);
    }
    /**
     * Generate unique session identifier.
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    getSessionId() {
        return this.sessionId;
    }
    isEnabled() {
        return this.enabled;
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}
exports.TelemetryManager = TelemetryManager;
//# sourceMappingURL=telemetry-manager.js.map