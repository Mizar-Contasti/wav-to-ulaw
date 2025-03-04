// src/components/ErrorMessage.jsx
import React from 'react';

const ErrorMessage = ({ message }) => {
    return message ? (
        <div className="uk-alert-danger uk-margin" uk-alert="true">
            <p>Error: {message}</p>
        </div>
    ) : null;
};

export default ErrorMessage;