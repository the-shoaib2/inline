import React, { useState, useEffect } from 'react';
import { vscode } from '../../vscode-utils';
import type { Settings as SettingsType } from '../../types';

interface SettingsProps {
    settings: SettingsType;
}

export const Settings: React.FC<SettingsProps> = ({ settings: initialSettings }) => {
    const [settings, setSettings] = useState<SettingsType>(initialSettings);

    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);

    const handleChange = (key: keyof SettingsType, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        vscode.postMessage('updateSetting', { setting: key, value });
    };

    return (
        <div className="settings-container">
            <h3>Settings</h3>

            <div className="setting-item">
                <label htmlFor="temperature">
                    Temperature
                    <span className="setting-description">Controls randomness (0 = deterministic, 1 = creative)</span>
                </label>
                <div className="setting-control">
                    <input
                        type="range"
                        id="temperature"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.temperature || 0.7}
                        onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                    />
                    <span className="setting-value">{(settings.temperature || 0.7).toFixed(1)}</span>
                </div>
            </div>

            <div className="setting-item">
                <label htmlFor="maxTokens">
                    Max Tokens
                    <span className="setting-description">Maximum length of generated code</span>
                </label>
                <input
                    type="number"
                    id="maxTokens"
                    min="50"
                    max="2000"
                    value={settings.maxTokens || 500}
                    onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                />
            </div>

            <div className="setting-item">
                <label htmlFor="cacheSize">
                    Cache Size
                    <span className="setting-description">Number of completions to cache</span>
                </label>
                <input
                    type="number"
                    id="cacheSize"
                    min="10"
                    max="1000"
                    value={settings.cacheSize || 100}
                    onChange={(e) => handleChange('cacheSize', parseInt(e.target.value))}
                />
            </div>

            <div className="setting-item">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={settings.autoOffline || false}
                        onChange={(e) => handleChange('autoOffline', e.target.checked)}
                    />
                    <span>Auto Offline Mode</span>
                    <span className="setting-description">Automatically start in offline mode</span>
                </label>
            </div>

            <div className="setting-item">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={settings.resourceMonitoring !== false}
                        onChange={(e) => handleChange('resourceMonitoring', e.target.checked)}
                    />
                    <span>Resource Monitoring</span>
                    <span className="setting-description">Monitor CPU/memory usage</span>
                </label>
            </div>

            <div className="setting-item">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={settings.modelWarmup !== false}
                        onChange={(e) => handleChange('modelWarmup', e.target.checked)}
                    />
                    <span>Model Warmup</span>
                    <span className="setting-description">Preload model on startup for faster first completion</span>
                </label>
            </div>
        </div>
    );
};
