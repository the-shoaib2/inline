import React, { useState } from 'react';
import { vscode } from '../vscode-utils';
import type { CodingRule } from '../types';

interface CodingRulesProps {
    rules: CodingRule[];
}

export const CodingRules: React.FC<CodingRulesProps> = ({ rules }) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingRule, setEditingRule] = useState<CodingRule | null>(null);

    const handleAdd = () => {
        vscode.postMessage('addRule');
    };

    const handleEdit = (index: number, rule: CodingRule) => {
        setEditingIndex(index);
        setEditingRule({ ...rule });
    };

    const handleSave = (index: number) => {
        if (editingRule) {
            vscode.postMessage('updateRule', { index, rule: editingRule });
        }
        setEditingIndex(null);
        setEditingRule(null);
    };

    const handleCancel = () => {
        setEditingIndex(null);
        setEditingRule(null);
    };

    const handleDelete = (index: number) => {
        if (confirm('Delete this rule?')) {
            vscode.postMessage('removeRule', { index });
        }
    };

    const handleToggle = (index: number, enabled: boolean) => {
        vscode.postMessage('updateRule', { index, field: 'enabled', value: enabled });
    };

    return (
        <div className="coding-rules-container">
            <div className="rules-header">
                <p style={{ color: 'var(--vscode-descriptionForeground)', margin: '0 0 12px 0' }}>
                    Define custom coding patterns and rules
                </p>
                <button onClick={handleAdd}>Add Rule</button>
            </div>

            {rules.length === 0 ? (
                <p style={{ color: 'var(--vscode-descriptionForeground)', textAlign: 'center', padding: '20px 0' }}>
                    No coding rules defined
                </p>
            ) : (
                <div className="rules-list">
                    {rules.map((rule, index) => (
                        <div key={index} className="rule-item">
                            {editingIndex === index && editingRule ? (
                                <div className="rule-editor">
                                    <div className="rule-field">
                                        <label>Name</label>
                                        <input
                                            type="text"
                                            value={editingRule.name}
                                            onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="rule-field">
                                        <label>Pattern</label>
                                        <input
                                            type="text"
                                            value={editingRule.pattern}
                                            onChange={(e) => setEditingRule({ ...editingRule, pattern: e.target.value })}
                                            placeholder="e.g., console.log"
                                        />
                                    </div>
                                    <div className="rule-field">
                                        <label>Description</label>
                                        <input
                                            type="text"
                                            value={editingRule.description}
                                            onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="rule-actions">
                                        <button onClick={() => handleSave(index)}>Save</button>
                                        <button className="secondary" onClick={handleCancel}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rule-display">
                                    <div className="rule-info">
                                        <div className="rule-name-row">
                                            <input
                                                type="checkbox"
                                                checked={rule.enabled}
                                                onChange={(e) => handleToggle(index, e.target.checked)}
                                            />
                                            <strong>{rule.name}</strong>
                                        </div>
                                        <div className="rule-pattern">Pattern: <code>{rule.pattern}</code></div>
                                        <div className="rule-description">{rule.description}</div>
                                    </div>
                                    <div className="rule-actions">
                                        <button className="secondary" onClick={() => handleEdit(index, rule)}>Edit</button>
                                        <button className="secondary" onClick={() => handleDelete(index)}>Delete</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
