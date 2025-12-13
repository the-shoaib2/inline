import React from 'react';

interface ProgressBarProps {
    progress: number;
    speed?: number;
    modelId: string;
    onCancel: (modelId: string) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, speed, modelId, onCancel }) => {
    return (
        <div className="progress-container active">
            <div className="progress-info">
                <span className="progress-percentage">{Math.round(progress)}%</span>
                {speed && <span className="progress-speed">{(speed / 1024 / 1024).toFixed(1)} MB/s</span>}
                <button
                    className="progress-cancel"
                    onClick={() => onCancel(modelId)}
                    title="Cancel download"
                >
                    ✕
                </button>
            </div>
            <div className="progress-bar-track">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};
