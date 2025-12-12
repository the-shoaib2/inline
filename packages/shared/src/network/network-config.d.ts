import * as http from 'http';
import * as https from 'https';
export declare class NetworkConfig {
    private static readonly DEFAULT_TIMEOUT;
    private static readonly AUTO_SELECT_FAMILY_TIMEOUT;
    /**
     * Configure global network settings
     */
    static configure(): void;
    /**
     * Configure HTTP global agent
     */
    private static configureHTTP;
    /**
     * Configure HTTPS global agent
     */
    private static configureHTTPS;
    /**
     * Get configured HTTP agent
     */
    static getHttpAgent(): http.Agent;
    /**
     * Get configured HTTPS agent
     */
    static getHttpsAgent(): https.Agent;
}
//# sourceMappingURL=network-config.d.ts.map