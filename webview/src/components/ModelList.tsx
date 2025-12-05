import React from 'react';
import type { Model } from '../types';
import { ModelItem } from './ModelItem';

interface ModelListProps {
    models: Model[];
    currentModelId: string | null;
    downloadProgressMap: Record<string, { progress: number; speed?: number }>;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onDownload: (id: string) => void;
    onCancelDownload: (id: string) => void;
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
    emptyMessage = 'No models found.'
}) => {
    if (models.length === 0) {
        return (
            <div className="empty-state">
                <p style={{ color: 'var(--vscode-descriptionForeground)', textAlign: 'center', padding: '20px' }}>
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <div className="model-list">
            {models.map(model => (
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
                />
            ))}
        </div>
    );
};
