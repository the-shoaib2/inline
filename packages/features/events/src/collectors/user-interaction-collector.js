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
exports.UserInteractionCollector = void 0;
const vscode = __importStar(require("vscode"));
const event_types_1 = require("../event-types");
const shared_1 = require("@inline/shared");
/**
 * Collects user interaction events
 */
class UserInteractionCollector {
    constructor(eventBus, normalizer, idleThresholdMs = 60000, // 1 minute
    trackKeystrokes = false) {
        this.disposables = [];
        this.lastActivityTime = Date.now();
        this.idleCheckInterval = null;
        this.isIdle = false;
        this.lastKeystrokeTime = 0;
        this.logger = new shared_1.Logger('UserInteractionCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
        this.idleThresholdMs = idleThresholdMs;
        this.trackKeystrokes = trackKeystrokes;
    }
    /**
     * Start collecting user interaction events
     */
    start() {
        this.logger.info('Starting user interaction event collection');
        // Watch for window focus changes
        vscode.window.onDidChangeWindowState(state => {
            this.handleWindowStateChanged(state);
        }, null, this.disposables);
        // Watch for command execution
        // Note: VS Code doesn't provide a direct API for this,
        // but we can track it through other means
        // Start idle detection
        this.startIdleDetection();
        // Track document changes as activity indicator
        vscode.workspace.onDidChangeTextDocument(() => {
            this.recordActivity();
            if (this.trackKeystrokes) {
                this.handleKeystroke();
            }
        }, null, this.disposables);
        // Track selection changes as activity indicator
        vscode.window.onDidChangeTextEditorSelection(() => {
            this.recordActivity();
        }, null, this.disposables);
    }
    /**
     * Handle window state changed
     */
    handleWindowStateChanged(state) {
        const event = {
            id: '',
            type: state.focused ?
                event_types_1.UserInteractionEventType.FOCUS_GAINED :
                event_types_1.UserInteractionEventType.FOCUS_LOST,
            timestamp: Date.now(),
            source: 'user-interaction-collector'
        };
        this.emitEvent(event);
        if (state.focused) {
            this.recordActivity();
        }
    }
    /**
     * Handle keystroke (privacy-aware)
     */
    handleKeystroke() {
        const now = Date.now();
        const timeSinceLast = now - this.lastKeystrokeTime;
        // Only track timing patterns, not actual keys
        const event = {
            id: '',
            type: event_types_1.UserInteractionEventType.KEYSTROKE,
            timestamp: now,
            source: 'user-interaction-collector',
            keystroke: {
                key: '', // Don't track actual key for privacy
                timeSinceLast,
                isRepeated: timeSinceLast < 100
            }
        };
        this.emitEvent(event);
        this.lastKeystrokeTime = now;
    }
    /**
     * Record user activity
     */
    recordActivity() {
        const wasIdle = this.isIdle;
        this.lastActivityTime = Date.now();
        this.isIdle = false;
        // If was idle, emit idle end event
        if (wasIdle) {
            const event = {
                id: '',
                type: event_types_1.UserInteractionEventType.IDLE_END,
                timestamp: Date.now(),
                source: 'user-interaction-collector'
            };
            this.emitEvent(event);
        }
    }
    /**
     * Start idle detection
     */
    startIdleDetection() {
        this.idleCheckInterval = setInterval(() => {
            this.checkIdle();
        }, 10000); // Check every 10 seconds
    }
    /**
     * Check if user is idle
     */
    checkIdle() {
        const now = Date.now();
        const timeSinceActivity = now - this.lastActivityTime;
        if (!this.isIdle && timeSinceActivity >= this.idleThresholdMs) {
            this.isIdle = true;
            const event = {
                id: '',
                type: event_types_1.UserInteractionEventType.IDLE_START,
                timestamp: now,
                source: 'user-interaction-collector',
                idleDuration: timeSinceActivity
            };
            this.emitEvent(event);
        }
    }
    /**
     * Emit event through normalizer and event bus
     */
    emitEvent(event) {
        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }
    /**
     * Stop collecting events and dispose resources
     */
    dispose() {
        this.logger.info('Stopping user interaction event collection');
        if (this.idleCheckInterval) {
            clearInterval(this.idleCheckInterval);
            this.idleCheckInterval = null;
        }
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.UserInteractionCollector = UserInteractionCollector;
//# sourceMappingURL=user-interaction-collector.js.map