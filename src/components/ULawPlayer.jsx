// src/components/ULawPlayer.jsx (Reset on new uLawData)

import React, { useState, useRef, useEffect } from 'react';
import { createWavHeader } from '../utils/audioUtils';

const ULawPlayer = ({ uLawData }) => {
    const [audioUrl, setAudioUrl] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (uLawData) {
            const header = createWavHeader(uLawData.length);
            const combined = new Uint8Array(header.byteLength + uLawData.length);
            combined.set(new Uint8Array(header), 0);
            combined.set(uLawData, header.byteLength);
            const blob = new Blob([combined], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);

            // Reset isPlaying to false when new data is loaded
            setIsPlaying(false);

            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setAudioUrl('');
        }
    }, [uLawData]);


    useEffect(() => {
        if (audioRef.current && audioUrl) {
            audioRef.current.src = audioUrl;
        }
    }, [audioUrl, audioRef]);


    const handlePlayPause = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(error => {
            console.error("Playback failed:", error);
            // Handle playback failure (e.g., show an error message)
          });
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    }
    const handlePlaying = () => {
      setIsPlaying(true);
    }
    const handlePause = () => {
      setIsPlaying(false);
    }
    return (
        <div>
            {audioUrl && (
                <>
                    <button
                        className={`uk-button uk-button-${isPlaying ? 'danger' : 'primary'} uk-margin-small-right`}
                        onClick={handlePlayPause}
                    >
                        {isPlaying ? 'Pause' : 'Play μ-law'}
                    </button>

                     <audio
                        ref={audioRef}
                        src={audioUrl}
                        preload="none"
                        onEnded={handleEnded}
                        onPlay={handlePlaying}
                        onPause={handlePause}
                    />

                </>
            )}
        </div>
    );
};

export default ULawPlayer;