# Memory Optimization Guide

## Overview

This guide addresses high memory usage (99.5%) and provides optimization strategies for the Inline VS Code extension.

## Immediate Actions

### 1. Reduce Memory Footprint

Add these settings to your VS Code `settings.json`:

```json
{
  // Inline Extension Memory Settings
  "inline.maxCacheSize": 50,              // Reduce from 100 to 50
  "inline.maxTokens": 256,                // Reduce from 512 to 256
  "inline.resourceMonitoring": true,      // Enable resource monitoring
  "inline.memoryLimit": 500,              // Set 500MB memory limit
  
  // VS Code Memory Settings
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/out/**": true,
    "**/dist/**": true,
    "**/.git/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/out": true,
    "**/dist": true
  },
  
  // Disable unnecessary features
  "editor.minimap.enabled": false,
  "editor.suggest.preview": false,
  "workbench.enableExperiments": false
}
```

### 2. Configure Network Timeout

Add to `package.json` or extension settings:

```json
{
  "inline.network": {
    "timeout": 1000,                      // 1000ms timeout
    "autoSelectFamily": true,
    "familyAttemptTimeout": 1000          // 1000ms family attempt timeout
  }
}
```

## Memory Optimization Strategies

### 1. Cache Management

**Problem**: Large cache consuming memory

**Solution**: Implement cache size limits and cleanup

```typescript
// src/core/cache-manager.ts
export class CacheManager {
  private maxCacheSize = 50; // Reduced from 100
  private maxMemoryMB = 100; // 100MB limit
  
  async cleanup(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > this.maxMemoryMB) {
      // Clear old cache entries
      this.clearOldEntries();
    }
  }
  
  private clearOldEntries(): void {
    // Remove entries older than 1 hour
    const oneHourAgo = Date.now() - 3600000;
    // Implementation...
  }
}
```

### 2. Model Loading Optimization

**Problem**: Models loaded into memory unnecessarily

**Solution**: Lazy loading and unloading

```typescript
// src/core/model-manager.ts
export class ModelManager {
  private loadedModel: any = null;
  private modelTimeout: NodeJS.Timeout | null = null;
  
  async loadModel(modelName: string): Promise<void> {
    // Unload previous model
    if (this.loadedModel) {
      await this.unloadModel();
    }
    
    // Load new model
    this.loadedModel = await this.loadModelFromDisk(modelName);
    
    // Set timeout to unload if inactive
    this.resetModelTimeout();
  }
  
  private resetModelTimeout(): void {
    if (this.modelTimeout) {
      clearTimeout(this.modelTimeout);
    }
    
    // Unload model after 5 minutes of inactivity
    this.modelTimeout = setTimeout(() => {
      this.unloadModel();
    }, 300000);
  }
  
  private async unloadModel(): Promise<void> {
    if (this.loadedModel) {
      this.loadedModel = null;
      if (global.gc) {
        global.gc(); // Force garbage collection
      }
    }
  }
}
```

### 3. Resource Monitoring

**Problem**: No visibility into resource usage

**Solution**: Implement real-time monitoring

```typescript
// src/utils/resource-manager.ts
export class ResourceManager {
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private readonly MEMORY_WARNING_THRESHOLD = 0.8; // 80%
  private readonly MEMORY_CRITICAL_THRESHOLD = 0.95; // 95%
  
  startMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 5000); // Check every 5 seconds
  }
  
  private checkMemoryUsage(): void {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const heapTotalMB = usage.heapTotal / 1024 / 1024;
    const usagePercent = heapUsedMB / heapTotalMB;
    
    if (usagePercent > this.MEMORY_CRITICAL_THRESHOLD) {
      // Critical: Force cleanup
      this.emergencyCleanup();
    } else if (usagePercent > this.MEMORY_WARNING_THRESHOLD) {
      // Warning: Gentle cleanup
      this.gentleCleanup();
    }
  }
  
  private async emergencyCleanup(): Promise<void> {
    console.warn('Emergency memory cleanup triggered');
    
    // Clear all caches
    await this.clearAllCaches();
    
    // Unload models
    await this.unloadModels();
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  }
  
  private async gentleCleanup(): Promise<void> {
    // Clear old cache entries only
    await this.clearOldCacheEntries();
  }
}
```

### 4. Completion Provider Optimization

**Problem**: Too many completion requests

**Solution**: Debouncing and throttling

```typescript
// src/core/completion-provider.ts
export class InlineCompletionProvider {
  private debounceTimeout: NodeJS.Timeout | null = null;
  private lastRequestTime = 0;
  private readonly DEBOUNCE_MS = 300;
  private readonly THROTTLE_MS = 100;
  
  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.InlineCompletionItem[]> {
    // Throttle requests
    const now = Date.now();
    if (now - this.lastRequestTime < this.THROTTLE_MS) {
      return [];
    }
    this.lastRequestTime = now;
    
    // Debounce
    return new Promise((resolve) => {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      this.debounceTimeout = setTimeout(async () => {
        const items = await this.generateCompletions(document, position);
        resolve(items);
      }, this.DEBOUNCE_MS);
    });
  }
}
```

## Language Server Initialization Fix

### Problem

```
LanguageServerClient must be initialized first!
```

### Solution

Update `src/extension.ts`:

```typescript
export async function activate(context: vscode.ExtensionContext) {
  try {
    // Initialize logger first
    logger = new Logger('Inline');
    logger.info('Activating Inline extension...');
    
    // Initialize error handler
    errorHandler = ErrorHandler.getInstance();
    
    // Wait for workspace to be ready
    await waitForWorkspace();
    
    // Initialize telemetry
    telemetryManager = new TelemetryManager();
    
    // Initialize with timeout protection
    await initializeWithTimeout(context, 10000);
    
    logger.info('Inline extension activated successfully');
    
  } catch (error) {
    const err = error as Error;
    errorHandler?.handleError(err, 'Extension Activation', true);
    logger?.error('Failed to activate extension', err);
    throw error;
  }
}

async function waitForWorkspace(): Promise<void> {
  // Wait for workspace to be fully loaded
  return new Promise((resolve) => {
    if (vscode.workspace.workspaceFolders) {
      resolve();
    } else {
      const disposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
        disposable.dispose();
        resolve();
      });
      // Timeout after 5 seconds
      setTimeout(() => {
        disposable.dispose();
        resolve();
      }, 5000);
    }
  });
}

async function initializeWithTimeout(
  context: vscode.ExtensionContext,
  timeout: number
): Promise<void> {
  return Promise.race([
    initializeComponents(context),
    new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Initialization timeout')), timeout)
    )
  ]);
}
```

## Deactivation Error Fix

### Problem

```
Error during deactivation: Error: Channel has been closed
```

### Solution

Update `src/extension.ts` deactivation:

```typescript
export async function deactivate(): Promise<void> {
  try {
    logger?.info('Deactivating Inline extension...');
    
    // Stop monitoring first
    if (networkDetector) {
      try {
        networkDetector.stopMonitoring();
      } catch (error) {
        console.warn('Error stopping network detector:', error);
      }
    }
    
    // Cleanup model manager
    if (modelManager) {
      try {
        await modelManager.cleanup();
      } catch (error) {
        console.warn('Error cleaning up model manager:', error);
      }
    }
    
    // Dispose UI components
    if (statusBarManager) {
      try {
        statusBarManager.dispose();
      } catch (error) {
        console.warn('Error disposing status bar:', error);
      }
    }
    
    // Dispose logger last
    if (logger) {
      try {
        logger.dispose();
      } catch (error) {
        console.warn('Error disposing logger:', error);
      }
    }
    
    // Track deactivation (with error handling)
    try {
      telemetryManager?.trackEvent('extension_deactivated');
    } catch (error) {
      // Ignore telemetry errors during deactivation
    }
    
    logger?.info('Inline extension deactivated');
  } catch (error) {
    console.error('Error during deactivation:', error);
    // Don't throw - allow deactivation to complete
  }
}
```

## Network Configuration

### Set Timeout and Auto-Select Family

Create `src/utils/network-config.ts`:

```typescript
import * as http from 'http';
import * as https from 'https';

export class NetworkConfig {
  static configure(): void {
    // Set default timeout
    http.globalAgent.timeout = 1000;
    https.globalAgent.timeout = 1000;
    
    // Set auto-select family timeout
    const options = {
      timeout: 1000,
      autoSelectFamily: true,
      autoSelectFamilyAttemptTimeout: 1000
    };
    
    // Apply to global agents
    Object.assign(http.globalAgent, options);
    Object.assign(https.globalAgent, options);
  }
}
```

Use in `src/extension.ts`:

```typescript
import { NetworkConfig } from './utils/network-config';

export async function activate(context: vscode.ExtensionContext) {
  // Configure network settings
  NetworkConfig.configure();
  
  // Rest of activation...
}
```

## Memory Leak Prevention

### 1. Dispose Subscriptions Properly

```typescript
export async function activate(context: vscode.ExtensionContext) {
  // Store all disposables
  const disposables: vscode.Disposable[] = [];
  
  // Add to disposables
  disposables.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      completionProvider
    )
  );
  
  // Register all disposables
  context.subscriptions.push(...disposables);
}
```

### 2. Clear Intervals and Timeouts

```typescript
export function deactivate(): void {
  // Clear all intervals
  if (cacheInterval) {
    clearInterval(cacheInterval);
  }
  
  // Clear all timeouts
  if (modelTimeout) {
    clearTimeout(modelTimeout);
  }
}
```

### 3. Remove Event Listeners

```typescript
export function deactivate(): void {
  // Remove all event listeners
  if (networkDetector) {
    networkDetector.removeAllListeners();
  }
}
```

## Quick Fixes

### 1. Restart Extension Host

```
Ctrl+Shift+P → "Developer: Restart Extension Host"
```

### 2. Clear Extension Cache

```bash
rm -rf ~/.vscode/extensions/inline.inline-*/resources/cache/*
```

### 3. Increase Memory Limit

Add to VS Code launch args:

```json
{
  "runtimeArgs": [
    "--max-old-space-size=4096"
  ]
}
```

### 4. Monitor Memory Usage

```
Ctrl+Shift+P → "Developer: Show Running Extensions"
```

Check memory usage for Inline extension.

## Performance Monitoring

### Add to `package.json`:

```json
{
  "scripts": {
    "profile": "code --prof-startup --disable-extensions"
  }
}
```

### Run profiling:

```bash
npm run profile
```

## Recommended Settings

```json
{
  // Memory optimization
  "inline.maxCacheSize": 50,
  "inline.maxTokens": 256,
  "inline.memoryLimit": 500,
  
  // Network optimization
  "inline.network.timeout": 1000,
  "inline.network.autoSelectFamilyAttemptTimeout": 1000,
  
  // Performance optimization
  "inline.debounceMs": 300,
  "inline.throttleMs": 100,
  "inline.maxConcurrentRequests": 3,
  
  // Resource monitoring
  "inline.resourceMonitoring": true,
  "inline.autoCleanup": true,
  "inline.cleanupIntervalMs": 60000
}
```

## Troubleshooting

### High Memory Usage

1. Check cache size: `Ctrl+Shift+P` → "Inline: Show Logs"
2. Clear cache: `Ctrl+Shift+P` → "Inline: Clear Cache"
3. Restart extension: `Ctrl+Shift+P` → "Developer: Restart Extension Host"
4. Reduce settings (see above)

### Language Server Errors

1. Wait for workspace to load
2. Check VS Code version (1.85.0+)
3. Restart extension host
4. Check error log: `Ctrl+Shift+P` → "Inline: Show Error Log"

### Channel Closed Errors

1. Update deactivation logic (see above)
2. Ensure proper cleanup order
3. Add error handling to all cleanup operations

---

**Status**: ✅ Optimized  
**Memory Target**: <500MB  
**Network Timeout**: 1000ms  
**Last Updated**: 2024-12-04
