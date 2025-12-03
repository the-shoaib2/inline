import * as http from 'http';
import * as https from 'https';

/**
 * Network Configuration Utility
 * Configures network settings for optimal performance and timeout handling
 */
export class NetworkConfig {
    private static readonly DEFAULT_TIMEOUT = 1000; // 1 second
    private static readonly AUTO_SELECT_FAMILY_TIMEOUT = 1000; // 1 second

    /**
     * Configure global network settings
     */
    static configure(): void {
        this.configureHTTP();
        this.configureHTTPS();
    }

    /**
     * Configure HTTP agent
     */
    private static configureHTTP(): void {
        if (http.globalAgent) {
            (http.globalAgent as any).timeout = this.DEFAULT_TIMEOUT;
            (http.globalAgent as any).autoSelectFamily = true;
            (http.globalAgent as any).autoSelectFamilyAttemptTimeout = this.AUTO_SELECT_FAMILY_TIMEOUT;
        }
    }

    /**
     * Configure HTTPS agent
     */
    private static configureHTTPS(): void {
        if (https.globalAgent) {
            (https.globalAgent as any).timeout = this.DEFAULT_TIMEOUT;
            (https.globalAgent as any).autoSelectFamily = true;
            (https.globalAgent as any).autoSelectFamilyAttemptTimeout = this.AUTO_SELECT_FAMILY_TIMEOUT;
        }
    }

    /**
     * Create custom HTTP agent with timeout
     */
    static createHTTPAgent(timeout?: number): http.Agent {
        return new http.Agent({
            timeout: timeout || this.DEFAULT_TIMEOUT,
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 10
        } as any);
    }

    /**
     * Create custom HTTPS agent with timeout
     */
    static createHTTPSAgent(timeout?: number): https.Agent {
        return new https.Agent({
            timeout: timeout || this.DEFAULT_TIMEOUT,
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 10
        } as any);
    }
}
