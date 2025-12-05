import React from 'react';

interface ModelDetailsProps {
    model: {
        architecture?: string;
        quantization?: string;
        contextWindow?: number;
        parameters?: string;
        size: number;
    };
}

export const ModelDetails: React.FC<ModelDetailsProps> = ({ model }) => {
    const formatSize = (bytes: number) => {
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(2)} GB`;
    };

    return (
        <div className="details-content">
            <div className="detail-row">
                <span className="detail-label">Architecture:</span>
                <span className="detail-value">{model.architecture || 'Unknown'}</span>
            </div>
            <div className="detail-row">
                <span className="detail-label">Quantization:</span>
                <span className="detail-value">{model.quantization || 'Unknown'}</span>
            </div>
            <div className="detail-row">
                <span className="detail-label">Context Window:</span>
                <span className="detail-value">{model.contextWindow || 4096} tokens</span>
            </div>
            <div className="detail-row">
                <span className="detail-label">Parameters:</span>
                <span className="detail-value">{model.parameters || 'Unknown'}</span>
            </div>
            <div className="detail-row">
                <span className="detail-label">File Size:</span>
                <span className="detail-value">{formatSize(model.size)}</span>
            </div>
        </div>
    );
};
