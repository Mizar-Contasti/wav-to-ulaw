// src/components/ConversionButton.jsx
import React from 'react';

const ConversionButton = ({ onConversion, disabled, isProcessing }) => {
    return (
        <button
            className={`uk-button uk-button-${disabled ? 'default' : 'primary'} uk-width-1-1 uk-margin`}
            onClick={onConversion}
            disabled={disabled}
        >
            {isProcessing ? 'Processing...' : 'Run Conversion'}
        </button>
    );
};

export default ConversionButton;