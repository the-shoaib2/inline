import React from 'react';

interface StatisticsProps {
    stats: {
        completionsGenerated?: number;
        acceptanceRate?: number;
        averageLatency?: number;
        cacheHitRate?: number;
        modelUptime?: number;
    };
}

export const Statistics: React.FC<StatisticsProps> = ({ stats }) => {
    const formatUptime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="statistics-container">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Completions Generated</div>
                    <div className="stat-value">{stats.completionsGenerated || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Acceptance Rate</div>
                    <div className="stat-value">{(stats.acceptanceRate || 0).toFixed(1)}%</div>
                    <div className="stat-bar">
                        <div
                            className="stat-bar-fill"
                            style={{ width: `${stats.acceptanceRate || 0}%` }}
                        ></div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Average Latency</div>
                    <div className="stat-value">{stats.averageLatency || 0}ms</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Cache Hit Rate</div>
                    <div className="stat-value">{(stats.cacheHitRate || 0).toFixed(1)}%</div>
                    <div className="stat-bar">
                        <div
                            className="stat-bar-fill"
                            style={{ width: `${stats.cacheHitRate || 0}%` }}
                        ></div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Model Uptime</div>
                    <div className="stat-value">{formatUptime(stats.modelUptime || 0)}</div>
                </div>
            </div>
        </div>
    );
};
