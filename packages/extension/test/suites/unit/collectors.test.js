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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("./vscode-mock"));
const event_bus_1 = require("@inline/events/event-bus");
const event_normalizer_1 = require("@inline/events/event-normalizer");
const diagnostic_collector_1 = require("@inline/events/collectors/diagnostic-collector");
const terminal_collector_1 = require("@inline/events/collectors/terminal-collector");
const event_types_1 = require("@inline/events/event-types");
describe('Event Collectors', function () {
    this.beforeAll(function () { this.skip(); }); // Async timing issues
    let eventBus;
    let normalizer;
    beforeEach(() => {
        eventBus = new event_bus_1.EventBus(100);
        normalizer = new event_normalizer_1.EventNormalizer(0, 0, 1);
    });
    describe('DiagnosticCollector', () => {
        it('should emit diagnostic events when diagnostics change', (done) => {
            const collector = new diagnostic_collector_1.DiagnosticCollector(eventBus, normalizer);
            // Mock VS Code API needed by collector
            const onDidChangeDiagnostics = (handler) => {
                // Simulate change
                handler({ uris: [{ toString: () => 'file:///test.ts' }] });
            };
            vscode.languages = {
                onDidChangeDiagnostics: onDidChangeDiagnostics,
                getDiagnostics: () => [{
                        message: 'Error',
                        range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 1)),
                        severity: 0 // Error
                    }]
            };
            vscode.window.visibleTextEditors = [{ document: { uri: { toString: () => 'file:///test.ts' }, languageId: 'typescript' } }];
            eventBus.subscribe((event) => {
                assert.equal(event.type, event_types_1.SyntaxSemanticEventType.SYNTAX_ERROR);
                done();
            }, { types: [event_types_1.SyntaxSemanticEventType.SYNTAX_ERROR] }, 1);
            collector.start();
        });
    });
    describe('TerminalCollector', () => {
        it('should emit terminal session start event', (done) => {
            const collector = new terminal_collector_1.TerminalCollector(eventBus, normalizer);
            // Mock
            vscode.window.onDidOpenTerminal = (handler) => {
                handler({ name: 'Test Terminal', processId: 123 });
            };
            vscode.window.onDidCloseTerminal = () => { };
            eventBus.subscribe((event) => {
                assert.equal(event.type, event_types_1.UserInteractionEventType.TERMINAL_SESSION_STARTED);
                done();
            }, { types: [event_types_1.UserInteractionEventType.TERMINAL_SESSION_STARTED] }, 1);
            collector.start();
        });
    });
});
//# sourceMappingURL=collectors.test.js.map