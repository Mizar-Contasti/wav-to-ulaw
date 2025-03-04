// src/components/FileInfoDisplay.jsx
import React from 'react';

const FileInfoDisplay = ({ fileInfo }) => (
    <div id="fileInfo" className="uk-card uk-card-default uk-card-body uk-margin" style={{ display: fileInfo.bitRate ? 'block' : 'none' }}>
        <h2 className="uk-card-title">File Information:</h2>
        <p>Bit Rate: <span className="uk-text-bold">{fileInfo.bitRate}</span></p>
        <p>Channels: <span className="uk-text-bold">{fileInfo.channels}</span></p>
        <p>Sample Rate: <span className="uk-text-bold">{fileInfo.sampleRate}</span></p>
        <p>Sample Size: <span className="uk-text-bold">{fileInfo.sampleSize}</span></p>
    </div>
);

export default FileInfoDisplay;