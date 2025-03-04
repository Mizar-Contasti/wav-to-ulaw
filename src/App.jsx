// src/App.js
import React, { useState, useRef, useEffect } from 'react';
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';
import FileInput from './components/FileInput';
import FileInfoDisplay from './components/FileInfoDisplay';
import ConversionButton from './components/ConversionButton';
import DownloadLink from './components/DownloadLink';
import MessageDisplay from './components/MessageDisplay';
import ProgressBar from './components/ProgressBar';
import ULawPlayer from './components/ULawPlayer'; // Import the player
import { readFileAsArrayBuffer, pcm16ToMuLaw, encodeWavToMuLaw } from './utils/audioUtils';

UIkit.use(Icons);

function App() {
    const [fileInfo, setFileInfo] = useState({
        bitRate: '', channels: '', sampleRate: '', sampleSize: ''
    });
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [downloadFileName, setDownloadFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uLawData, setULawData] = useState(null); // Store the encoded uLaw data
    const fileInputRef = useRef(null);


    const handleFileChange = async (file) => {
      if (!file) return;

      setSelectedFile(file);
      const originalFileName = file.name.replace(/\.wav$/i, "");
      setDownloadFileName(`${originalFileName}.ulaw`);
      setULawData(null); // Clear previous uLaw data

      try {
          const audioData = await readFileAsArrayBuffer(file);
          const fileData = new DataView(audioData);

          // WAV Header Parsing (no changes)
          const riffChunkId = String.fromCharCode(...new Uint8Array(audioData, 0, 4));
          if (riffChunkId !== 'RIFF') { throw new Error('Not a valid RIFF file.'); }
          const waveChunkId = String.fromCharCode(...new Uint8Array(audioData, 8, 4));
          if (waveChunkId !== 'WAVE') { throw new Error('Not a valid WAVE file.'); }
          const fmtChunkId = String.fromCharCode(...new Uint8Array(audioData, 12, 4));
          if (fmtChunkId !== 'fmt ') { throw new Error('fmt chunk not found.'); }
          const fmtChunkSize = fileData.getUint32(16, true);
          const audioFormat = fileData.getUint16(20, true);
          if (audioFormat !== 1) { throw new Error('Only PCM audio format is supported.'); }
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
          UIkit.notification({ message: `Error: ${error.message}`, status: 'danger' });
          setMessage(`Error: ${error.message}`);
          setFileInfo({});
      }
    };

    const handleRunConversion = async () => {
        if (!selectedFile) {
            UIkit.notification({ message: 'Please select a WAV file first.', status: 'warning' });
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setMessage('Processing...');
        setDownloadUrl('');
        setULawData(null); // Clear previous uLaw data

        try {
            const audioData = await readFileAsArrayBuffer(selectedFile);
            const encodedData = await encodeWavToMuLaw(audioData, setProgress);
            const blob = new Blob([encodedData], { type: 'audio/ulaw' });
            const url = URL.createObjectURL(blob);

            setDownloadUrl(url);
            setULawData(encodedData); // Store the encoded data
            setMessage('Conversion complete!');
        } catch (error) {
            console.error('Error during conversion:', error);
            UIkit.notification({ message: `Error: ${error.message}`, status: 'danger' });
            setMessage(`Error: ${error.message}`);
            setProgress(0);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="uk-container">
            <h1 className="uk-heading-medium uk-text-center">WAV to μ-law Converter</h1>
            <FileInput onChange={handleFileChange} ref={fileInputRef} />
            <FileInfoDisplay fileInfo={fileInfo} />
            <ConversionButton onConvert={handleRunConversion} disabled={isProcessing} isProcessing={isProcessing} show={fileInfo.bitRate} />
            <DownloadLink url={downloadUrl} fileName={downloadFileName} />
            <MessageDisplay message={message} />
            <ProgressBar progress={progress} />
            <ULawPlayer uLawData={uLawData} sampleRate={fileInfo.sampleRate}/>
        </div>
    );
}

export default App;