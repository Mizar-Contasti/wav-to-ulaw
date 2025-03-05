// src/components/FileInfoDisplay.jsx (with two-column layout)

import React from 'react';

const FileInfoDisplay = ({ fileInfo }) => {

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const pad = (num) => String(num).padStart(2, '0');

        if (h > 0) {
            return `${h}:${pad(m)}:${pad(s)}`;
        } else {
            return `${m}:${pad(s)}`;
        }
    };

    return (
        <div id="fileInfo" className="uk-card uk-card-default uk-card-body uk-margin" style={{ display: fileInfo.bitRate ? 'block' : 'none' }}>
            <h2 className="uk-card-title">File Information:</h2>
            <div className="uk-grid-small uk-child-width-1-2@s" uk-grid="true">
                {/* Left Column */}
                <div>
                    <p>Bit Rate: <span className="uk-text-bold">{fileInfo.bitRate}</span></p>
                    <p>Channels: <span className="uk-text-bold">{fileInfo.channels}</span></p>
                    <p>Sample Rate: <span className="uk-text-bold">{fileInfo.sampleRate}</span></p>
                </div>

                {/* Right Column */}
                <div>
                    <p>Sample Size: <span className="uk-text-bold">{fileInfo.sampleSize}</span></p>
                    {fileInfo.duration && <p>Duration: <span className="uk-text-bold">{formatDuration(fileInfo.duration)}</span></p>}
                    {fileInfo.fileSize && <p>File Size: <span className="uk-text-bold">{formatFileSize(fileInfo.fileSize)}</span></p>}
                </div>
            </div>
        </div>
    );
};

export default FileInfoDisplay;