import * as vscode from 'vscode';
/**
 * Base event interface - all events extend this
 */
export interface BaseEvent {
    id: string;
    type: string;
    timestamp: number;
    source: string;
    metadata?: Record<string, any>;
}
/**
 * Event priority levels for processing
 */
export declare enum EventPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}
export declare enum FileSystemEventType {
    FILE_CREATED = "fs.file.created",
    FILE_DELETED = "fs.file.deleted",
    FILE_RENAMED = "fs.file.renamed",
    FILE_MODIFIED = "fs.file.modified",
    FILE_SAVED = "fs.file.saved",
    FILE_OPENED = "fs.file.opened",
    FILE_CLOSED = "fs.file.closed",
    DIR_CREATED = "fs.dir.created",
    DIR_DELETED = "fs.dir.deleted",
    PERMISSIONS_CHANGED = "fs.permissions.changed",
    EXTERNAL_MODIFICATION = "fs.external.modified"
}
export interface FileSystemEvent extends BaseEvent {
    type: FileSystemEventType;
    uri: vscode.Uri;
    oldUri?: vscode.Uri;
    isAutoSave?: boolean;
    isExternal?: boolean;
}
export declare enum EditorEventType {
    CURSOR_MOVED = "editor.cursor.moved",
    SELECTION_CHANGED = "editor.selection.changed",
    SCROLL_CHANGED = "editor.scroll.changed",
    ACTIVE_EDITOR_CHANGED = "editor.active.changed",
    VISIBLE_EDITORS_CHANGED = "editor.visible.changed",
    VIEWPORT_CHANGED = "editor.viewport.changed",
    SPLIT_VIEW_CHANGED = "editor.split.changed",
    TAB_CHANGED = "editor.tab.changed"
}
export interface CursorPosition {
    line: number;
    character: number;
}
export interface EditorEvent extends BaseEvent {
    type: EditorEventType;
    document: {
        uri: vscode.Uri;
        languageId: string;
        version: number;
    };
    position?: CursorPosition;
    selections?: vscode.Selection[];
    visibleRange?: vscode.Range;
}
export declare enum CodeModificationEventType {
    CHARACTER_INSERTED = "code.char.inserted",
    CHARACTER_DELETED = "code.char.deleted",
    LINE_ADDED = "code.line.added",
    LINE_REMOVED = "code.line.removed",
    TEXT_PASTED = "code.paste",
    TEXT_COPIED = "code.copy",
    TEXT_CUT = "code.cut",
    UNDO = "code.undo",
    REDO = "code.redo",
    FIND_REPLACE = "code.findreplace",
    MULTI_CURSOR_EDIT = "code.multicursor",
    CODE_FOLDED = "code.folded",
    CODE_UNFOLDED = "code.unfolded",
    FORMATTING_APPLIED = "code.formatted"
}
export interface CodeChange {
    range: vscode.Range;
    text: string;
    rangeLength: number;
}
export interface CodeModificationEvent extends BaseEvent {
    type: CodeModificationEventType;
    document: {
        uri: vscode.Uri;
        languageId: string;
        version: number;
    };
    changes: CodeChange[];
    reason?: vscode.TextDocumentChangeReason;
    isMultiCursor?: boolean;
    cursorCount?: number;
}
export declare enum UserInteractionEventType {
    KEYSTROKE = "user.keystroke",
    MOUSE_CLICK = "user.mouse.click",
    MOUSE_MOVE = "user.mouse.move",
    IDLE_START = "user.idle.start",
    IDLE_END = "user.idle.end",
    FOCUS_GAINED = "user.focus.gained",
    FOCUS_LOST = "user.focus.lost",
    SHORTCUT_USED = "user.shortcut",
    CONTEXT_MENU = "user.contextmenu",
    COMMAND_EXECUTED = "user.command",
    TERMINAL_COMMAND_EXECUTED = "user.terminal.command",
    TERMINAL_SESSION_STARTED = "user.terminal.started",
    TERMINAL_SESSION_ENDED = "user.terminal.ended"
}
export interface KeystrokePattern {
    key: string;
    timeSinceLast: number;
    isRepeated: boolean;
}
export interface UserInteractionEvent extends BaseEvent {
    type: UserInteractionEventType;
    keystroke?: KeystrokePattern;
    mousePosition?: {
        x: number;
        y: number;
    };
    command?: string;
    shortcut?: string;
    idleDuration?: number;
}
export declare enum CodeContextEventType {
    SCOPE_ENTERED = "context.scope.entered",
    SCOPE_EXITED = "context.scope.exited",
    FUNCTION_ENTERED = "context.function.entered",
    CLASS_ENTERED = "context.class.entered",
    IMPORT_ADDED = "context.import.added",
    VARIABLE_DECLARED = "context.variable.declared",
    LANGUAGE_CHANGED = "context.language.changed",
    BLOCK_DEPTH_CHANGED = "context.depth.changed"
}
export interface ScopeInfo {
    type: 'global' | 'class' | 'function' | 'block';
    name?: string;
    range: vscode.Range;
    depth: number;
}
export interface CodeContextEvent extends BaseEvent {
    type: CodeContextEventType;
    document: {
        uri: vscode.Uri;
        languageId: string;
    };
    scope?: ScopeInfo;
    symbol?: string;
    symbolType?: string;
}
export declare enum SyntaxSemanticEventType {
    SYNTAX_ERROR = "syntax.error",
    LINT_WARNING = "syntax.lint.warning",
    LINT_ERROR = "syntax.lint.error",
    TYPE_ERROR = "syntax.type.error",
    COMPLETION_TRIGGERED = "semantic.completion.triggered",
    COMPLETION_ACCEPTED = "semantic.completion.accepted",
    COMPLETION_REJECTED = "semantic.completion.rejected",
    HOVER_TRIGGERED = "semantic.hover",
    GOTO_DEFINITION = "semantic.goto.definition",
    FIND_REFERENCES = "semantic.find.references",
    RENAME_SYMBOL = "semantic.rename"
}
export interface SyntaxSemanticEvent extends BaseEvent {
    type: SyntaxSemanticEventType;
    document: {
        uri: vscode.Uri;
        languageId: string;
    };
    diagnostics?: vscode.Diagnostic[];
    position?: vscode.Position;
    symbol?: string;
    completionText?: string;
}
export declare enum ProjectContextEventType {
    FILE_OPENED_IN_PROJECT = "project.file.opened",
    FILE_CLOSED_IN_PROJECT = "project.file.closed",
    DEPENDENCY_ADDED = "project.dependency.added",
    DEPENDENCY_REMOVED = "project.dependency.removed",
    CONFIG_CHANGED = "project.config.changed",
    BUILD_STARTED = "project.build.started",
    BUILD_COMPLETED = "project.build.completed",
    BUILD_FAILED = "project.build.failed",
    WORKSPACE_CHANGED = "project.workspace.changed"
}
export interface ProjectContextEvent extends BaseEvent {
    type: ProjectContextEventType;
    workspaceFolder?: vscode.WorkspaceFolder;
    dependency?: string;
    configFile?: vscode.Uri;
    buildStatus?: 'success' | 'failure';
    buildOutput?: string;
}
export declare enum ASTEventType {
    AST_GENERATED = "ast.generated",
    AST_UPDATED = "ast.updated",
    NODE_CHANGED = "ast.node.changed",
    SYMBOL_TABLE_UPDATED = "ast.symbols.updated",
    SCOPE_CHAIN_MODIFIED = "ast.scope.modified",
    DECLARATION_ADDED = "ast.declaration.added",
    REFERENCE_ADDED = "ast.reference.added"
}
export interface ASTEvent extends BaseEvent {
    type: ASTEventType;
    document: {
        uri: vscode.Uri;
        languageId: string;
    };
    nodeType?: string;
    nodePath?: string;
    symbolName?: string;
    parseTime?: number;
}
export declare enum VCSEventType {
    GIT_STATUS_CHANGED = "vcs.git.status",
    BRANCH_CHANGED = "vcs.git.branch",
    COMMIT_CREATED = "vcs.git.commit",
    MERGE_CONFLICT = "vcs.git.conflict",
    FILE_STAGED = "vcs.git.staged",
    FILE_UNSTAGED = "vcs.git.unstaged",
    UNCOMMITTED_CHANGES = "vcs.git.uncommitted"
}
export interface VCSEvent extends BaseEvent {
    type: VCSEventType;
    repository?: string;
    branch?: string;
    commitHash?: string;
    conflictFiles?: vscode.Uri[];
    stagedFiles?: vscode.Uri[];
    unstagedFiles?: vscode.Uri[];
}
export declare enum PerformanceEventType {
    PARSE_TIME = "perf.parse",
    AST_GENERATION_TIME = "perf.ast",
    INDEX_BUILD_TIME = "perf.index",
    SEARCH_QUERY_TIME = "perf.search",
    MEMORY_USAGE = "perf.memory",
    CPU_USAGE = "perf.cpu",
    INFERENCE_TIME = "perf.inference"
}
export interface PerformanceEvent extends BaseEvent {
    type: PerformanceEventType;
    duration?: number;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    cpuUsage?: number;
    operation?: string;
}
export declare enum AIContextEventType {
    INFERENCE_REQUESTED = "ai.inference.requested",
    INFERENCE_COMPLETED = "ai.inference.completed",
    SUGGESTION_GENERATED = "ai.suggestion.generated",
    SUGGESTION_ACCEPTED = "ai.suggestion.accepted",
    SUGGESTION_REJECTED = "ai.suggestion.rejected",
    SUGGESTION_MODIFIED = "ai.suggestion.modified",
    USER_FEEDBACK = "ai.feedback",
    CONTEXT_WINDOW_BUILT = "ai.context.built",
    MODEL_LOADED = "ai.model.loaded",
    MODEL_UNLOADED = "ai.model.unloaded"
}
export interface AIContextEvent extends BaseEvent {
    type: AIContextEventType;
    modelName?: string;
    suggestionText?: string;
    confidence?: number;
    contextWindowSize?: number;
    inferenceTime?: number;
    accepted?: boolean;
    userModification?: string;
    feedbackRating?: number;
}
export declare enum SessionStateEventType {
    EXTENSION_ACTIVATED = "session.extension.activated",
    EXTENSION_DEACTIVATED = "session.extension.deactivated",
    SETTINGS_CHANGED = "session.settings.changed",
    THEME_CHANGED = "session.theme.changed",
    LANGUAGE_SERVER_STARTED = "session.lsp.started",
    LANGUAGE_SERVER_STOPPED = "session.lsp.stopped",
    PLUGIN_ERROR = "session.plugin.error",
    PLUGIN_CRASH = "session.plugin.crash"
}
export interface SessionStateEvent extends BaseEvent {
    type: SessionStateEventType;
    settingKey?: string;
    settingValue?: any;
    themeName?: string;
    languageServer?: string;
    error?: Error;
    crashReason?: string;
}
export type AnyEvent = FileSystemEvent | EditorEvent | CodeModificationEvent | UserInteractionEvent | CodeContextEvent | SyntaxSemanticEvent | ProjectContextEvent | ASTEvent | VCSEvent | PerformanceEvent | AIContextEvent | SessionStateEvent;
export interface EventFilter {
    types?: string[];
    sources?: string[];
    priority?: EventPriority;
    predicate?: (event: AnyEvent) => boolean;
}
export type EventHandler<T extends BaseEvent = AnyEvent> = (event: T) => void | Promise<void>;
export interface EventSubscription {
    id: string;
    filter: EventFilter;
    handler: EventHandler;
    priority: EventPriority;
}
//# sourceMappingURL=event-types.d.ts.map