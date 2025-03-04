// src/components/FileInput.jsx
import React from 'react';

const FileInput = ({ onFileSelected }) => {
    const handleChange = (event) => {
        onFileSelected(event.target.files[0]);
    };

    return (
        <div className="uk-margin">
            <input className="uk-input" type="file" accept=".wav" onChange={handleChange} />
        </div>
    );
};

export default FileInput;