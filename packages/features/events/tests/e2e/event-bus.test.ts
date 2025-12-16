import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventBus } from '../../src/event-bus';
import { 
    EventPriority, 
    FileSystemEventType, 
    EditorEventType,
    FileSystemEvent,
    EditorEvent 
} from '../../src/event-types';
import * as vscode from 'vscode';

// Mock VS Code types
const mockUri = { fsPath: '/test/path', toString: () => 'file:///test/path' } as vscode.Uri;

describe('EventBus E2E', () => {
    let eventBus: EventBus;

    beforeEach(() => {
        eventBus = new EventBus();
    });

    afterEach(() => {
        eventBus.dispose();
    });

    it('should subscribe and receive events', async () => {
        const handler = vi.fn();
        eventBus.subscribe(handler, { types: [FileSystemEventType.FILE_CREATED] });

        const event: FileSystemEvent = {
            id: '1',
            type: FileSystemEventType.FILE_CREATED,
            timestamp: Date.now(),
            source: 'test',
            uri: mockUri
        };

        await eventBus.emit(event);

        expect(handler).toHaveBeenCalledWith(event);
    });

    it('should filter events by type', async () => {
        const handler = vi.fn();
        eventBus.subscribe(handler, { types: [FileSystemEventType.FILE_CREATED] });

        const event: FileSystemEvent = {
            id: '2',
            type: FileSystemEventType.FILE_DELETED, // Different type
            timestamp: Date.now(),
            source: 'test',
            uri: mockUri
        };

        await eventBus.emit(event);

        expect(handler).not.toHaveBeenCalled();
    });

    it('should handle priority correctly', async () => {
        const callOrder: string[] = [];
        
        eventBus.subscribe(() => { callOrder.push('low'); }, {}, EventPriority.LOW);
        eventBus.subscribe(() => { callOrder.push('high'); }, {}, EventPriority.HIGH);
        eventBus.subscribe(() => { callOrder.push('normal'); }, {}, EventPriority.NORMAL);

        const event: EditorEvent = {
            id: '3',
            type: EditorEventType.CURSOR_MOVED,
            timestamp: Date.now(),
            source: 'test',
            document: { uri: mockUri, languageId: 'typescript', version: 1 }
        };

        await eventBus.emit(event);

        expect(callOrder).toEqual(['high', 'normal', 'low']);
    });

    it('should unsubscribe correctly', async () => {
        const handler = vi.fn();
        const subId = eventBus.subscribe(handler);

        const event: FileSystemEvent = {
            id: '4',
            type: FileSystemEventType.FILE_CREATED,
            timestamp: Date.now(),
            source: 'test',
            uri: mockUri
        };

        await eventBus.emit(event);
        expect(handler).toHaveBeenCalledTimes(1);

        eventBus.unsubscribe(subId);
        await eventBus.emit(event);
        expect(handler).toHaveBeenCalledTimes(1); // Should not increase
    });
});
