/**
 * E2E Test Framework
 * Provides infrastructure for testing all features across all languages
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface TestResult {
    feature: string;
    language: string;
    passed: boolean;
    duration: number;
    error?: string;
    details?: any;
}

export interface TestSuite {
    name: string;
    tests: TestCase[];
}

export interface TestCase {
    name: string;
    language: string;
    feature: string;
    setup?: () => Promise<void>;
    execute: () => Promise<void>;
    verify: () => Promise<boolean>;
    cleanup?: () => Promise<void>;
}

export class E2ETestFramework {
    private results: TestResult[] = [];
    private startTime: number = 0;
    private testWorkspace: string;

    constructor(workspacePath: string) {
        this.testWorkspace = workspacePath;
    }

    /**
     * Run a single test case
     */
    async runTest(testCase: TestCase): Promise<TestResult> {
        const startTime = Date.now();
        let passed = false;
        let error: string | undefined;
        let details: any;

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
        } catch (err) {
            passed = false;
            error = err instanceof Error ? err.message : String(err);
            details = err;
        } finally {
            // Cleanup
            if (testCase.cleanup) {
                try {
                    await testCase.cleanup();
                } catch (cleanupErr) {
                    console.error('Cleanup error:', cleanupErr);
                }
            }
        }

        const duration = Date.now() - startTime;
        const result: TestResult = {
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
    async runSuite(suite: TestSuite): Promise<TestResult[]> {
        console.log(`Running test suite: ${suite.name}`);
        const suiteResults: TestResult[] = [];

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
    async runSuitesParallel(suites: TestSuite[], maxConcurrency: number = 5): Promise<TestResult[]> {
        const allResults: TestResult[] = [];
        const chunks: TestSuite[][] = [];

        // Split suites into chunks for parallel execution
        for (let i = 0; i < suites.length; i += maxConcurrency) {
            chunks.push(suites.slice(i, i + maxConcurrency));
        }

        for (const chunk of chunks) {
            const chunkResults = await Promise.all(
                chunk.map(suite => this.runSuite(suite))
            );
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
        const byFeature = new Map<string, { passed: number; failed: number }>();
        for (const result of this.results) {
            const stats = byFeature.get(result.feature) || { passed: 0, failed: 0 };
            if (result.passed) {
                stats.passed++;
            } else {
                stats.failed++;
            }
            byFeature.set(result.feature, stats);
        }

        // Group by language
        const byLanguage = new Map<string, { passed: number; failed: number }>();
        for (const result of this.results) {
            const stats = byLanguage.get(result.language) || { passed: 0, failed: 0 };
            if (result.passed) {
                stats.passed++;
            } else {
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
    generateHTMLReport(): string {
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
                ${Object.entries(stats.byFeature).map(([feature, data]: [string, any]) => `
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
                ${Object.entries(stats.byLanguage).map(([language, data]: [string, any]) => `
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
    async saveReport(outputPath: string): Promise<void> {
        const html = this.generateHTMLReport();
        await fs.promises.writeFile(outputPath, html, 'utf-8');
        console.log(`Report saved to: ${outputPath}`);
    }

    /**
     * Export results to JSON
     */
    exportJSON(): string {
        return JSON.stringify({
            statistics: this.getStatistics(),
            results: this.results,
            timestamp: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Clear all results
     */
    clearResults(): void {
        this.results = [];
    }

    /**
     * Get all results
     */
    getResults(): TestResult[] {
        return [...this.results];
    }

    /**
     * Wait for a condition to be true
     */
    async waitFor(
        condition: () => boolean | Promise<boolean>,
        timeout: number = 5000,
        interval: number = 100
    ): Promise<boolean> {
        return waitFor(condition, timeout, interval);
    }

    /**
     * Sleep for a specified duration
     */
    async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Helper function to create a test workspace
 */
export async function createTestWorkspace(baseDir: string): Promise<string> {
    const workspaceDir = path.join(baseDir, `test-workspace-${Date.now()}`);
    await fs.promises.mkdir(workspaceDir, { recursive: true });
    return workspaceDir;
}

/**
 * Helper function to open a file in VS Code
 */
export async function openFile(filePath: string): Promise<vscode.TextDocument> {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    return document;
}

/**
 * Helper function to wait for a condition
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
): Promise<boolean> {
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
export async function triggerCompletion(
    document: vscode.TextDocument,
    position: vscode.Position
): Promise<vscode.CompletionList | vscode.CompletionItem[] | undefined> {
    return await vscode.commands.executeCommand<vscode.CompletionList | vscode.CompletionItem[]>(
        'vscode.executeCompletionItemProvider',
        document.uri,
        position
    );
}
