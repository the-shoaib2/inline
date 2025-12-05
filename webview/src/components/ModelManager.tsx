import React, { useEffect, useState } from 'react';
import { vscode } from '../vscode-utils';
import type { AppData, DownloadProgress, Model, Settings as SettingsType, CodingRule } from '../types';
import { ImportZone } from './ImportZone';
import { ModelList } from './ModelList';
import { Settings } from './Settings';
import { CodingRules } from './CodingRules';
import { ModelSearch } from './ModelSearch';
import { Statistics } from './Statistics';

export const ModelManager: React.FC = () => {
    const [models, setModels] = useState<Model[]>([]);
    const [filteredModels, setFilteredModels] = useState<Model[]>([]);
    const [currentModelId, setCurrentModelId] = useState<string | null>(null);
    const [downloadProgressMap, setDownloadProgressMap] = useState<Record<string, DownloadProgress>>({});
    const [settings, setSettings] = useState<SettingsType>({});
    const [rules, setRules] = useState<CodingRule[]>([]);
    const [stats] = useState({ completionsGenerated: 0, acceptanceRate: 0, averageLatency: 0, cacheHitRate: 0, modelUptime: 0 });
    const [activeTab, setActiveTab] = useState<'model' | 'settings' | 'rules' | 'stats'>('model');
    const [searchQuery, setSearchQuery] = useState('');
    const [languageFilter, setLanguageFilter] = useState('');

    const [logoUri, setLogoUri] = useState<string | undefined>(undefined);

    useEffect(() => {
        // Listen for messages from the extension
        vscode.onMessage((message) => {
            switch (message.command) {
                case 'updateData':
                    const data = message.data as AppData;
                    setModels(data.models);
                    setFilteredModels(data.models);
                    setCurrentModelId(data.currentModel);
                    setSettings(data.settings || {});
                    setRules(data.rules || []);
                    if (data.logoUri) {
                        setLogoUri(data.logoUri);
                    }
                    break;
                case 'downloadProgress':
                    setDownloadProgressMap(prev => ({
                        ...prev,
                        [message.modelId]: {
                            modelId: message.modelId,
                            progress: message.progress,
                            speed: message.speed
                        }
                    }));
                    break;
                case 'downloadComplete':
                    setDownloadProgressMap(prev => {
                        const newState = { ...prev };
                        delete newState[message.modelId];
                        return newState;
                    });
                    // Refresh data
                    vscode.postMessage('getData');
                    break;
                case 'notification':
                    // Handle notifications if needed, or let extension handle it
                    break;
            }
        });

        // Request initial data
        vscode.postMessage('getData');
    }, []);

    // Filter models based on search and language
    useEffect(() => {
        let filtered = models;

        if (searchQuery) {
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (languageFilter) {
            filtered = filtered.filter(m =>
                m.languages?.includes(languageFilter)
            );
        }

        setFilteredModels(filtered);
    }, [models, searchQuery, languageFilter]);

    const handleRefresh = () => {
        vscode.postMessage('getData');
    };

    const handleImportFile = (path: string) => {
        vscode.postMessage('importModel', { filePath: path });
    };

    const handleDownloadUrl = (url: string) => {
        vscode.postMessage('downloadFromUrl', { url });
    };

    const handlePickFile = () => {
        vscode.postMessage('pickAndImportModel');
    };

    const handleSelectModel = (modelId: string) => {
        vscode.postMessage('selectModel', { modelId });
    };

    const handleDeleteModel = (modelId: string) => {
        if (confirm('Delete this model?')) {
            vscode.postMessage('deleteModel', { modelId });
        }
    };

    const handleDownloadModel = (modelId: string) => {
        vscode.postMessage('downloadModel', { modelId });
    };

    const handleCancelDownload = (modelId: string) => {
        vscode.postMessage('cancelDownload', { modelId });
    };

    return (
        <div className="container">
            <div className="section">
                <div className="model-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {logoUri && <img src={logoUri} alt="Inline Logo" style={{ width: '32px', height: '32px' }} />}
                        <h2>Model Manager</h2>
                    </div>
                    <button className="secondary" onClick={handleRefresh}>Refresh</button>
                </div>
            </div>

            <div className="section">
                <div className="tabs-container">
                    <div className="tabs-header">
                        <button
                            className={`tab-button ${activeTab === 'model' ? 'active' : ''}`}
                            onClick={() => setActiveTab('model')}
                        >
                            Model
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            Settings
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'rules' ? 'active' : ''}`}
                            onClick={() => setActiveTab('rules')}
                        >
                            Rules
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('stats')}
                        >
                            Statistics
                        </button>
                    </div>

                    <div className="tabs-content">
                        {activeTab === 'model' && (
                            <ImportZone
                                onImportFile={handleImportFile}
                                onDownloadUrl={handleDownloadUrl}
                                onPickFile={handlePickFile}
                            />
                        )}

                        {activeTab === 'settings' && (
                            <Settings settings={settings} />
                        )}

                        {activeTab === 'rules' && (
                            <CodingRules rules={rules} />
                        )}

                        {activeTab === 'stats' && (
                            <Statistics stats={stats} />
                        )}
                    </div>
                </div>
            </div>

            <div className="section">
                <div className="model-header">
                    <h3>Downloaded Models</h3>
                    <span className="model-count">{filteredModels.filter(m => m.isDownloaded).length} models</span>
                </div>
                <ModelSearch
                    onSearch={setSearchQuery}
                    onFilterLanguage={setLanguageFilter}
                    onSort={(sortBy) => {
                        const sorted = [...filteredModels].sort((a, b) => {
                            if (sortBy === 'name') return a.name.localeCompare(b.name);
                            if (sortBy === 'size') return a.size - b.size;
                            return 0;
                        });
                        setFilteredModels(sorted);
                    }}
                />
                <ModelList
                    models={filteredModels.filter(m => m.isDownloaded)}
                    currentModelId={currentModelId}
                    downloadProgressMap={downloadProgressMap}
                    onSelect={handleSelectModel}
                    onDelete={handleDeleteModel}
                    onDownload={handleDownloadModel}
                    onCancelDownload={handleCancelDownload}
                    emptyMessage="No downloaded models. Import a model using the Model tab or download one from Available Models below."
                />
            </div>

            <div className="section">
                <div className="model-header">
                    <h3>Available Models</h3>
                    <span className="model-count">{filteredModels.filter(m => !m.isDownloaded).length} models</span>
                </div>
                <ModelList
                    models={filteredModels.filter(m => !m.isDownloaded)}
                    currentModelId={currentModelId}
                    downloadProgressMap={downloadProgressMap}
                    onSelect={handleSelectModel}
                    onDelete={handleDeleteModel}
                    onDownload={handleDownloadModel}
                    onCancelDownload={handleCancelDownload}
                    emptyMessage="No models available to download. Try adjusting your search or filter criteria."
                />
            </div>
        </div>
    );
};
