// src/components/DownloadLink.jsx
import React from 'react';

const DownloadLink = ({ url, fileName }) => (
    url && (
        <a href={url} download={fileName} className="uk-button uk-button-default">
            Download μ-law
        </a>
    )
);

export default DownloadLink;