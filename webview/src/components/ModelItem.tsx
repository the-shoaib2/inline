import React from 'react';
import type { Model } from '../types';
import { ProgressBar } from './ProgressBar';
import { ModelDetails } from './ModelDetails';

interface ModelItemProps {
    model: Model;
    isActive: boolean;
    downloadProgress?: number;
    downloadSpeed?: number;
    downloadError?: string;
    queuePosition?: number;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onDownload: (id: string) => void;
    onCancelDownload: (id: string) => void;
    onRetry?: (id: string) => void;
}

export const ModelItem: React.FC<ModelItemProps> = ({
    model,
    isActive,
    downloadProgress,
    downloadSpeed,
    downloadError,
    queuePosition,
    onSelect,
    onDelete,
    onDownload,
    onCancelDownload,
    onRetry
}) => {
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={`model-item ${isActive ? 'active' : ''} ${downloadError ? 'error' : ''}`} id={`model-${model.id}`}>
            <div className="model-header">
                <span className="model-name">{model.name}</span>
                <div className="model-badges">
                    {isActive && <span className="badge">Active</span>}
                    {model.isDownloaded && <span className="badge">Downloaded</span>}
                    {queuePosition !== undefined && queuePosition > 0 && (
                        <span className="badge queue-badge">Queued #{queuePosition}</span>
                    )}
                </div>
            </div>
            <div style={{ fontSize: '0.9em', marginTop: '4px' }}>{model.description}</div>
            <div className="model-info">
                <span>Size: {formatSize(model.size)}</span>
                <span>RAM: {model.requirements.ram}GB</span>
                <span>VRAM: {model.requirements.vram}GB</span>
                <span>Context: {model.contextWindow || 4096}</span>
            </div>

            {downloadError && (
                <div className="error-message">
                    <span className="error-icon">⚠</span>
                    <span className="error-text">{downloadError}</span>
                    {onRetry && (
                        <button className="retry-button" onClick={() => onRetry(model.id)}>
                            Retry
                        </button>
                    )}
                </div>
            )}

            {downloadProgress !== undefined && !downloadError && (
                <ProgressBar
                    progress={downloadProgress}
                    speed={downloadSpeed}
                    modelId={model.id}
                    onCancel={onCancelDownload}
                />
            )}

            <div className="model-actions">
                {model.isDownloaded ? (
                    <>
                        {isActive ? (
                            <button disabled>Active</button>
                        ) : (
                            <button onClick={() => onSelect(model.id)}>Load</button>
                        )}
                        {!isActive && (
                            <button className="secondary" onClick={() => onDelete(model.id)}>Delete</button>
                        )}
                    </>
                ) : null}
                {!model.isDownloaded && downloadProgress === undefined && !downloadError && (
                    <button onClick={() => onDownload(model.id)}>Download</button>
                )}
            </div>

            <ModelDetails model={model} />
        </div>
    );
};
