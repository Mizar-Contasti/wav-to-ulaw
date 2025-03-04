// src/components/FileInput.jsx
import React, { forwardRef } from 'react';

const FileInput = forwardRef(({ onChange }, ref) => (  // Use forwardRef
    <div className="uk-margin">
        <div uk-form-custom="target: true">
            <input type="file" accept=".wav" onChange={(e) => onChange(e.target.files[0])} ref={ref} />
            <input className="uk-input uk-form-width-medium" type="text" placeholder="Select file" disabled />
        </div>
    </div>
));
FileInput.displayName = 'FileInput'; //for better React DevTools

export default FileInput;