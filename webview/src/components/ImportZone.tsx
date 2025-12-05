import React, { useState, type DragEvent } from 'react';

interface ImportZoneProps {
    onImportFile: (path: string) => void;
    onDownloadUrl: (url: string) => void;
    onPickFile: () => void;
}

export const ImportZone: React.FC<ImportZoneProps> = ({
    onImportFile,
    onDownloadUrl,
    onPickFile
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [url, setUrl] = useState('');

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.endsWith('.gguf')) {
            // Note: In a real webview, we might not get the full path from the File object directly due to security.
            // However, VS Code webviews often allow it or we might need to handle it differently.
            // But the original code used `files[0].path`.
            // In React/TS, File object might not have `path` property in standard types, but Electron/VS Code environment usually adds it.
            const file = files[0] as any;
            if (file.path) {
                onImportFile(file.path);
            }
        }
    };

    const handleDownload = () => {
        if (url.trim()) {
            onDownloadUrl(url.trim());
            setUrl('');
        }
    };

    return (
        <div
            className={`import-zone ${isDragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <p>Drag & drop .gguf file here or</p>
            <button onClick={onPickFile}>Select File</button>
            <div className="url-input-container" onClick={(e) => e.stopPropagation()}>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Or enter model URL (Hugging Face .gguf link)"
                />
                <button onClick={handleDownload}>Download</button>
            </div>
        </div>
    );
};
