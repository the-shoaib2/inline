import React from 'react';
import type { Model } from '../../types';
import { ProgressBar } from './progress-bar';
import { ModelDetails } from './model-details';

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
    onUnload: (id: string) => void;
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
    onRetry,
    onUnload
}) => {
    const [isHoveringActive, setIsHoveringActive] = React.useState(false);
    const [showDetails, setShowDetails] = React.useState(false);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={`model-item ${isActive ? 'active' : ''} ${downloadError ? 'error' : ''}`} id={`model-${model.id}`}>
            <div className="model-main-content">
                <div className="model-header-row">
                    <span className="model-name">{model.name}</span>
                    <div className="model-badges">
                        {isActive ? (
                            <span className="badge active-badge">Active</span>
                        ) : (
                            <>
                                {model.isImported && <span className="badge imported-badge">Imported</span>}
                                {!model.isImported && model.isDownloaded && <span className="badge downloaded-badge">Downloaded</span>}
                            </>
                        )}
                        {queuePosition !== undefined && queuePosition > 0 && (
                            <span className="badge queue-badge">Queued #{queuePosition}</span>
                        )}
                    </div>
                </div>

                <div className="model-meta-row">
                    <div className="meta-item">
                        <span className="meta-label">Size</span>
                        <span className="meta-value">{formatSize(model.size)}</span>
                    </div>
                    <div className="meta-item">
                        <span className="meta-label">Context</span>
                        <span className="meta-value">{model.contextWindow || 4096}</span>
                    </div>
                </div>

                <div style={{ fontSize: '0.9em', marginTop: '4px', color: 'var(--vscode-descriptionForeground)' }}>
                    {model.description}
                </div>
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
                <button
                    className="secondary"
                    onClick={() => setShowDetails(!showDetails)}
                    title={showDetails ? "Hide Details" : "Show Details"}
                >
                    {showDetails ? "Hide Details" : "Show Details"}
                </button>

                {model.isDownloaded ? (
                    <>
                        {isActive ? (
                            <button
                                className={isHoveringActive ? 'secondary' : ''}
                                onMouseEnter={() => setIsHoveringActive(true)}
                                onMouseLeave={() => setIsHoveringActive(false)}
                                onClick={() => onUnload(model.id)}
                            >
                                {isHoveringActive ? 'Disable' : 'Active'}
                            </button>
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

            {showDetails && <ModelDetails model={model} />}
        </div>
    );
};
