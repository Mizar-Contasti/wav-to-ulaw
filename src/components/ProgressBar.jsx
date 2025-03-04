// src/components/ProgressBar.jsx

import React from 'react';

const ProgressBar = ({ progress }) => (
    <progress id="progress" className="uk-progress" value={progress} max="100"></progress>
);

export default ProgressBar;