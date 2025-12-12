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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityScanner = exports.RefactoringActions = exports.RefactoringEngine = exports.ErrorExplainer = exports.LlamaInference = exports.ModelRegistry = exports.ModelManager = void 0;
// Export model management
var model_manager_1 = require("./models/model-manager");
Object.defineProperty(exports, "ModelManager", { enumerable: true, get: function () { return model_manager_1.ModelManager; } });
var model_registry_1 = require("./registry/model-registry");
Object.defineProperty(exports, "ModelRegistry", { enumerable: true, get: function () { return model_registry_1.ModelRegistry; } });
var llama_engine_1 = require("./engines/llama-engine");
Object.defineProperty(exports, "LlamaInference", { enumerable: true, get: function () { return llama_engine_1.LlamaInference; } });
// Export optimization
__exportStar(require("./optimization/performance-tuner"), exports);
__exportStar(require("./optimization/prompt-cache"), exports);
// Analysis exports
var error_explainer_1 = require("./analysis/error-explainer");
Object.defineProperty(exports, "ErrorExplainer", { enumerable: true, get: function () { return error_explainer_1.ErrorExplainer; } });
var refactoring_engine_1 = require("./analysis/refactoring-engine");
Object.defineProperty(exports, "RefactoringEngine", { enumerable: true, get: function () { return refactoring_engine_1.RefactoringEngine; } });
var refactoring_actions_1 = require("./analysis/refactoring-actions");
Object.defineProperty(exports, "RefactoringActions", { enumerable: true, get: function () { return refactoring_actions_1.RefactoringActions; } });
var security_scanner_1 = require("./analysis/security-scanner");
Object.defineProperty(exports, "SecurityScanner", { enumerable: true, get: function () { return security_scanner_1.SecurityScanner; } });
//# sourceMappingURL=index.js.map