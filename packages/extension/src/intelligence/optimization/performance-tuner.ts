import * as os from 'os';
import * as vscode from 'vscode';

export class PerformanceTuner {
    public static async tune(): Promise<void> {
        const config = vscode.workspace.getConfiguration('inline');
        
        // Only auto-tune if not manually set (or if we add a specic "auto" flag, 
        // but for now let's just check if it's the default or we can force it once)
        // Best approach: Check if user has explicitly configured it? 
        // VS Code API doesn't easily tell "default vs user set" without inspection.
        // We'll trust that if it's default, we can optimize.
        
        // However, rewriting user config can be annoying. 
        // Let's only do it if we haven't done it before (check globalState).
        // But this class is static. We might need context.
        
        // Simplified approach: Just return recommended settings and valid defaults.
        // Actually, the prompt asked to "make more faster... auto compilation suggestion".
        // Let's be proactive.
        
        const cpus = os.cpus().length;
        
        // Heuristic:
        // Threads: physical cores usually best. Node sees logical cores. 
        // Logical / 2 is safe estimation for physical cores on hyperthreaded systems.
        // Reserve 1-2 for system.
        
        let recommendedThreads = Math.max(2, Math.floor(cpus / 2));
        if (cpus > 8) recommendedThreads = cpus - 2; // On high core count, use more?
        
        // Limit max threads to avoid freezing UI
        recommendedThreads = Math.min(recommendedThreads, 8);
        
        const updates: { key: string, value: any }[] = [];
        
        // Check current config
        const currentThreads = config.inspect('inference.threads');
        if (!currentThreads?.workspaceValue && !currentThreads?.globalValue) {
             updates.push({ key: 'inference.threads', value: recommendedThreads });
        }
        
        // Check debounce
        // If system is fast (many cores), we can lower debounce?
        // Default is 75ms. If < 4 cores, maybe 150ms?
        if (cpus < 4) {
             const currentDebounce = config.inspect('debounce.min');
             if (!currentDebounce?.workspaceValue && !currentDebounce?.globalValue) {
                  // Slower machine, increase debounce to save CPU
                  updates.push({ key: 'debounce.min', value: 150 });
             }
        }
        
        // GPU Check? Hard in Node without bindings. 
        // Llama-cpp might fail if we force GPU layers without a GPU.
        // Safe to leave default (0) and let user enable.
        
        // Apply updates
        if (updates.length > 0) {
            for (const update of updates) {
                await config.update(update.key, update.value, vscode.ConfigurationTarget.Global);
            }
            // Notify user silently or logic logs?
            console.log(`[Inline] Auto-tuned performance: ${JSON.stringify(updates)}`);
        }
    }
}
