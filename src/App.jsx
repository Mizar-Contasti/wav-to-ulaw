import React, { useState, useRef } from 'react';
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';

// Load UIkit icons (important!)
UIkit.use(Icons);

function App() {
    const [fileInfo, setFileInfo] = useState({
        bitRate: '',
        channels: '',
        sampleRate: '',
        sampleSize: ''
    });
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [downloadFileName, setDownloadFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef(null);

    // Utility functions (same as before, no changes needed)
    const readFileAsArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    };

    const pcm16ToMuLaw = (pcm16) => {
        const MU = 255;
        const BIAS = 132;
        let sign = 0;
        if (pcm16 < 0) {
            pcm16 = -pcm16;
            sign = 0x80;
        }
        pcm16 = pcm16 + BIAS;
        if (pcm16 > 32767) {
            pcm16 = 32767;
        }
        let muLaw = Math.floor(Math.log(1 + (MU * pcm16) / 32767) / Math.log(1 + MU) * 128);
        return muLaw ^ sign ^ 0x7F;
    };

    const encodeWavToMuLaw = async (audioData) => {
        const fileData = new DataView(audioData);

        // WAV Header Parsing (identical)
        const riffChunkId = String.fromCharCode(...new Uint8Array(audioData, 0, 4));
        if (riffChunkId !== 'RIFF') {  throw new Error('Not a valid RIFF file.'); }
        const waveChunkId = String.fromCharCode(...new Uint8Array(audioData, 8, 4));
        if (waveChunkId !== 'WAVE') { throw new Error('Not a valid WAVE file.');}
        const fmtChunkId = String.fromCharCode(...new Uint8Array(audioData, 12, 4));
        if (fmtChunkId !== 'fmt ') {  throw new Error('fmt chunk not found.'); }
        const fmtChunkSize = fileData.getUint32(16, true);
        const audioFormat = fileData.getUint16(20, true);
        if (audioFormat !== 1) { throw new Error('Only PCM audio format is supported.'); }
        const numChannels = fileData.getUint16(22, true);
        const sampleRate = fileData.getUint32(24, true);
        const bitsPerSample = fileData.getUint16(34, true);
        if (bitsPerSample !== 16) { throw new Error('Only 16-bit audio is supported.'); }
        if (sampleRate % 8000 !== 0) { throw new Error("Sample rate must be a multiple of 8000 Hz."); }

        let dataChunkOffset = 12 + 8 + fmtChunkSize;
        let dataChunkId;
        do {
            dataChunkId = String.fromCharCode(...new Uint8Array(audioData, dataChunkOffset, 4));
            if (dataChunkId !== 'data') {
                const chunkSize = fileData.getUint32(dataChunkOffset + 4, true);
                dataChunkOffset += 8 + chunkSize;
                if (dataChunkOffset >= fileData.byteLength) {  throw new Error("Data chunk not found."); }
            }
        } while (dataChunkId !== 'data');

        const dataChunkSize = fileData.getUint32(dataChunkOffset + 4, true);
        const dataStart = dataChunkOffset + 8;
        const bytesPerSample = bitsPerSample / 8;

        // Downsampling, Noise Reduction, and Encoding (identical)
        const downsampleFactor = sampleRate / 8000;
        const outputBufferSize = Math.floor(dataChunkSize / (numChannels * bytesPerSample) / downsampleFactor);
        const outputBuffer = new Uint8Array(outputBufferSize);
        let outputIndex = 0;
        const windowSize = 5;
        const sampleBuffer = [];

        for (let i = dataStart; i < dataStart + dataChunkSize; i += bytesPerSample * numChannels) {
            let sum = 0;
            for (let channel = 0; channel < numChannels; channel++) {
                const sampleIndex = i + channel * bytesPerSample;
                if (sampleIndex < dataStart + dataChunkSize) {
                    sum += fileData.getInt16(sampleIndex, true);
                }
            }
            let monoSample = Math.round(sum / numChannels);

            sampleBuffer.push(monoSample);
            if (sampleBuffer.length > windowSize) {
                sampleBuffer.shift();
            }

            if ((i - dataStart) % (bytesPerSample * numChannels * downsampleFactor) === 0) {
                let smoothedSample = 0;
                if (sampleBuffer.length > 0) {
                    smoothedSample = Math.round(sampleBuffer.reduce((a, b) => a + b, 0) / sampleBuffer.length);
                }
                const muLawSample = pcm16ToMuLaw(smoothedSample);
                outputBuffer[outputIndex++] = muLawSample;
                const currentProgress = Math.round((outputIndex / outputBufferSize) * 100);
                setProgress(currentProgress);
            }
        }
        return outputBuffer;
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const originalFileName = file.name.replace(/\.wav$/i, "");
        setDownloadFileName(`${originalFileName}.ulaw`);

        try {
            const audioData = await readFileAsArrayBuffer(file);
            const fileData = new DataView(audioData);

            // WAV Header Parsing
            const riffChunkId = String.fromCharCode(...new Uint8Array(audioData, 0, 4));
            if (riffChunkId !== 'RIFF') { throw new Error('Not a valid RIFF file.'); }
            const waveChunkId = String.fromCharCode(...new Uint8Array(audioData, 8, 4));
            if (waveChunkId !== 'WAVE') { throw new Error('Not a valid WAVE file.'); }
            const fmtChunkId = String.fromCharCode(...new Uint8Array(audioData, 12, 4));
            if (fmtChunkId !== 'fmt ') {  throw new Error('fmt chunk not found.');  }
            const fmtChunkSize = fileData.getUint32(16, true);
            const audioFormat = fileData.getUint16(20, true);
            if (audioFormat !== 1) {  throw new Error('Only PCM audio format is supported.'); }
            const numChannels = fileData.getUint16(22, true);
            const sampleRate = fileData.getUint32(24, true);
            const bitsPerSample = fileData.getUint16(34, true);
            const byteRate = fileData.getUint32(28, true);

            setFileInfo({
                bitRate: `${byteRate * 8} bps`,
                channels: numChannels,
                sampleRate: `${sampleRate} Hz`,
                sampleSize: `${bitsPerSample} bit`
            });
            setMessage('');

        } catch (error) {
            console.error('Error reading WAV file:', error);
            setMessage(`Error: ${error.message}`);
            setFileInfo({});
        }
    };

    const handleRunConversion = async () => {
      if (!fileInputRef.current || !fileInputRef.current.files[0]) {
        UIkit.notification({message: 'Please select a WAV file first.', status: 'warning'}); // UIkit notification
        return;
      }
      setIsProcessing(true);
      setProgress(0);
      setMessage('Processing...');
      setDownloadUrl('');

      try {
          const file = fileInputRef.current.files[0];
          const audioData = await readFileAsArrayBuffer(file);
          const encodedData = await encodeWavToMuLaw(audioData);
          const blob = new Blob([encodedData], { type: 'audio/ulaw' });
          const url = URL.createObjectURL(blob);

          setDownloadUrl(url);
          setMessage('Conversion complete!');
      } catch (error) {
          console.error('Error during conversion:', error);
          UIkit.notification({message: `Error: ${error.message}`, status: 'danger'}); // UIkit notification
          setMessage(`Error: ${error.message}`); // Also set the message for display
          setProgress(0);
      } finally {
          setIsProcessing(false);
      }
    };

    return (
        <div className="uk-container">
            <h1 className="uk-heading-medium uk-text-center">WAV to μ-law Converter</h1>

            <div className="uk-margin">
                <div uk-form-custom="target: true">
                    <input type="file" accept=".wav" onChange={handleFileChange} ref={fileInputRef} />
                    <input className="uk-input uk-form-width-medium" type="text" placeholder="Select file" disabled />
                </div>
            </div>

            <div id="fileInfo" className="uk-card uk-card-default uk-card-body uk-margin" style={{ display: fileInfo.bitRate ? 'block' : 'none' }}>
                <h2 className="uk-card-title">File Information:</h2>
                <p>Bit Rate: <span className="uk-text-bold">{fileInfo.bitRate}</span></p>
                <p>Channels: <span className="uk-text-bold">{fileInfo.channels}</span></p>
                <p>Sample Rate: <span className="uk-text-bold">{fileInfo.sampleRate}</span></p>
                <p>Sample Size: <span className="uk-text-bold">{fileInfo.sampleSize}</span></p>
            </div>


            <button className="uk-button uk-button-primary uk-margin-right" onClick={handleRunConversion} disabled={isProcessing}  style={{display: fileInfo.bitRate? 'inline-block' : 'none'}}>
              {isProcessing ? <span uk-spinner="ratio: 0.8"></span> : null} Run Conversion
            </button>


            {downloadUrl && (
                <a href={downloadUrl} download={downloadFileName} className="uk-button uk-button-default">
                    Download μ-law
                </a>
            )}

            <div id="message" className="uk-margin">{message}</div>
             <progress id="progress" className="uk-progress" value={progress} max="100"></progress>
        </div>
    );
}

export default App;