// src/components/ULawPlayer.jsx
import React, { useState, useRef, useEffect } from 'react';
import { muLawToPcm16 } from '../utils/audioUtils';

const ULawPlayer = ({ uLawData, sampleRate }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef(null);
    const bufferSourceRef = useRef(null);

    useEffect(() => {
        // Clean up on unmount or data change
        return () => {
          if (bufferSourceRef.current) {
            bufferSourceRef.current.stop();
            bufferSourceRef.current.disconnect();
            bufferSourceRef.current = null;
          }
          if (audioContextRef.current) {
              // Close context on unmount, but only if it exists.
              audioContextRef.current.close().catch(e => console.error("Error closing audio context:", e));
              audioContextRef.current = null;
          }

        };
    }, [uLawData]);


    const playAudio = () => {
      if (!uLawData || isPlaying) return;

      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 8000});
      }

      const decodedData = new Int16Array(uLawData.length);
      for (let i = 0; i < uLawData.length; i++) {
          decodedData[i] = muLawToPcm16(uLawData[i]);
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, decodedData.length, 8000);
      audioBuffer.getChannelData(0).set(decodedData);

      bufferSourceRef.current = audioContextRef.current.createBufferSource();
      bufferSourceRef.current.buffer = audioBuffer;
      bufferSourceRef.current.connect(audioContextRef.current.destination);
      bufferSourceRef.current.start();
      setIsPlaying(true);


      bufferSourceRef.current.onended = () => {
        setIsPlaying(false);
         // No need to close context here; keep it for reuse.
        if (bufferSourceRef.current) {  // Check before accessing
          bufferSourceRef.current.disconnect(); //cleanup
          bufferSourceRef.current = null;
        }

      };

    };


    const stopAudio = () => {
        if (bufferSourceRef.current) {
            bufferSourceRef.current.stop();
            //No need to close context; keep it for reuse
            bufferSourceRef.current.disconnect();
            bufferSourceRef.current = null;

        }
        setIsPlaying(false);

    };



    return (
        <div>
            {uLawData && (
                <>
                    <button className={`uk-button uk-button-${isPlaying ? 'danger' : 'primary'}`} onClick={isPlaying ? stopAudio : playAudio}>
                        {isPlaying ? 'Stop' : 'Play μ-law'}
                    </button>

                </>
            )}
        </div>
    );
};

export default ULawPlayer;