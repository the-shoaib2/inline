// Removed unused imports

// Type for the VS Code API
interface VSCodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

// Declare the acquireVsCodeApi function
declare const acquireVsCodeApi: () => VSCodeApi;

class VSCodeWrapper {
    private readonly vscode: VSCodeApi;

    constructor() {
        this.vscode = acquireVsCodeApi();
    }

    public postMessage(command: string, data?: any) {
        if (data) {
            this.vscode.postMessage({ command, ...data });
        } else {
            this.vscode.postMessage({ command });
        }
    }

    public onMessage(callback: (message: any) => void) {
        window.addEventListener('message', event => {
            callback(event.data);
        });
    }
}

export const vscode = new VSCodeWrapper();
