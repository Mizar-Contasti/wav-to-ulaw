// src/main.jsx (or src/index.js)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import UIkit from 'uikit'; // Import UIkit
import Icons from 'uikit/dist/js/uikit-icons'; // Import UIkit Icons
import 'uikit/dist/css/uikit.min.css'; // Import UIkit CSS

// loads the Icon plugin
UIkit.use(Icons);


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)