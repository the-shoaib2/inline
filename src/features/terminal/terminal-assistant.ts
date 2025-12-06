import { LlamaInference } from '../../inference/llama-inference';
import { Logger } from '../../system/logger';

export interface CommandSuggestion {
    command: string;
    description: string;
    category: 'git' | 'npm' | 'docker' | 'shell' | 'system';
    dangerous: boolean;
    example?: string;
}

export class TerminalAssistant {
    private inference: LlamaInference;
    private logger: Logger;
    private commandHistory: string[] = [];

    // Common safe commands database
    private static readonly SAFE_COMMANDS = new Map<string, CommandSuggestion[]>([
        ['git', [
            { command: 'git status', description: 'Show working tree status', category: 'git', dangerous: false },
            { command: 'git add .', description: 'Stage all changes', category: 'git', dangerous: false },
            { command: 'git commit -m "message"', description: 'Commit staged changes', category: 'git', dangerous: false },
            { command: 'git push', description: 'Push commits to remote', category: 'git', dangerous: false },
            { command: 'git pull', description: 'Fetch and merge from remote', category: 'git', dangerous: false },
            { command: 'git log --oneline', description: 'Show commit history', category: 'git', dangerous: false },
            { command: 'git diff', description: 'Show changes', category: 'git', dangerous: false },
            { command: 'git branch', description: 'List branches', category: 'git', dangerous: false },
            { command: 'git checkout -b branch-name', description: 'Create and switch to new branch', category: 'git', dangerous: false }
        ]],
        ['npm', [
            { command: 'npm install', description: 'Install dependencies', category: 'npm', dangerous: false },
            { command: 'npm run dev', description: 'Run development server', category: 'npm', dangerous: false },
            { command: 'npm run build', description: 'Build for production', category: 'npm', dangerous: false },
            { command: 'npm test', description: 'Run tests', category: 'npm', dangerous: false },
            { command: 'npm run lint', description: 'Run linter', category: 'npm', dangerous: false }
        ]],
        ['docker', [
            { command: 'docker ps', description: 'List running containers', category: 'docker', dangerous: false },
            { command: 'docker images', description: 'List images', category: 'docker', dangerous: false },
            { command: 'docker build -t name .', description: 'Build image', category: 'docker', dangerous: false },
            { command: 'docker run -it image', description: 'Run container interactively', category: 'docker', dangerous: false },
            { command: 'docker logs container', description: 'View container logs', category: 'docker', dangerous: false }
        ]]
    ]);

    // Dangerous command patterns
    private static readonly DANGEROUS_PATTERNS = [
        /rm\s+-rf/,
        /sudo\s+rm/,
        /dd\s+if=/,
        /mkfs/,
        /:\(\)\{\s*:\|:\s*&\s*\};:/,  // Fork bomb
        />\s*\/dev\/sd/,
        /chmod\s+-R\s+777/
    ];

    constructor(inference: LlamaInference) {
        this.inference = inference;
        this.logger = new Logger('TerminalAssistant');
    }

    /**
     * Suggest command based on natural language query
     */
    public async suggestCommand(query: string): Promise<CommandSuggestion[]> {
        this.logger.info(`Suggesting command for: ${query}`);

        // First check offline database
        const offlineSuggestions = this.searchOfflineCommands(query);
        if (offlineSuggestions.length > 0) {
            return offlineSuggestions;
        }

        // Use LLM for complex queries
        try {
            const prompt = `Suggest a shell command for: "${query}"

Provide the command and a brief description.
Format:
COMMAND: <command>
DESCRIPTION: <description>
CATEGORY: git|npm|docker|shell|system

Response:`;

            const response = await this.inference.generateCompletion(prompt, {
                maxTokens: 128,
                temperature: 0.2
            });

            return this.parseCommandSuggestion(response);
        } catch (error) {
            this.logger.error(`Command suggestion failed: ${error}`);
            return [];
        }
    }

    /**
     * Search offline command database
     */
    private searchOfflineCommands(query: string): CommandSuggestion[] {
        const lowerQuery = query.toLowerCase();
        const results: CommandSuggestion[] = [];

        for (const [category, commands] of TerminalAssistant.SAFE_COMMANDS) {
            if (lowerQuery.includes(category)) {
                results.push(...commands);
            } else {
                // Search in descriptions
                for (const cmd of commands) {
                    if (cmd.description.toLowerCase().includes(lowerQuery) ||
                        cmd.command.toLowerCase().includes(lowerQuery)) {
                        results.push(cmd);
                    }
                }
            }
        }

        return results.slice(0, 5); // Return top 5
    }

    /**
     * Parse command suggestion from LLM response
     */
    private parseCommandSuggestion(response: string): CommandSuggestion[] {
        const lines = response.split('\n');
        let command = '';
        let description = '';
        let category: any = 'shell';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.match(/^COMMAND:/i)) {
                command = trimmed.replace(/^COMMAND:\s*/i, '').trim();
            } else if (trimmed.match(/^DESCRIPTION:/i)) {
                description = trimmed.replace(/^DESCRIPTION:\s*/i, '').trim();
            } else if (trimmed.match(/^CATEGORY:/i)) {
                category = trimmed.replace(/^CATEGORY:\s*/i, '').trim();
            }
        }

        if (!command) return [];

        const dangerous = this.isDangerous(command);

        return [{
            command,
            description: description || 'Command suggestion',
            category,
            dangerous
        }];
    }

    /**
     * Check if command is dangerous
     */
    public isDangerous(command: string): boolean {
        for (const pattern of TerminalAssistant.DANGEROUS_PATTERNS) {
            if (pattern.test(command)) {
                return true;
            }
        }

        // Check for sudo with destructive commands
        if (command.includes('sudo') && (
            command.includes('rm') ||
            command.includes('dd') ||
            command.includes('mkfs')
        )) {
            return true;
        }

        return false;
    }

    /**
     * Explain what a command does
     */
    public async explainCommand(command: string): Promise<string> {
        // Check if dangerous
        if (this.isDangerous(command)) {
            return `⚠️ WARNING: This is a potentially dangerous command that could cause data loss or system damage.\n\nCommand: ${command}\n\nPlease be extremely careful before running this command.`;
        }

        try {
            const prompt = `Explain what this shell command does in simple terms:

Command: ${command}

Provide:
1. What it does
2. Common use cases
3. Any important flags or options

Explanation:`;

            const explanation = await this.inference.generateCompletion(prompt, {
                maxTokens: 256,
                temperature: 0.2
            });

            return explanation.trim();
        } catch (error) {
            this.logger.error(`Command explanation failed: ${error}`);
            return 'Unable to explain command';
        }
    }

    /**
     * Get git command suggestions
     */
    public getGitCommands(context?: string): CommandSuggestion[] {
        const gitCommands = TerminalAssistant.SAFE_COMMANDS.get('git') || [];
        
        if (!context) {
            return gitCommands;
        }

        // Filter based on context
        const lowerContext = context.toLowerCase();
        return gitCommands.filter(cmd => 
            cmd.description.toLowerCase().includes(lowerContext) ||
            cmd.command.toLowerCase().includes(lowerContext)
        );
    }

    /**
     * Get npm/pnpm/yarn commands
     */
    public getPackageManagerCommands(manager: 'npm' | 'pnpm' | 'yarn' = 'npm'): CommandSuggestion[] {
        const npmCommands = TerminalAssistant.SAFE_COMMANDS.get('npm') || [];
        
        // Convert to requested package manager
        return npmCommands.map(cmd => ({
            ...cmd,
            command: cmd.command.replace('npm', manager)
        }));
    }

    /**
     * Get Docker commands
     */
    public getDockerCommands(): CommandSuggestion[] {
        return TerminalAssistant.SAFE_COMMANDS.get('docker') || [];
    }

    /**
     * Add command to history
     */
    public addToHistory(command: string): void {
        this.commandHistory.unshift(command);
        if (this.commandHistory.length > 100) {
            this.commandHistory = this.commandHistory.slice(0, 100);
        }
    }

    /**
     * Get command history
     */
    public getHistory(): string[] {
        return [...this.commandHistory];
    }

    /**
     * Search command history
     */
    public searchHistory(query: string): string[] {
        const lowerQuery = query.toLowerCase();
        return this.commandHistory.filter(cmd => 
            cmd.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Generate command from natural language (advanced)
     */
    public async generateCommand(description: string, context?: {
        workingDirectory?: string;
        files?: string[];
        language?: string;
    }): Promise<CommandSuggestion> {
        const contextInfo = context ? `
Working Directory: ${context.workingDirectory || 'unknown'}
Files: ${context.files?.join(', ') || 'none'}
Language: ${context.language || 'unknown'}
` : '';

        const prompt = `Generate a shell command for this task:
"${description}"

${contextInfo}

Provide a safe, working command.
Format:
COMMAND: <command>
DESCRIPTION: <what it does>

Response:`;

        try {
            const response = await this.inference.generateCompletion(prompt, {
                maxTokens: 128,
                temperature: 0.1
            });

            const suggestions = this.parseCommandSuggestion(response);
            return suggestions[0] || {
                command: '',
                description: 'No command generated',
                category: 'shell',
                dangerous: false
            };
        } catch (error) {
            this.logger.error(`Command generation failed: ${error}`);
            throw error;
        }
    }
}
