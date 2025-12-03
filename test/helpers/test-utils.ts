import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await sleep(interval);
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a test document
 */
export async function createTestDocument(
  content: string,
  language: string = 'typescript'
): Promise<vscode.TextDocument> {
  const document = await vscode.workspace.openTextDocument({
    content,
    language
  });
  return document;
}

/**
 * Open a test file from fixtures
 */
export async function openTestFile(
  relativePath: string
): Promise<vscode.TextDocument> {
  const fixturesPath = path.resolve(__dirname, '../fixtures/sample-workspace');
  const filePath = path.join(fixturesPath, relativePath);
  const uri = vscode.Uri.file(filePath);
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document);
  return document;
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Clean up all open editors
 */
export async function closeAllEditors(): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
}

/**
 * Get extension by ID
 */
export function getExtension(): vscode.Extension<any> | undefined {
  return vscode.extensions.getExtension('inline.inline');
}

/**
 * Activate extension and wait for it to be ready
 */
export async function activateExtension(): Promise<void> {
  const ext = getExtension();
  if (!ext) {
    throw new Error('Extension not found');
  }
  
  if (!ext.isActive) {
    await ext.activate();
  }
  
  // Wait a bit for initialization
  await sleep(500);
}
