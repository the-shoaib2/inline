import * as http from 'http';
import * as https from 'https';

/**
 * Network Configuration Utility
 * Configures network settings for optimal performance and timeout handling
 */
interface ExtendedAgent extends http.Agent {
    timeout?: number;
    autoSelectFamily?: boolean;
    autoSelectFamilyAttemptTimeout?: number;
}

interface ExtendedHttpsAgent extends https.Agent {
    timeout?: number;
    autoSelectFamily?: boolean;
    autoSelectFamilyAttemptTimeout?: number;
}

export class NetworkConfig {
    private static readonly DEFAULT_TIMEOUT = 30000;
    private static readonly AUTO_SELECT_FAMILY_TIMEOUT = 3000;

    /**
     * Configure global network settings
     */
    public static configure(): void {
        this.configureHTTP();
        this.configureHTTPS();
    }

    /**
     * Configure HTTP global agent
     */
    private static configureHTTP(): void {
        if (http.globalAgent) {
            const agent = http.globalAgent as ExtendedAgent;
            agent.timeout = this.DEFAULT_TIMEOUT;
            agent.autoSelectFamily = true;
            agent.autoSelectFamilyAttemptTimeout = this.AUTO_SELECT_FAMILY_TIMEOUT;
        }
    }

    /**
     * Configure HTTPS global agent
     */
    private static configureHTTPS(): void {
        if (https.globalAgent) {
            const agent = https.globalAgent as ExtendedHttpsAgent;
            agent.timeout = this.DEFAULT_TIMEOUT;
            agent.autoSelectFamily = true;
            agent.autoSelectFamilyAttemptTimeout = this.AUTO_SELECT_FAMILY_TIMEOUT;
        }
    }

    /**
     * Get configured HTTP agent
     */
    public static getHttpAgent(): http.Agent {
        return new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 10
        });
    }

    /**
     * Get configured HTTPS agent
     */
    public static getHttpsAgent(): https.Agent {
        return new https.Agent({
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 10
        });
    }
}
