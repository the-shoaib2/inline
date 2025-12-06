import * as vscode from 'vscode';
import { LlamaInference } from '../../inference/llama-inference';
import { Logger } from '../../system/logger';
import * as child_process from 'child_process';
import { promisify } from 'util';

const exec = promisify(child_process.exec);

export interface PRDescription {
    title: string;
    summary: string;
    changes: string[];
    breakingChanges: string[];
    testing: string;
}

export interface CommitMessage {
    type: string;
    scope?: string;
    subject: string;
    body?: string;
    footer?: string;
}

export class PRGenerator {
    private inference: LlamaInference;
    private logger: Logger;

    constructor(inference: LlamaInference) {
        this.inference = inference;
        this.logger = new Logger('PRGenerator');
    }

    /**
     * Get git diff
     */
    private async getGitDiff(staged: boolean = true): Promise<string> {
        try {
            const command = staged ? 'git diff --cached' : 'git diff';
            const { stdout } = await exec(command);
            return stdout;
        } catch (error) {
            this.logger.error(`Failed to get git diff: ${error}`);
            throw new Error('Failed to get git diff. Make sure you are in a git repository.');
        }
    }

    /**
     * Generate PR description from git diff
     */
    public async generatePRDescription(staged: boolean = false): Promise<PRDescription> {
        const diff = await this.getGitDiff(staged);

        if (!diff || diff.trim().length === 0) {
            throw new Error('No changes found. Stage your changes first.');
        }

        const prompt = `Analyze this git diff and generate a pull request description.

Git Diff:
\`\`\`diff
${diff.substring(0, 4000)} ${diff.length > 4000 ? '...(truncated)' : ''}
\`\`\`

Generate a PR description with:
1. TITLE: Concise PR title (max 72 chars)
2. SUMMARY: Brief overview of changes
3. CHANGES: Bullet list of key changes
4. BREAKING: Any breaking changes (or "None")
5. TESTING: How to test these changes

Format:
TITLE: ...
SUMMARY: ...
CHANGES:
- ...
BREAKING: ...
TESTING: ...

Response:`;

        try {
            const response = await this.inference.generateCompletion(prompt, {
                maxTokens: 512,
                temperature: 0.3
            });

            return this.parsePRDescription(response);
        } catch (error) {
            this.logger.error(`PR description generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Parse PR description from LLM response
     */
    private parsePRDescription(response: string): PRDescription {
        const lines = response.split('\n');
        
        let title = '';
        let summary = '';
        const changes: string[] = [];
        const breakingChanges: string[] = [];
        let testing = '';
        let currentSection = '';

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.match(/^TITLE:/i)) {
                title = trimmed.replace(/^TITLE:\s*/i, '');
                continue;
            } else if (trimmed.match(/^SUMMARY:/i)) {
                summary = trimmed.replace(/^SUMMARY:\s*/i, '');
                currentSection = 'summary';
                continue;
            } else if (trimmed.match(/^CHANGES:/i)) {
                currentSection = 'changes';
                continue;
            } else if (trimmed.match(/^BREAKING:/i)) {
                const breaking = trimmed.replace(/^BREAKING:\s*/i, '');
                if (breaking.toLowerCase() !== 'none') {
                    breakingChanges.push(breaking);
                }
                currentSection = 'breaking';
                continue;
            } else if (trimmed.match(/^TESTING:/i)) {
                testing = trimmed.replace(/^TESTING:\s*/i, '');
                currentSection = 'testing';
                continue;
            }

            // Process content based on current section
            if (currentSection === 'summary' && trimmed) {
                summary += ' ' + trimmed;
            } else if (currentSection === 'changes' && trimmed.match(/^[\-\*]/)) {
                changes.push(trimmed.replace(/^[\-\*]\s*/, ''));
            } else if (currentSection === 'breaking' && trimmed && trimmed.toLowerCase() !== 'none') {
                breakingChanges.push(trimmed);
            } else if (currentSection === 'testing' && trimmed) {
                testing += ' ' + trimmed;
            }
        }

        return {
            title: title || 'Update code',
            summary: summary.trim() || 'Various improvements and fixes',
            changes: changes.length > 0 ? changes : ['Code updates'],
            breakingChanges,
            testing: testing.trim() || 'Test manually'
        };
    }

    /**
     * Generate commit message following conventional commits
     */
    public async generateCommitMessage(staged: boolean = true): Promise<CommitMessage> {
        const diff = await this.getGitDiff(staged);

        if (!diff || diff.trim().length === 0) {
            throw new Error('No changes found. Stage your changes first.');
        }

        const prompt = `Generate a conventional commit message for this git diff.

Git Diff:
\`\`\`diff
${diff.substring(0, 3000)} ${diff.length > 3000 ? '...(truncated)' : ''}
\`\`\`

Use conventional commits format:
TYPE(SCOPE): SUBJECT

Where TYPE is one of: feat, fix, docs, style, refactor, test, chore
SCOPE is optional (component/module affected)
SUBJECT is imperative, lowercase, no period (max 50 chars)

Also provide:
BODY: Detailed explanation (optional)

Format:
TYPE: ...
SCOPE: ... (or "none")
SUBJECT: ...
BODY: ... (or "none")

Response:`;

        try {
            const response = await this.inference.generateCompletion(prompt, {
                maxTokens: 256,
                temperature: 0.2
            });

            return this.parseCommitMessage(response);
        } catch (error) {
            this.logger.error(`Commit message generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Parse commit message from LLM response
     */
    private parseCommitMessage(response: string): CommitMessage {
        const lines = response.split('\n');
        
        let type = 'chore';
        let scope: string | undefined;
        let subject = 'update code';
        let body: string | undefined;

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.match(/^TYPE:/i)) {
                type = trimmed.replace(/^TYPE:\s*/i, '').toLowerCase();
            } else if (trimmed.match(/^SCOPE:/i)) {
                const scopeValue = trimmed.replace(/^SCOPE:\s*/i, '');
                if (scopeValue.toLowerCase() !== 'none') {
                    scope = scopeValue;
                }
            } else if (trimmed.match(/^SUBJECT:/i)) {
                subject = trimmed.replace(/^SUBJECT:\s*/i, '');
            } else if (trimmed.match(/^BODY:/i)) {
                const bodyValue = trimmed.replace(/^BODY:\s*/i, '');
                if (bodyValue.toLowerCase() !== 'none') {
                    body = bodyValue;
                }
            }
        }

        return {
            type,
            scope,
            subject,
            body
        };
    }

    /**
     * Format commit message
     */
    public formatCommitMessage(commit: CommitMessage): string {
        let message = commit.type;
        if (commit.scope) {
            message += `(${commit.scope})`;
        }
        message += `: ${commit.subject}`;

        if (commit.body) {
            message += `\n\n${commit.body}`;
        }

        if (commit.footer) {
            message += `\n\n${commit.footer}`;
        }

        return message;
    }

    /**
     * Format PR description as markdown
     */
    public formatPRDescription(pr: PRDescription): string {
        let markdown = `# ${pr.title}\n\n`;
        markdown += `## Summary\n\n${pr.summary}\n\n`;
        
        markdown += `## Changes\n\n`;
        for (const change of pr.changes) {
            markdown += `- ${change}\n`;
        }
        markdown += `\n`;

        if (pr.breakingChanges.length > 0) {
            markdown += `## ⚠️ Breaking Changes\n\n`;
            for (const breaking of pr.breakingChanges) {
                markdown += `- ${breaking}\n`;
            }
            markdown += `\n`;
        }

        markdown += `## Testing\n\n${pr.testing}\n`;

        return markdown;
    }

    /**
     * Generate changelog entry
     */
    public async generateChangelogEntry(version: string): Promise<string> {
        const diff = await this.getGitDiff(false);

        const prompt = `Generate a changelog entry for version ${version} based on these changes:

Git Diff:
\`\`\`diff
${diff.substring(0, 3000)}
\`\`\`

Format as:
## [${version}] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

Response:`;

        try {
            const changelog = await this.inference.generateCompletion(prompt, {
                maxTokens: 512,
                temperature: 0.3
            });

            return changelog.trim();
        } catch (error) {
            this.logger.error(`Changelog generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Detect breaking changes in diff
     */
    public async detectBreakingChanges(): Promise<string[]> {
        const diff = await this.getGitDiff(false);

        const prompt = `Analyze this git diff and identify any breaking changes.

Git Diff:
\`\`\`diff
${diff.substring(0, 3000)}
\`\`\`

List breaking changes (API changes, removed features, incompatible updates):`;

        try {
            const response = await this.inference.generateCompletion(prompt, {
                maxTokens: 256,
                temperature: 0.2
            });

            const lines = response.split('\n');
            const breakingChanges: string[] = [];

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.match(/^[\-\*\d\.]/)) {
                    breakingChanges.push(trimmed.replace(/^[\-\*\d\.]\s*/, ''));
                }
            }

            return breakingChanges;
        } catch (error) {
            this.logger.error(`Breaking change detection failed: ${error}`);
            return [];
        }
    }
}
