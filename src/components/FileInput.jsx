// src/components/FileInput.jsx
import React, { forwardRef, useState } from 'react';

const FileInput = forwardRef(({ onChange }, ref) => {
    const [fileName, setFileName] = useState('Select file');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFileName(file.name);
            onChange(file);
        } else {
            setFileName('Select file');
        }
    };

    return (
        <div className="uk-margin">
            <div uk-form-custom="target: true">
                <input type="file" accept=".wav" onChange={handleFileChange} ref={ref} />
                <button className="uk-button uk-button-default uk-width-1-1" type="button" tabIndex="-1">
                    <span uk-icon="icon: upload"></span>&nbsp;
                    <span>{fileName}</span>
                </button>
            </div>
        </div>
    );
});
FileInput.displayName = 'FileInput';

export default FileInput;