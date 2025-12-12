import * as vscode from 'vscode';
import { IFeature, FeatureMetadata, FeatureFactory } from '../types/feature';

/**
 * Central registry for managing extension features.
 * 
 * Responsibilities:
 * - Register and discover features
 * - Resolve feature dependencies
 * - Load features in correct order
 * - Provide feature lifecycle management
 */
export class FeatureRegistry {
  private static instance: FeatureRegistry;
  private features = new Map<string, IFeature>();
  private factories = new Map<string, FeatureFactory>();
  private metadata = new Map<string, FeatureMetadata>();
  private loadOrder: string[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): FeatureRegistry {
    if (!FeatureRegistry.instance) {
      FeatureRegistry.instance = new FeatureRegistry();
    }
    return FeatureRegistry.instance;
  }

  /**
   * Register a feature factory
   * @param metadata Feature metadata
   * @param factory Factory function to create the feature
   */
  register(metadata: FeatureMetadata, factory: FeatureFactory): void {
    if (this.factories.has(metadata.id)) {
      throw new Error(`Feature ${metadata.id} is already registered`);
    }

    this.metadata.set(metadata.id, metadata);
    this.factories.set(metadata.id, factory);
  }

  /**
   * Load and activate all registered features
   * @param context VS Code extension context
   */
  async loadAll(context: vscode.ExtensionContext): Promise<void> {
    // Resolve load order based on dependencies
    this.loadOrder = this.resolveDependencies();

    // Load features in order
    for (const featureId of this.loadOrder) {
      const meta = this.metadata.get(featureId);
      
      // Skip if disabled
      if (meta?.enabled === false) {
        continue;
      }

      await this.load(featureId, context);
    }
  }

  /**
   * Load and activate a specific feature
   * @param featureId Feature ID
   * @param context VS Code extension context
   */
  async load(featureId: string, context: vscode.ExtensionContext): Promise<void> {
    if (this.features.has(featureId)) {
      return; // Already loaded
    }

    const factory = this.factories.get(featureId);
    if (!factory) {
      throw new Error(`Feature ${featureId} not found`);
    }

    const meta = this.metadata.get(featureId);
    
    // Load dependencies first
    if (meta?.dependencies) {
      for (const depId of meta.dependencies) {
        await this.load(depId, context);
      }
    }

    // Create and activate feature
    const feature = await factory(context);
    await feature.activate(context);
    this.features.set(featureId, feature);
  }

  /**
   * Get a loaded feature by ID
   * @param featureId Feature ID
   * @returns Feature instance or undefined
   */
  get<T extends IFeature>(featureId: string): T | undefined {
    return this.features.get(featureId) as T | undefined;
  }

  /**
   * Unload and deactivate all features
   */
  async unloadAll(): Promise<void> {
    // Unload in reverse order
    for (const featureId of [...this.loadOrder].reverse()) {
      await this.unload(featureId);
    }
  }

  /**
   * Unload a specific feature
   * @param featureId Feature ID
   */
  async unload(featureId: string): Promise<void> {
    const feature = this.features.get(featureId);
    if (feature) {
      await feature.deactivate();
      this.features.delete(featureId);
    }
  }

  /**
   * Resolve feature load order based on dependencies
   * Uses topological sort to ensure dependencies are loaded first
   */
  private resolveDependencies(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (featureId: string) => {
      if (visited.has(featureId)) {
        return;
      }

      visited.add(featureId);

      const meta = this.metadata.get(featureId);
      if (meta?.dependencies) {
        for (const depId of meta.dependencies) {
          if (!this.factories.has(depId)) {
            throw new Error(`Dependency ${depId} not found for feature ${featureId}`);
          }
          visit(depId);
        }
      }

      order.push(featureId);
    };

    // Visit all registered features
    for (const featureId of this.factories.keys()) {
      visit(featureId);
    }

    return order;
  }

  /**
   * Get all registered feature metadata
   */
  getAllMetadata(): FeatureMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Check if a feature is loaded
   */
  isLoaded(featureId: string): boolean {
    return this.features.has(featureId);
  }
}
