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
exports.FileSystemCollector = void 0;
const vscode = __importStar(require("vscode"));
const event_types_1 = require("../event-types");
const shared_1 = require("@inline/shared");
/**
 * Collects file system events from VS Code
 */
class FileSystemCollector {
    constructor(eventBus, normalizer) {
        this.disposables = [];
        this.fileWatcher = null;
        this.logger = new shared_1.Logger('FileSystemCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
    }
    /**
     * Start collecting file system events
     */
    start() {
        this.logger.info('Starting file system event collection');
        // Watch for file creation
        this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
        this.fileWatcher.onDidCreate(uri => {
            this.handleFileCreated(uri);
        }, null, this.disposables);
        this.fileWatcher.onDidDelete(uri => {
            this.handleFileDeleted(uri);
        }, null, this.disposables);
        this.fileWatcher.onDidChange(uri => {
            this.handleFileModified(uri);
        }, null, this.disposables);
        // Watch for file saves
        vscode.workspace.onDidSaveTextDocument(document => {
            this.handleFileSaved(document);
        }, null, this.disposables);
        // Watch for file opens
        vscode.workspace.onDidOpenTextDocument(document => {
            this.handleFileOpened(document);
        }, null, this.disposables);
        // Watch for file closes
        vscode.workspace.onDidCloseTextDocument(document => {
            this.handleFileClosed(document);
        }, null, this.disposables);
    }
    /**
     * Handle file created event
     */
    handleFileCreated(uri) {
        const event = {
            id: '',
            type: event_types_1.FileSystemEventType.FILE_CREATED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri
        };
        this.emitEvent(event);
    }
    /**
     * Handle file deleted event
     */
    handleFileDeleted(uri) {
        const event = {
            id: '',
            type: event_types_1.FileSystemEventType.FILE_DELETED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri
        };
        this.emitEvent(event);
    }
    /**
     * Handle file modified event
     */
    handleFileModified(uri) {
        const event = {
            id: '',
            type: event_types_1.FileSystemEventType.FILE_MODIFIED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri,
            isExternal: true
        };
        this.emitEvent(event);
    }
    /**
     * Handle file saved event
     */
    handleFileSaved(document) {
        const event = {
            id: '',
            type: event_types_1.FileSystemEventType.FILE_SAVED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri: document.uri,
            isAutoSave: false // VS Code doesn't provide this info directly
        };
        this.emitEvent(event);
    }
    /**
     * Handle file opened event
     */
    handleFileOpened(document) {
        const event = {
            id: '',
            type: event_types_1.FileSystemEventType.FILE_OPENED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri: document.uri
        };
        this.emitEvent(event);
    }
    /**
     * Handle file closed event
     */
    handleFileClosed(document) {
        const event = {
            id: '',
            type: event_types_1.FileSystemEventType.FILE_CLOSED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri: document.uri
        };
        this.emitEvent(event);
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
        this.logger.info('Stopping file system event collection');
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
        }
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.FileSystemCollector = FileSystemCollector;
//# sourceMappingURL=file-system-collector.js.map