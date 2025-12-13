import React from 'react';
import type { Model } from '../../types';
import { ModelItem } from './model-item';

interface ModelListProps {
    models: Model[];
    currentModelId: string | null;
    downloadProgressMap: Record<string, { progress: number; speed?: number }>;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onDownload: (id: string) => void;
    onCancelDownload: (id: string) => void;
    onUnload: (id: string) => void;
    emptyMessage?: string;
}

export const ModelList: React.FC<ModelListProps> = ({
    models,
    currentModelId,
    downloadProgressMap,
    onSelect,
    onDelete,
    onDownload,
    onCancelDownload,
    onUnload,
    emptyMessage = 'No models found.'
}) => {
    const [filter, setFilter] = React.useState<'all' | 'installed' | 'notInstalled'>('all');
    const [sortBy, setSortBy] = React.useState<'name' | 'size'>('name');

    const filteredAndSortedModels = React.useMemo(() => {
        let result = [...models];

        // Filter
        if (filter === 'installed') {
            result = result.filter(m => m.isDownloaded);
        } else if (filter === 'notInstalled') {
            result = result.filter(m => !m.isDownloaded);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else {
                return b.size - a.size; // Descending size
            }
        });

        return result;
    }, [models, filter, sortBy]);

    return (
        <div className="model-list-container">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '0 4px' }}>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                >
                    <option value="all">All Models</option>
                    <option value="installed">Installed</option>
                    <option value="notInstalled">Not Installed</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                >
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                </select>
            </div>

            {filteredAndSortedModels.length === 0 ? (
                <div className="empty-state">
                    <p style={{ color: 'var(--vscode-descriptionForeground)', textAlign: 'center', padding: '20px' }}>
                        {filter !== 'all' ? 'No models match the current filter.' : emptyMessage}
                    </p>
                </div>
            ) : (
                <div className="model-list">
                    {filteredAndSortedModels.map(model => (
                        <ModelItem
                            key={model.id}
                            model={model}
                            isActive={model.id === currentModelId}
                            downloadProgress={downloadProgressMap[model.id]?.progress}
                            downloadSpeed={downloadProgressMap[model.id]?.speed}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            onDownload={onDownload}
                            onCancelDownload={onCancelDownload}
                            onUnload={onUnload}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
