// src/components/DownloadLink.jsx
import React from 'react';

const DownloadLink = ({ url, fileName }) => {
    return (
        <a href={url} download={fileName} className="uk-width-1-1">
            <button className="uk-button uk-button-secondary uk-width-1-1">Download μ-law</button>
        </a>
    );
};

export default DownloadLink;