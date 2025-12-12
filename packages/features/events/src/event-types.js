"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStateEventType = exports.AIContextEventType = exports.PerformanceEventType = exports.VCSEventType = exports.ASTEventType = exports.ProjectContextEventType = exports.SyntaxSemanticEventType = exports.CodeContextEventType = exports.UserInteractionEventType = exports.CodeModificationEventType = exports.EditorEventType = exports.FileSystemEventType = exports.EventPriority = void 0;
/**
 * Event priority levels for processing
 */
var EventPriority;
(function (EventPriority) {
    EventPriority[EventPriority["LOW"] = 0] = "LOW";
    EventPriority[EventPriority["NORMAL"] = 1] = "NORMAL";
    EventPriority[EventPriority["HIGH"] = 2] = "HIGH";
    EventPriority[EventPriority["CRITICAL"] = 3] = "CRITICAL";
})(EventPriority || (exports.EventPriority = EventPriority = {}));
// ==================== File System Events ====================
var FileSystemEventType;
(function (FileSystemEventType) {
    FileSystemEventType["FILE_CREATED"] = "fs.file.created";
    FileSystemEventType["FILE_DELETED"] = "fs.file.deleted";
    FileSystemEventType["FILE_RENAMED"] = "fs.file.renamed";
    FileSystemEventType["FILE_MODIFIED"] = "fs.file.modified";
    FileSystemEventType["FILE_SAVED"] = "fs.file.saved";
    FileSystemEventType["FILE_OPENED"] = "fs.file.opened";
    FileSystemEventType["FILE_CLOSED"] = "fs.file.closed";
    FileSystemEventType["DIR_CREATED"] = "fs.dir.created";
    FileSystemEventType["DIR_DELETED"] = "fs.dir.deleted";
    FileSystemEventType["PERMISSIONS_CHANGED"] = "fs.permissions.changed";
    FileSystemEventType["EXTERNAL_MODIFICATION"] = "fs.external.modified";
})(FileSystemEventType || (exports.FileSystemEventType = FileSystemEventType = {}));
// ==================== Editor Events ====================
var EditorEventType;
(function (EditorEventType) {
    EditorEventType["CURSOR_MOVED"] = "editor.cursor.moved";
    EditorEventType["SELECTION_CHANGED"] = "editor.selection.changed";
    EditorEventType["SCROLL_CHANGED"] = "editor.scroll.changed";
    EditorEventType["ACTIVE_EDITOR_CHANGED"] = "editor.active.changed";
    EditorEventType["VISIBLE_EDITORS_CHANGED"] = "editor.visible.changed";
    EditorEventType["VIEWPORT_CHANGED"] = "editor.viewport.changed";
    EditorEventType["SPLIT_VIEW_CHANGED"] = "editor.split.changed";
    EditorEventType["TAB_CHANGED"] = "editor.tab.changed";
})(EditorEventType || (exports.EditorEventType = EditorEventType = {}));
// ==================== Code Modification Events ====================
var CodeModificationEventType;
(function (CodeModificationEventType) {
    CodeModificationEventType["CHARACTER_INSERTED"] = "code.char.inserted";
    CodeModificationEventType["CHARACTER_DELETED"] = "code.char.deleted";
    CodeModificationEventType["LINE_ADDED"] = "code.line.added";
    CodeModificationEventType["LINE_REMOVED"] = "code.line.removed";
    CodeModificationEventType["TEXT_PASTED"] = "code.paste";
    CodeModificationEventType["TEXT_COPIED"] = "code.copy";
    CodeModificationEventType["TEXT_CUT"] = "code.cut";
    CodeModificationEventType["UNDO"] = "code.undo";
    CodeModificationEventType["REDO"] = "code.redo";
    CodeModificationEventType["FIND_REPLACE"] = "code.findreplace";
    CodeModificationEventType["MULTI_CURSOR_EDIT"] = "code.multicursor";
    CodeModificationEventType["CODE_FOLDED"] = "code.folded";
    CodeModificationEventType["CODE_UNFOLDED"] = "code.unfolded";
    CodeModificationEventType["FORMATTING_APPLIED"] = "code.formatted";
})(CodeModificationEventType || (exports.CodeModificationEventType = CodeModificationEventType = {}));
// ==================== User Interaction Events ====================
var UserInteractionEventType;
(function (UserInteractionEventType) {
    UserInteractionEventType["KEYSTROKE"] = "user.keystroke";
    UserInteractionEventType["MOUSE_CLICK"] = "user.mouse.click";
    UserInteractionEventType["MOUSE_MOVE"] = "user.mouse.move";
    UserInteractionEventType["IDLE_START"] = "user.idle.start";
    UserInteractionEventType["IDLE_END"] = "user.idle.end";
    UserInteractionEventType["FOCUS_GAINED"] = "user.focus.gained";
    UserInteractionEventType["FOCUS_LOST"] = "user.focus.lost";
    UserInteractionEventType["SHORTCUT_USED"] = "user.shortcut";
    UserInteractionEventType["CONTEXT_MENU"] = "user.contextmenu";
    UserInteractionEventType["COMMAND_EXECUTED"] = "user.command";
    UserInteractionEventType["TERMINAL_COMMAND_EXECUTED"] = "user.terminal.command";
    UserInteractionEventType["TERMINAL_SESSION_STARTED"] = "user.terminal.started";
    UserInteractionEventType["TERMINAL_SESSION_ENDED"] = "user.terminal.ended";
})(UserInteractionEventType || (exports.UserInteractionEventType = UserInteractionEventType = {}));
// ==================== Code Context Events ====================
var CodeContextEventType;
(function (CodeContextEventType) {
    CodeContextEventType["SCOPE_ENTERED"] = "context.scope.entered";
    CodeContextEventType["SCOPE_EXITED"] = "context.scope.exited";
    CodeContextEventType["FUNCTION_ENTERED"] = "context.function.entered";
    CodeContextEventType["CLASS_ENTERED"] = "context.class.entered";
    CodeContextEventType["IMPORT_ADDED"] = "context.import.added";
    CodeContextEventType["VARIABLE_DECLARED"] = "context.variable.declared";
    CodeContextEventType["LANGUAGE_CHANGED"] = "context.language.changed";
    CodeContextEventType["BLOCK_DEPTH_CHANGED"] = "context.depth.changed";
})(CodeContextEventType || (exports.CodeContextEventType = CodeContextEventType = {}));
// ==================== Syntax & Semantic Events ====================
var SyntaxSemanticEventType;
(function (SyntaxSemanticEventType) {
    SyntaxSemanticEventType["SYNTAX_ERROR"] = "syntax.error";
    SyntaxSemanticEventType["LINT_WARNING"] = "syntax.lint.warning";
    SyntaxSemanticEventType["LINT_ERROR"] = "syntax.lint.error";
    SyntaxSemanticEventType["TYPE_ERROR"] = "syntax.type.error";
    SyntaxSemanticEventType["COMPLETION_TRIGGERED"] = "semantic.completion.triggered";
    SyntaxSemanticEventType["COMPLETION_ACCEPTED"] = "semantic.completion.accepted";
    SyntaxSemanticEventType["COMPLETION_REJECTED"] = "semantic.completion.rejected";
    SyntaxSemanticEventType["HOVER_TRIGGERED"] = "semantic.hover";
    SyntaxSemanticEventType["GOTO_DEFINITION"] = "semantic.goto.definition";
    SyntaxSemanticEventType["FIND_REFERENCES"] = "semantic.find.references";
    SyntaxSemanticEventType["RENAME_SYMBOL"] = "semantic.rename";
})(SyntaxSemanticEventType || (exports.SyntaxSemanticEventType = SyntaxSemanticEventType = {}));
// ==================== Project Context Events ====================
var ProjectContextEventType;
(function (ProjectContextEventType) {
    ProjectContextEventType["FILE_OPENED_IN_PROJECT"] = "project.file.opened";
    ProjectContextEventType["FILE_CLOSED_IN_PROJECT"] = "project.file.closed";
    ProjectContextEventType["DEPENDENCY_ADDED"] = "project.dependency.added";
    ProjectContextEventType["DEPENDENCY_REMOVED"] = "project.dependency.removed";
    ProjectContextEventType["CONFIG_CHANGED"] = "project.config.changed";
    ProjectContextEventType["BUILD_STARTED"] = "project.build.started";
    ProjectContextEventType["BUILD_COMPLETED"] = "project.build.completed";
    ProjectContextEventType["BUILD_FAILED"] = "project.build.failed";
    ProjectContextEventType["WORKSPACE_CHANGED"] = "project.workspace.changed";
})(ProjectContextEventType || (exports.ProjectContextEventType = ProjectContextEventType = {}));
// ==================== AST Events ====================
var ASTEventType;
(function (ASTEventType) {
    ASTEventType["AST_GENERATED"] = "ast.generated";
    ASTEventType["AST_UPDATED"] = "ast.updated";
    ASTEventType["NODE_CHANGED"] = "ast.node.changed";
    ASTEventType["SYMBOL_TABLE_UPDATED"] = "ast.symbols.updated";
    ASTEventType["SCOPE_CHAIN_MODIFIED"] = "ast.scope.modified";
    ASTEventType["DECLARATION_ADDED"] = "ast.declaration.added";
    ASTEventType["REFERENCE_ADDED"] = "ast.reference.added";
})(ASTEventType || (exports.ASTEventType = ASTEventType = {}));
// ==================== Version Control Events ====================
var VCSEventType;
(function (VCSEventType) {
    VCSEventType["GIT_STATUS_CHANGED"] = "vcs.git.status";
    VCSEventType["BRANCH_CHANGED"] = "vcs.git.branch";
    VCSEventType["COMMIT_CREATED"] = "vcs.git.commit";
    VCSEventType["MERGE_CONFLICT"] = "vcs.git.conflict";
    VCSEventType["FILE_STAGED"] = "vcs.git.staged";
    VCSEventType["FILE_UNSTAGED"] = "vcs.git.unstaged";
    VCSEventType["UNCOMMITTED_CHANGES"] = "vcs.git.uncommitted";
})(VCSEventType || (exports.VCSEventType = VCSEventType = {}));
// ==================== Performance Events ====================
var PerformanceEventType;
(function (PerformanceEventType) {
    PerformanceEventType["PARSE_TIME"] = "perf.parse";
    PerformanceEventType["AST_GENERATION_TIME"] = "perf.ast";
    PerformanceEventType["INDEX_BUILD_TIME"] = "perf.index";
    PerformanceEventType["SEARCH_QUERY_TIME"] = "perf.search";
    PerformanceEventType["MEMORY_USAGE"] = "perf.memory";
    PerformanceEventType["CPU_USAGE"] = "perf.cpu";
    PerformanceEventType["INFERENCE_TIME"] = "perf.inference";
})(PerformanceEventType || (exports.PerformanceEventType = PerformanceEventType = {}));
// ==================== AI/ML Context Events ====================
var AIContextEventType;
(function (AIContextEventType) {
    AIContextEventType["INFERENCE_REQUESTED"] = "ai.inference.requested";
    AIContextEventType["INFERENCE_COMPLETED"] = "ai.inference.completed";
    AIContextEventType["SUGGESTION_GENERATED"] = "ai.suggestion.generated";
    AIContextEventType["SUGGESTION_ACCEPTED"] = "ai.suggestion.accepted";
    AIContextEventType["SUGGESTION_REJECTED"] = "ai.suggestion.rejected";
    AIContextEventType["SUGGESTION_MODIFIED"] = "ai.suggestion.modified";
    AIContextEventType["USER_FEEDBACK"] = "ai.feedback";
    AIContextEventType["CONTEXT_WINDOW_BUILT"] = "ai.context.built";
    AIContextEventType["MODEL_LOADED"] = "ai.model.loaded";
    AIContextEventType["MODEL_UNLOADED"] = "ai.model.unloaded";
})(AIContextEventType || (exports.AIContextEventType = AIContextEventType = {}));
// ==================== Session & State Events ====================
var SessionStateEventType;
(function (SessionStateEventType) {
    SessionStateEventType["EXTENSION_ACTIVATED"] = "session.extension.activated";
    SessionStateEventType["EXTENSION_DEACTIVATED"] = "session.extension.deactivated";
    SessionStateEventType["SETTINGS_CHANGED"] = "session.settings.changed";
    SessionStateEventType["THEME_CHANGED"] = "session.theme.changed";
    SessionStateEventType["LANGUAGE_SERVER_STARTED"] = "session.lsp.started";
    SessionStateEventType["LANGUAGE_SERVER_STOPPED"] = "session.lsp.stopped";
    SessionStateEventType["PLUGIN_ERROR"] = "session.plugin.error";
    SessionStateEventType["PLUGIN_CRASH"] = "session.plugin.crash";
})(SessionStateEventType || (exports.SessionStateEventType = SessionStateEventType = {}));
//# sourceMappingURL=event-types.js.map