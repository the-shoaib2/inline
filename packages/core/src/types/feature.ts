import * as vscode from 'vscode';

/**
 * Base interface for all extension features.
 * Features are modular components that can be loaded, activated, and deactivated.
 */
export interface IFeature {
  /**
   * Unique identifier for the feature
   */
  readonly id: string;

  /**
   * Human-readable name
   */
  readonly name: string;

  /**
   * Feature dependencies (other feature IDs that must be loaded first)
   */
  readonly dependencies?: string[];

  /**
   * Activate the feature
   * @param context VS Code extension context
   * @returns Promise that resolves when activation is complete
   */
  activate(context: vscode.ExtensionContext): Promise<void>;

  /**
   * Deactivate the feature and cleanup resources
   * @returns Promise that resolves when deactivation is complete
   */
  deactivate(): Promise<void>;

  /**
   * Check if the feature is currently active
   */
  isActive(): boolean;
}

/**
 * Feature metadata for registration
 */
export interface FeatureMetadata {
  id: string;
  name: string;
  description?: string;
  version?: string;
  dependencies?: string[];
  enabled?: boolean;
  implemented?: boolean;
  category?: string;
}

/**
 * Feature factory function
 */
export type FeatureFactory = (context: vscode.ExtensionContext) => IFeature | Promise<IFeature>;
