// src/components/FileInfo.jsx
import React from 'react';

const FileInfo = ({ info }) => {
    return (
        <div className="uk-card uk-card-default uk-card-body uk-margin">
            <h3 className="uk-card-title uk-text-center">File Information</h3>
            <p>Bit Rate: {info.bitRate} bps</p>
            <p>Channels: {info.channels}</p>
            <p>Sample Rate: {info.sampleRate} Hz</p>
            <p>Sample Size: {info.sampleSize} bit</p>
        </div>
    );
};

export default FileInfo;