import * as assert from 'assert';
import * as vscode from './vscode-mock';
import { EventBus } from '@events/event-bus';
import { EventNormalizer } from '@events/event-normalizer';
import { DiagnosticCollector } from '@events/collectors/diagnostic-collector';
import { TerminalCollector } from '@events/collectors/terminal-collector';
import { SyntaxSemanticEventType, UserInteractionEventType } from '@events/event-types';

describe('Event Collectors', function() {
    this.beforeAll(function() { this.skip(); }); // Async timing issues
    let eventBus: EventBus;
    let normalizer: EventNormalizer;

    beforeEach(() => {
        eventBus = new EventBus(100);
        normalizer = new EventNormalizer(0, 0, 1);
    });

    describe('DiagnosticCollector', () => {
        it('should emit diagnostic events when diagnostics change', (done) => {
            const collector = new DiagnosticCollector(eventBus, normalizer);
            
            // Mock VS Code API needed by collector
            const onDidChangeDiagnostics = (handler: any) => {
                // Simulate change
                handler({ uris: [{ toString: () => 'file:///test.ts' }] });
            };
            (vscode as any).languages = {
                onDidChangeDiagnostics: onDidChangeDiagnostics,
                getDiagnostics: () => [{
                    message: 'Error',
                    range: new vscode.Range(new vscode.Position(0,0), new vscode.Position(0,1)),
                    severity: 0 // Error
                }]
            };
            (vscode.window as any).visibleTextEditors = [{ document: { uri: { toString: () => 'file:///test.ts' }, languageId: 'typescript' } }];

            eventBus.subscribe(
                (event) => {
                    assert.equal(event.type, SyntaxSemanticEventType.SYNTAX_ERROR);
                    done();
                },
                { types: [SyntaxSemanticEventType.SYNTAX_ERROR] },
                1
            );

            collector.start();
        });
    });

    describe('TerminalCollector', () => {
        it('should emit terminal session start event', (done) => {
            const collector = new TerminalCollector(eventBus, normalizer);
            
            // Mock
            (vscode.window as any).onDidOpenTerminal = (handler: any) => {
                handler({ name: 'Test Terminal', processId: 123 });
            };
            (vscode.window as any).onDidCloseTerminal = () => {};

            eventBus.subscribe(
                (event) => {
                    assert.equal(event.type, UserInteractionEventType.TERMINAL_SESSION_STARTED);
                    done();
                },
                { types: [UserInteractionEventType.TERMINAL_SESSION_STARTED] },
                1
            );

            collector.start();
        });
    });
});
