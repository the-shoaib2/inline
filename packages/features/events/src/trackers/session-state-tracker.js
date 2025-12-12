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
exports.SessionStateTracker = void 0;
const vscode = __importStar(require("vscode"));
const event_types_1 = require("../event-types");
const shared_1 = require("@inline/shared");
/**
 * Tracks session and extension state events
 */
class SessionStateTracker {
    constructor(eventBus, context) {
        this.disposables = [];
        this.logger = new shared_1.Logger('SessionStateTracker');
        this.eventBus = eventBus;
        this.extensionContext = context;
        this.sessionStartTime = Date.now();
    }
    /**
     * Start tracking session state
     */
    start() {
        this.logger.info('Starting session state tracking');
        // Emit extension activated event
        this.emitExtensionActivated();
        // Watch for configuration changes
        vscode.workspace.onDidChangeConfiguration(event => {
            this.handleConfigurationChanged(event);
        }, null, this.disposables);
        // Watch for color theme changes
        vscode.window.onDidChangeActiveColorTheme(theme => {
            this.handleThemeChanged(theme);
        }, null, this.disposables);
    }
    /**
     * Emit extension activated event
     */
    emitExtensionActivated() {
        const event = {
            id: '',
            type: event_types_1.SessionStateEventType.EXTENSION_ACTIVATED,
            timestamp: Date.now(),
            source: 'session-state-tracker',
            metadata: {
                extensionMode: this.extensionContext.extensionMode,
                sessionStartTime: this.sessionStartTime
            }
        };
        this.eventBus.emit(event);
    }
    /**
     * Handle configuration changed
     */
    handleConfigurationChanged(event) {
        // Check if inline extension settings changed
        if (event.affectsConfiguration('inline')) {
            const config = vscode.workspace.getConfiguration('inline');
            const settingsEvent = {
                id: '',
                type: event_types_1.SessionStateEventType.SETTINGS_CHANGED,
                timestamp: Date.now(),
                source: 'session-state-tracker',
                metadata: {
                    affectedSection: 'inline',
                    settings: config
                }
            };
            this.eventBus.emit(settingsEvent);
        }
    }
    /**
     * Handle theme changed
     */
    handleThemeChanged(theme) {
        const event = {
            id: '',
            type: event_types_1.SessionStateEventType.THEME_CHANGED,
            timestamp: Date.now(),
            source: 'session-state-tracker',
            themeName: theme.kind === vscode.ColorThemeKind.Dark ? 'dark' :
                theme.kind === vscode.ColorThemeKind.Light ? 'light' : 'high-contrast'
        };
        this.eventBus.emit(event);
    }
    /**
     * Emit extension deactivation event
     */
    emitExtensionDeactivated() {
        const sessionDuration = Date.now() - this.sessionStartTime;
        const event = {
            id: '',
            type: event_types_1.SessionStateEventType.EXTENSION_DEACTIVATED,
            timestamp: Date.now(),
            source: 'session-state-tracker',
            metadata: {
                sessionDuration,
                sessionStartTime: this.sessionStartTime
            }
        };
        this.eventBus.emit(event);
    }
    /**
     * Emit plugin error event
     */
    emitPluginError(error) {
        const event = {
            id: '',
            type: event_types_1.SessionStateEventType.PLUGIN_ERROR,
            timestamp: Date.now(),
            source: 'session-state-tracker',
            error
        };
        this.eventBus.emit(event);
    }
    /**
     * Get session statistics
     */
    getSessionStats() {
        const duration = Date.now() - this.sessionStartTime;
        const hours = Math.floor(duration / 3600000);
        const minutes = Math.floor((duration % 3600000) / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return {
            startTime: this.sessionStartTime,
            duration,
            uptime: `${hours}h ${minutes}m ${seconds}s`
        };
    }
    /**
     * Dispose tracker
     */
    dispose() {
        this.logger.info('Stopping session state tracking');
        this.emitExtensionDeactivated();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.SessionStateTracker = SessionStateTracker;
//# sourceMappingURL=session-state-tracker.js.map