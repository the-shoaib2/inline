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
exports.NetworkConfig = void 0;
const http = __importStar(require("http"));
const https = __importStar(require("https"));
class NetworkConfig {
    /**
     * Configure global network settings
     */
    static configure() {
        this.configureHTTP();
        this.configureHTTPS();
    }
    /**
     * Configure HTTP global agent
     */
    static configureHTTP() {
        if (http.globalAgent) {
            const agent = http.globalAgent;
            agent.timeout = this.DEFAULT_TIMEOUT;
            agent.autoSelectFamily = true;
            agent.autoSelectFamilyAttemptTimeout = this.AUTO_SELECT_FAMILY_TIMEOUT;
        }
    }
    /**
     * Configure HTTPS global agent
     */
    static configureHTTPS() {
        if (https.globalAgent) {
            const agent = https.globalAgent;
            agent.timeout = this.DEFAULT_TIMEOUT;
            agent.autoSelectFamily = true;
            agent.autoSelectFamilyAttemptTimeout = this.AUTO_SELECT_FAMILY_TIMEOUT;
        }
    }
    /**
     * Get configured HTTP agent
     */
    static getHttpAgent() {
        return new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 10
        });
    }
    /**
     * Get configured HTTPS agent
     */
    static getHttpsAgent() {
        return new https.Agent({
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 10
        });
    }
}
exports.NetworkConfig = NetworkConfig;
NetworkConfig.DEFAULT_TIMEOUT = 30000;
NetworkConfig.AUTO_SELECT_FAMILY_TIMEOUT = 3000;
//# sourceMappingURL=network-config.js.map