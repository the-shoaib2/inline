// Type for the VS Code API
interface VSCodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

// Declare the acquireVsCodeApi function
declare const acquireVsCodeApi: () => VSCodeApi;

// Singleton to prevent multiple acquire calls
let vscodeApi: VSCodeApi | undefined;

class VSCodeWrapper {
    private readonly vscode: VSCodeApi;

    constructor() {
        if (!vscodeApi) {
            try {
                vscodeApi = acquireVsCodeApi();
            } catch (e) {
                console.error("Failed to acquire VS Code API:", e);
                // Fallback for development/testing if needed, or re-throw
                // If it's already acquired but we lost the reference (shouldn't happen in single module),
                // we're in trouble. But usually this catch means "already acquired".
                // We'll try to recover if possible, but standard webview api doesn't expose a getter.
                // Assuming mostly development mocked environment or singleton violation.
            }
        }
        this.vscode = vscodeApi!;
    }

    public postMessage(command: string, data?: any) {
        if (this.vscode) {
            if (data) {
                this.vscode.postMessage({ command, ...data });
            } else {
                this.vscode.postMessage({ command });
            }
        } else {
             console.warn('VS Code API not initialized, cannot post message:', command);
        }
    }

    public onMessage(callback: (message: any) => void) {
        window.addEventListener('message', event => {
            callback(event.data);
        });
    }
}

export const vscode = new VSCodeWrapper();
