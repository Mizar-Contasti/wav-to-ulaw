// src/components/ConversionButton.jsx
import React from 'react';

const ConversionButton = ({ onConvert, disabled, isProcessing, show }) => (
    <button className="uk-button uk-button-primary uk-margin-right"
            onClick={onConvert}
            disabled={disabled}
            style={{display: show? 'inline-block' : 'none'}}>
        {isProcessing ? <span uk-spinner="ratio: 0.8"></span> : null} Run Conversion
    </button>
);

export default ConversionButton;