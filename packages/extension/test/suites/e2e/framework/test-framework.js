"use strict";
/**
 * E2E Test Framework
 * Provides infrastructure for testing all features across all languages
 */
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
exports.E2ETestFramework = void 0;
exports.createTestWorkspace = createTestWorkspace;
exports.openFile = openFile;
exports.waitFor = waitFor;
exports.triggerCompletion = triggerCompletion;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class E2ETestFramework {
    constructor(workspacePath) {
        this.results = [];
        this.startTime = 0;
        this.testWorkspace = workspacePath;
    }
    /**
     * Run a single test case
     */
    async runTest(testCase) {
        const startTime = Date.now();
        let passed = false;
        let error;
        let details;
        try {
            // Setup
            if (testCase.setup) {
                await testCase.setup();
            }
            // Execute
            await testCase.execute();
            // Verify
            passed = await testCase.verify();
            if (!passed) {
                error = 'Verification failed';
            }
        }
        catch (err) {
            passed = false;
            error = err instanceof Error ? err.message : String(err);
            details = err;
        }
        finally {
            // Cleanup
            if (testCase.cleanup) {
                try {
                    await testCase.cleanup();
                }
                catch (cleanupErr) {
                    console.error('Cleanup error:', cleanupErr);
                }
            }
        }
        const duration = Date.now() - startTime;
        const result = {
            feature: testCase.feature,
            language: testCase.language,
            passed,
            duration,
            error,
            details
        };
        this.results.push(result);
        return result;
    }
    /**
     * Run a test suite
     */
    async runSuite(suite) {
        console.log(`Running test suite: ${suite.name}`);
        const suiteResults = [];
        for (const testCase of suite.tests) {
            console.log(`  Running: ${testCase.name} (${testCase.language})`);
            const result = await this.runTest(testCase);
            suiteResults.push(result);
            const status = result.passed ? '✓' : '✗';
            console.log(`  ${status} ${testCase.name} (${result.duration}ms)`);
            if (result.error) {
                console.error(`    Error: ${result.error}`);
            }
        }
        return suiteResults;
    }
    /**
     * Run multiple test suites in parallel
     */
    async runSuitesParallel(suites, maxConcurrency = 5) {
        const allResults = [];
        const chunks = [];
        // Split suites into chunks for parallel execution
        for (let i = 0; i < suites.length; i += maxConcurrency) {
            chunks.push(suites.slice(i, i + maxConcurrency));
        }
        for (const chunk of chunks) {
            const chunkResults = await Promise.all(chunk.map(suite => this.runSuite(suite)));
            allResults.push(...chunkResults.flat());
        }
        return allResults;
    }
    /**
     * Get test statistics
     */
    getStatistics() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.passed).length;
        const failed = total - passed;
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
        const avgDuration = total > 0 ? totalDuration / total : 0;
        // Group by feature
        const byFeature = new Map();
        for (const result of this.results) {
            const stats = byFeature.get(result.feature) || { passed: 0, failed: 0 };
            if (result.passed) {
                stats.passed++;
            }
            else {
                stats.failed++;
            }
            byFeature.set(result.feature, stats);
        }
        // Group by language
        const byLanguage = new Map();
        for (const result of this.results) {
            const stats = byLanguage.get(result.language) || { passed: 0, failed: 0 };
            if (result.passed) {
                stats.passed++;
            }
            else {
                stats.failed++;
            }
            byLanguage.set(result.language, stats);
        }
        return {
            total,
            passed,
            failed,
            passRate: total > 0 ? (passed / total) * 100 : 0,
            totalDuration,
            avgDuration,
            byFeature: Object.fromEntries(byFeature),
            byLanguage: Object.fromEntries(byLanguage)
        };
    }
    /**
     * Generate HTML report
     */
    generateHTMLReport() {
        const stats = this.getStatistics();
        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .stat { background: white; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; }
        .stat-label { color: #666; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #333; color: white; }
        tr:hover { background: #f5f5f5; }
        .feature-section, .language-section { margin-top: 30px; }
    </style>
</head>
<body>
    <h1>E2E Test Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat">
                <div class="stat-value passed">${stats.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat">
                <div class="stat-value failed">${stats.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat">
                <div class="stat-value">${stats.passRate.toFixed(1)}%</div>
                <div class="stat-label">Pass Rate</div>
            </div>
        </div>
        <p>Total Duration: ${stats.totalDuration}ms | Average: ${stats.avgDuration.toFixed(2)}ms</p>
    </div>

    <div class="feature-section">
        <h2>Results by Feature</h2>
        <table>
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Pass Rate</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(stats.byFeature).map(([feature, data]) => `
                    <tr>
                        <td>${feature}</td>
                        <td class="passed">${data.passed}</td>
                        <td class="failed">${data.failed}</td>
                        <td>${((data.passed / (data.passed + data.failed)) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="language-section">
        <h2>Results by Language</h2>
        <table>
            <thead>
                <tr>
                    <th>Language</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Pass Rate</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(stats.byLanguage).map(([language, data]) => `
                    <tr>
                        <td>${language}</td>
                        <td class="passed">${data.passed}</td>
                        <td class="failed">${data.failed}</td>
                        <td>${((data.passed / (data.passed + data.failed)) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="details-section">
        <h2>Test Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Error</th>
                </tr>
            </thead>
            <tbody>
                ${this.results.map(result => `
                    <tr>
                        <td>${result.feature}</td>
                        <td>${result.language}</td>
                        <td class="${result.passed ? 'passed' : 'failed'}">${result.passed ? '✓ Passed' : '✗ Failed'}</td>
                        <td>${result.duration}ms</td>
                        <td>${result.error || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
        `;
        return html;
    }
    /**
     * Save report to file
     */
    async saveReport(outputPath) {
        const html = this.generateHTMLReport();
        await fs.promises.writeFile(outputPath, html, 'utf-8');
        console.log(`Report saved to: ${outputPath}`);
    }
    /**
     * Export results to JSON
     */
    exportJSON() {
        return JSON.stringify({
            statistics: this.getStatistics(),
            results: this.results,
            timestamp: new Date().toISOString()
        }, null, 2);
    }
    /**
     * Clear all results
     */
    clearResults() {
        this.results = [];
    }
    /**
     * Get all results
     */
    getResults() {
        return [...this.results];
    }
    /**
     * Wait for a condition to be true
     */
    async waitFor(condition, timeout = 5000, interval = 100) {
        return waitFor(condition, timeout, interval);
    }
    /**
     * Sleep for a specified duration
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.E2ETestFramework = E2ETestFramework;
/**
 * Helper function to create a test workspace
 */
async function createTestWorkspace(baseDir) {
    const workspaceDir = path.join(baseDir, `test-workspace-${Date.now()}`);
    await fs.promises.mkdir(workspaceDir, { recursive: true });
    return workspaceDir;
}
/**
 * Helper function to open a file in VS Code
 */
async function openFile(filePath) {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    return document;
}
/**
 * Helper function to wait for a condition
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    return false;
}
/**
 * Helper function to trigger completion
 */
async function triggerCompletion(document, position) {
    return await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', document.uri, position);
}
//# sourceMappingURL=test-framework.js.map