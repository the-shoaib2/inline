import * as vscode from 'vscode';
import * as os from 'os';

interface ProcessInfo {
    process: {
        pid: number;
        platform: string;
        arch: string;
        version: string;
        uptime: number;
        memory: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
            arrayBuffers: number;
        };
        cpu: {
            user: number;
            system: number;
        };
    };
    system: {
        platform: string;
        release: string;
        arch: string;
        hostname: string;
        uptime: number;
        memory: {
            total: number;
            free: number;
            used: number;
        };
        cpu: {
            count: number;
            model: string;
            speed: number;
            loadAverage: number[];
        };
        network: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
    };
}

/**
 * Process Information Display
 * Shows detailed system and process information
 */
export class ProcessInfoDisplay {
    /**
     * Show detailed process and system information
     */
    static async showProcessInfo(): Promise<void> {
        const info = this.getProcessInfo();
        const panel = vscode.window.createWebviewPanel(
            'processInfo',
            'Process & System Information',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        panel.webview.html = this.getWebviewContent(info);
    }

    /**
     * Get all process and system information
     */
    static getProcessInfo(): ProcessInfo {
        const usage = process.memoryUsage() as NodeJS.MemoryUsage;
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        const cpuUsage = process.cpuUsage() as NodeJS.CpuUsage;
        
        return {
            // Process Information
            process: {
                pid: process.pid,
                version: process.version,
                platform: process.platform,
                arch: process.arch,
                uptime: process.uptime(),
                memory: {
                    rss: usage.rss,
                    heapTotal: usage.heapTotal,
                    heapUsed: usage.heapUsed,
                    external: usage.external,
                    arrayBuffers: (usage as unknown as Record<string, number>).arrayBuffers || 0
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                }
            },
            
            // System Information
            system: {
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
                hostname: os.hostname(),
                uptime: os.uptime(),
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem()
                },
                cpu: {
                    count: cpus.length,
                    model: cpus[0]?.model || 'Unknown',
                    speed: cpus[0]?.speed || 0,
                    loadAverage: loadAvg
                },
                network: os.networkInterfaces()
            }
        };
    }

    /**
     * Format bytes to human readable format
     */
    private static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format seconds to human readable format
     */
    private static formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
        
        return parts.join(' ');
    }

    /**
     * Get webview HTML content
     */
    private static getWebviewContent(info: ProcessInfo): string {
        const memUsagePercent = ((info.system.memory.used / info.system.memory.total) * 100).toFixed(1);
        const heapUsagePercent = ((info.process.memory.heapUsed / info.process.memory.heapTotal) * 100).toFixed(1);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Process & System Information</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: var(--vscode-textLink-foreground);
            border-bottom: 2px solid var(--vscode-textLink-foreground);
            padding-bottom: 10px;
        }
        h2 {
            color: var(--vscode-textLink-activeForeground);
            margin-top: 30px;
            border-bottom: 1px solid var(--vscode-widget-border);
            padding-bottom: 5px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .info-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 15px;
        }
        .info-card h3 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
            font-size: 16px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: var(--vscode-textPreformat-foreground);
        }
        .info-value {
            color: var(--vscode-foreground);
            font-family: var(--vscode-editor-font-family);
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: var(--vscode-input-background);
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .progress-normal { background: var(--vscode-charts-green); }
        .progress-warning { background: var(--vscode-charts-yellow); }
        .progress-critical { background: var(--vscode-charts-red); }
        .warning {
            background: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .error {
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖥️ Process & System Information</h1>
        
        ${parseFloat(memUsagePercent) >= 95 ? `
        <div class="error">
            <strong>⚠️ CRITICAL: High Memory Usage Detected!</strong><br>
            System memory usage is at ${memUsagePercent}%. Immediate action required.
        </div>
        ` : parseFloat(memUsagePercent) >= 80 ? `
        <div class="warning">
            <strong>⚠️ WARNING: High Memory Usage</strong><br>
            System memory usage is at ${memUsagePercent}%. Consider closing unused applications.
        </div>
        ` : ''}
        
        <h2>💾 Memory Usage</h2>
        <div class="info-grid">
            <div class="info-card">
                <h3>System Memory</h3>
                <div class="info-row">
                    <span class="info-label">Total:</span>
                    <span class="info-value">${this.formatBytes(info.system.memory.total)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Used:</span>
                    <span class="info-value">${this.formatBytes(info.system.memory.used)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Free:</span>
                    <span class="info-value">${this.formatBytes(info.system.memory.free)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${parseFloat(memUsagePercent) >= 95 ? 'progress-critical' : parseFloat(memUsagePercent) >= 80 ? 'progress-warning' : 'progress-normal'}" 
                         style="width: ${memUsagePercent}%">
                        ${memUsagePercent}%
                    </div>
                </div>
            </div>
            
            <div class="info-card">
                <h3>Process Memory (Node.js)</h3>
                <div class="info-row">
                    <span class="info-label">RSS:</span>
                    <span class="info-value">${this.formatBytes(info.process.memory.rss)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Heap Total:</span>
                    <span class="info-value">${this.formatBytes(info.process.memory.heapTotal)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Heap Used:</span>
                    <span class="info-value">${this.formatBytes(info.process.memory.heapUsed)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">External:</span>
                    <span class="info-value">${this.formatBytes(info.process.memory.external)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${parseFloat(heapUsagePercent) >= 90 ? 'progress-critical' : parseFloat(heapUsagePercent) >= 70 ? 'progress-warning' : 'progress-normal'}" 
                         style="width: ${heapUsagePercent}%">
                        ${heapUsagePercent}%
                    </div>
                </div>
            </div>
        </div>
        
        <h2>⚡ Process Information</h2>
        <div class="info-grid">
            <div class="info-card">
                <h3>Process Details</h3>
                <div class="info-row">
                    <span class="info-label">PID:</span>
                    <span class="info-value">${info.process.pid}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Node Version:</span>
                    <span class="info-value">${info.process.version}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Platform:</span>
                    <span class="info-value">${info.process.platform}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Architecture:</span>
                    <span class="info-value">${info.process.arch}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Uptime:</span>
                    <span class="info-value">${this.formatUptime(info.process.uptime)}</span>
                </div>
            </div>
            
            <div class="info-card">
                <h3>CPU Usage</h3>
                <div class="info-row">
                    <span class="info-label">User:</span>
                    <span class="info-value">${(info.process.cpu.user / 1000).toFixed(2)} ms</span>
                </div>
                <div class="info-row">
                    <span class="info-label">System:</span>
                    <span class="info-value">${(info.process.cpu.system / 1000).toFixed(2)} ms</span>
                </div>
            </div>
        </div>
        
        <h2>🖥️ System Information</h2>
        <div class="info-grid">
            <div class="info-card">
                <h3>System Details</h3>
                <div class="info-row">
                    <span class="info-label">Hostname:</span>
                    <span class="info-value">${info.system.hostname}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Platform:</span>
                    <span class="info-value">${info.system.platform}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Release:</span>
                    <span class="info-value">${info.system.release}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Architecture:</span>
                    <span class="info-value">${info.system.arch}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Uptime:</span>
                    <span class="info-value">${this.formatUptime(info.system.uptime)}</span>
                </div>
            </div>
            
            <div class="info-card">
                <h3>CPU Information</h3>
                <div class="info-row">
                    <span class="info-label">Model:</span>
                    <span class="info-value">${info.system.cpu.model}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cores:</span>
                    <span class="info-value">${info.system.cpu.count}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Speed:</span>
                    <span class="info-value">${info.system.cpu.speed} MHz</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Load (1m):</span>
                    <span class="info-value">${info.system.cpu.loadAverage[0].toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Load (5m):</span>
                    <span class="info-value">${info.system.cpu.loadAverage[1].toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Load (15m):</span>
                    <span class="info-value">${info.system.cpu.loadAverage[2].toFixed(2)}</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
    }
}
