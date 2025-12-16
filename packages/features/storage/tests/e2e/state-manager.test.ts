
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StateManager } from '../../src/state/state-manager';
import { EventBus } from '@inline/events';
import * as vscode from 'vscode';

// Mock vscode
vi.mock('vscode', () => {
    return {
        Position: class {
            constructor(public line: number, public character: number) {}
        },
        Range: class {
            constructor(public start: any, public end: any) {
                this.start = start;
                this.end = end;
            }
        },
        Uri: {
            file: (path: string) => ({ fsPath: path, path, toString: () => path })
        },
        Selection: class {
             constructor(public anchor: any, public active: any) {}
        }
    };
});

// Mock Logger
vi.mock('@inline/shared', () => ({
    Logger: class {
        constructor() {}
        debug() {}
        info() {}
        warn() {}
        error() {}
    }
}));

describe('StateManager E2E', () => {
    let eventBus: EventBus;
    let stateManager: StateManager;

    beforeEach(() => {
        eventBus = new EventBus();
        stateManager = new StateManager(eventBus);
        stateManager.start();
    });

    afterEach(() => {
        stateManager.dispose();
        eventBus.dispose();
    });

    it('should track active document on editor focus', async () => {
        const uri = vscode.Uri.file('/test.ts');
        const event = {
            type: 'editor.active.changed',
            source: 'vscode',
            timestamp: Date.now(),
            document: {
                uri,
                languageId: 'typescript',
                version: 1
            },
            payload: {}
        };

        await eventBus.emit(event as any);

        const state = stateManager.getState();
        expect(state.activeDocument).toBeDefined();
        expect(state.activeDocument?.uri.toString()).toBe(uri.toString());
        expect(state.activeDocument?.languageId).toBe('typescript');
    });

    it('should track cursor history', async () => {
        const uri = vscode.Uri.file('/test.ts');
        
        // First activate doc
        await eventBus.emit({
            type: 'editor.active.changed',
            source: 'vscode',
            timestamp: Date.now(),
            document: { uri, languageId: 'typescript', version: 1 },
            payload: {}
        } as any);

        // Move cursor
        await eventBus.emit({
            type: 'editor.cursor.moved',
            source: 'vscode',
            timestamp: Date.now(),
            document: { uri, languageId: 'typescript', version: 1 },
            position: new vscode.Position(10, 5),
            selections: [new vscode.Selection(new vscode.Position(10, 5), new vscode.Position(10, 5))],
            payload: {}
        } as any);

        const history = stateManager.getCursorHistory();
        expect(history).toHaveLength(1);
        expect(history[0].position.line).toBe(10);
        expect(history[0].position.character).toBe(5);
    });

    it('should track recent edits', async () => {
        const uri = vscode.Uri.file('/test.ts');
        
        // Open doc
        await eventBus.emit({
             type: 'editor.active.changed',
             source: 'vscode',
             timestamp: Date.now(),
             document: { uri, languageId: 'typescript', version: 1 },
             payload: {}
        } as any);

        // Code edit
        await eventBus.emit({
            type: 'code.char.inserted',
            source: 'user',
            timestamp: Date.now(),
            document: { uri, languageId: 'typescript', version: 2 },
            changes: [
                { range: new vscode.Range(new vscode.Position(0,0), new vscode.Position(0,0)), text: 'a' }
            ],
            payload: {}
        } as any);

        const edits = stateManager.getRecentEdits(uri);
        expect(edits).toHaveLength(1);
        expect(edits[0].changes[0].text).toBe('a');
    });
});
