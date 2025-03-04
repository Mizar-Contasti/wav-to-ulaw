//src/components/Progress.jsx
import React from 'react'

const Progress = ({progress}) => {
return (
    <div className="uk-margin">
        <progress className="uk-progress" value={progress} max="100"></progress>
    </div>

)
}

export default Progress