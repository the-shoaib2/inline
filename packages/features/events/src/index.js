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
exports.createEventTrackingManager = exports.EventTrackingManager = exports.disposeEventBus = exports.getEventBus = exports.EventBus = void 0;
// Export event tracking
var event_bus_1 = require("./event-bus");
Object.defineProperty(exports, "EventBus", { enumerable: true, get: function () { return event_bus_1.EventBus; } });
Object.defineProperty(exports, "getEventBus", { enumerable: true, get: function () { return event_bus_1.getEventBus; } });
Object.defineProperty(exports, "disposeEventBus", { enumerable: true, get: function () { return event_bus_1.disposeEventBus; } });
var event_tracking_manager_1 = require("./event-tracking-manager");
Object.defineProperty(exports, "EventTrackingManager", { enumerable: true, get: function () { return event_tracking_manager_1.EventTrackingManager; } });
Object.defineProperty(exports, "createEventTrackingManager", { enumerable: true, get: function () { return event_tracking_manager_1.createEventTrackingManager; } });
__exportStar(require("./event-types"), exports);
__exportStar(require("./event-normalizer"), exports);
//# sourceMappingURL=index.js.map