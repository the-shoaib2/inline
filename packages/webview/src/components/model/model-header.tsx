import React from 'react';

interface ModelHeaderProps {
    allModelsCount: number;
    downloadedCount: number;
    availableCount: number;
}

export const ModelHeader: React.FC<ModelHeaderProps> = ({
    allModelsCount,
    downloadedCount,
    availableCount
}) => {
    return (
        <div className="model-header">
            <h3>All Models ({allModelsCount})</h3>
            <div className="model-counts">
                <span className="model-count">
                    {downloadedCount} Downloaded
                </span>
                <span className="model-count">
                    {availableCount} Available
                </span>
            </div>
        </div>
    );
};
