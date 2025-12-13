/**
 * Platform Features Tests - All Languages
 * Covers: Event Tracking (U), Network & Offline (W), Configuration (X), UI & Status (Y)
 */
import { TestSuite } from '../framework/test-framework';
export declare class PlatformFeaturesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for Event Tracking
     */
    generateEventTests(): TestSuite;
    /**
     * Generate test suite for Network & Offline
     */
    generateNetworkTests(): TestSuite;
    /**
    * Generate test suite for Configuration
    */
    generateConfigTests(): TestSuite;
    /**
     * Generate test suite for UI & Status
     */
    generateUITests(): TestSuite;
    runAllTests(): Promise<void>;
}
//# sourceMappingURL=platform-features.test.d.ts.map