import React, { useEffect, useState } from 'react';
import { vscode } from '../vscode-utils';
import type { AppData, DownloadProgress, Model, Settings as SettingsType, CodingRule } from '../types';
import { ImportZone, ModelList, ModelSearch, ModelHeader } from './model';
import { Settings } from './settings';
import { CodingRules } from './rules';
import { Statistics } from './statistics';

export const ModelManager: React.FC = () => {
    const [models, setModels] = useState<Model[]>([]);
    const [currentModelId, setCurrentModelId] = useState<string | null>(null);
    const [downloadProgressMap, setDownloadProgressMap] = useState<Record<string, DownloadProgress>>({});
    const [settings, setSettings] = useState<SettingsType>({});
    const [rules, setRules] = useState<CodingRule[]>([]);

    // Real-time statistics from backend (updates every 2 seconds)
    const [stats, setStats] = useState({
        completionsGenerated: 0,
        acceptedSuggestions: 0,
        rejectedSuggestions: 0,
        acceptanceRate: 0,
        averageLatency: 0,
        cacheHitRate: 0,
        currentModel: 'None',
        sessionUptime: 0
    });

    // Initialize active tab from persisted state
    const [activeTab, setActiveTab] = useState<'model' | 'settings' | 'rules' | 'stats'>(() => {
        const state = vscode.getState();
        return state?.activeTab || 'model';
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [languageFilter, setLanguageFilter] = useState('');
    const [sortCriteria, setSortCriteria] = useState<'name' | 'size' | 'none'>('none');

    const [logoUri, setLogoUri] = useState<string | undefined>(undefined);

    // Persist tab state when it changes
    const handleTabChange = (tab: 'model' | 'settings' | 'rules' | 'stats') => {
        setActiveTab(tab);
        vscode.setState({ ...vscode.getState(), activeTab: tab });
    };

    useEffect(() => {
        // Listen for messages from the extension
        vscode.onMessage((message) => {
            switch (message.command) {
                case 'updateData': {
                    const data = message.data as AppData;
                    setModels(data.models);
                    setCurrentModelId(data.currentModel);
                    setSettings(data.settings || {});
                    setRules(data.rules || []);

                    // Update statistics if provided
                    if (data.statistics) {
                        setStats(data.statistics);
                    }

                    if (data.logoUri) {
                        setLogoUri(data.logoUri);
                    }
                    break;
                }
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
    const filteredModels = React.useMemo(() => {
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

        // Apply sorting
        if (sortCriteria !== 'none') {
            filtered = [...filtered].sort((a, b) => {
                // Sort downloaded models first, then by criteria
                const aDownloaded = a.isDownloaded ? 0 : 1;
                const bDownloaded = b.isDownloaded ? 0 : 1;

                if (aDownloaded !== bDownloaded) {
                    return aDownloaded - bDownloaded;
                }

                if (sortCriteria === 'name') return a.name.localeCompare(b.name);
                if (sortCriteria === 'size') return a.size - b.size;
                return 0;
            });
        } else {
            // Default: downloaded models first
            filtered = [...filtered].sort((a, b) => {
                const aDownloaded = a.isDownloaded ? 0 : 1;
                const bDownloaded = b.isDownloaded ? 0 : 1;
                return aDownloaded - bDownloaded;
            });
        }

        return filtered;
    }, [models, searchQuery, languageFilter, sortCriteria]);

    const handleRefresh = () => {
        vscode.postMessage('getData');
    };

    const handleImportFile = (path: string) => {
        vscode.postMessage('importModel', { filePath: path });
    };

    const handlePickFile = () => {
        vscode.postMessage('pickAndImportModel');
    };

    const handleSelectModel = (modelId: string) => {
        vscode.postMessage('selectModel', { modelId });
    };

    const handleDeleteModel = (modelId: string) => {
        vscode.postMessage('deleteModel', { modelId });
    };

    const handleDownloadModel = (modelId: string) => {
        vscode.postMessage('downloadModel', { modelId });
    };

    const handleCancelDownload = (modelId: string) => {
        vscode.postMessage('cancelDownload', { modelId });
    };

    const handleUnloadModel = (modelId: string) => {
        vscode.postMessage('unloadModel', { modelId });
    };

    // Separate models by status for display
    const downloadedModels = filteredModels.filter(m => m.isDownloaded || m.id === currentModelId);
    const availableModels = filteredModels.filter(m => !m.isDownloaded && m.id !== currentModelId);
    const allModelsCount = filteredModels.length;
    const downloadedCount = downloadedModels.length;
    const availableCount = availableModels.length;

    return (
        <div className="container">
            <div className="section">
                <div className="model-header" style={{ position: 'relative', alignItems: 'center', minHeight: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {logoUri && <img src={logoUri} alt="Inline Logo" style={{ width: '28px', height: '28px' }} />}
                        <h2 style={{ fontSize: '18px', margin: 0, lineHeight: 1 }}>Inline</h2>
                    </div>
                    <button className="secondary" onClick={handleRefresh} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>Refresh</button>
                </div>
            </div>

            <div className="section">
                <div className="tabs-container">
                    <div className="tabs-header">
                        <button
                            className={`tab-button ${activeTab === 'model' ? 'active' : ''}`}
                            onClick={() => handleTabChange('model')}
                        >
                            Model
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => handleTabChange('settings')}
                        >
                            Settings
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'rules' ? 'active' : ''}`}
                            onClick={() => handleTabChange('rules')}
                        >
                            Rules
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
                            onClick={() => handleTabChange('stats')}
                        >
                            Statistics
                        </button>
                    </div>

                    <div className="tabs-content">
                        {activeTab === 'model' && (
                            <>
                                <div className="section">
                                    <ModelHeader
                                        allModelsCount={allModelsCount}
                                        downloadedCount={downloadedCount}
                                        availableCount={availableCount}
                                    />
                                    <ModelSearch
                                        onSearch={setSearchQuery}
                                        onFilterLanguage={setLanguageFilter}
                                        onSort={(sortBy) => setSortCriteria(sortBy as 'name' | 'size' | 'none')}
                                    />

                                    {downloadedCount > 0 && (
                                        <>
                                            <h4 style={{ margin: '16px 0 8px 0', borderBottom: '1px solid var(--vscode-settings-headerBorder)' }}>My Models</h4>
                                            <ModelList
                                                models={downloadedModels}
                                                currentModelId={currentModelId}
                                                downloadProgressMap={downloadProgressMap}
                                                onSelect={handleSelectModel}
                                                onDelete={handleDeleteModel}
                                                onDownload={handleDownloadModel}
                                                onCancelDownload={handleCancelDownload}
                                                onUnload={handleUnloadModel}
                                                emptyMessage="No downloaded models found."
                                            />
                                        </>
                                    )}

                                    <h4 style={{ margin: '24px 0 8px 0', borderBottom: '1px solid var(--vscode-settings-headerBorder)' }}>Suggested Models</h4>
                                    <ImportZone
                                        onImportFile={handleImportFile}
                                        onPickFile={handlePickFile}
                                    />
                                    <ModelList
                                        models={availableModels}
                                        currentModelId={currentModelId}
                                        downloadProgressMap={downloadProgressMap}
                                        onSelect={handleSelectModel}
                                        onDelete={handleDeleteModel}
                                        onDownload={handleDownloadModel}
                                        onCancelDownload={handleCancelDownload}
                                        onUnload={handleUnloadModel}
                                        emptyMessage="No suggested models found matching your criteria."
                                    />
                                </div>
                            </>
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
        </div>
    );
};
