// src/App.js (Updated footer text)

import React, { useState, useRef, useEffect } from 'react';
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';
import FileInput from './components/FileInput';
import FileInfoDisplay from './components/FileInfoDisplay';
import ConversionButton from './components/ConversionButton';
import DownloadLink from './components/DownloadLink';
import MessageDisplay from './components/MessageDisplay';
import ProgressBar from './components/ProgressBar';
import ULawPlayer from './components/ULawPlayer';
import { readFileAsArrayBuffer, encodeWavToMuLaw, createWavHeader, validateWavFile } from './utils/audioUtils';

UIkit.use(Icons);

function App() {
    const [fileInfo, setFileInfo] = useState({
        bitRate: '', channels: '', sampleRate: '', sampleSize: '', duration: '', fileSize: ''
    });
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [downloadFileName, setDownloadFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uLawData, setULawData] = useState(null);
    const [modalMessage, setModalMessage] = useState('');
    const fileInputRef = useRef(null);
    const modalRef = useRef(null);

    // Get the current year
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        if (modalRef.current) {
            UIkit.modal(modalRef.current);
        }
    }, []);

    const handleFileChange = async (file) => {
        if (!file) return;

        try {
            await validateWavFile(file);

            setSelectedFile(file);
            const originalFileName = file.name.replace(/\.wav$/i, "");
            setDownloadFileName(`${originalFileName}.ulaw`);
            setULawData(null);
            setProgress(0);

            const audioData = await readFileAsArrayBuffer(file);
            const fileData = new DataView(audioData);

            const numChannels = fileData.getUint16(22, true);
            const sampleRate = fileData.getUint32(24, true);
            const bitsPerSample = fileData.getUint16(34, true);
            const byteRate = fileData.getUint32(28, true);

            let dataChunkOffset = 12 + 8 + fileData.getUint32(16, true);
            let dataChunkId;
            do {
                dataChunkId = String.fromCharCode(...new Uint8Array(audioData, dataChunkOffset, 4));
                if (dataChunkId !== 'data') {
                    const chunkSize = fileData.getUint32(dataChunkOffset + 4, true);
                    dataChunkOffset += 8 + chunkSize;
                    if (dataChunkOffset >= fileData.byteLength) {
                        throw new Error("Data chunk not found.");
                    }
                }
            } while (dataChunkId !== 'data');
            const dataChunkSize = fileData.getUint32(dataChunkOffset + 4, true);
            const durationInSeconds = dataChunkSize / byteRate;

            setFileInfo({
                bitRate: `${byteRate * 8} bps`,
                channels: numChannels,
                sampleRate: `${sampleRate} Hz`,
                sampleSize: `${bitsPerSample} bit`,
                duration: durationInSeconds,
                fileSize: file.size
            });
            setMessage('');

        } catch (error) {
            console.error('Error validating/reading WAV:', error);
            setModalMessage(error.message);
            UIkit.modal(modalRef.current).show();
            setFileInfo({});
            setSelectedFile(null);
            setProgress(0);
        }
    };

    const handleRunConversion = async () => {
        if (!selectedFile) {
            setModalMessage('Please select a WAV file first.');
            UIkit.modal(modalRef.current).show();
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setMessage('Processing...');
        setDownloadUrl('');
        setULawData(null);

        try {
            const audioData = await readFileAsArrayBuffer(selectedFile);
            const encodedData = await encodeWavToMuLaw(audioData, setProgress);
            setULawData(encodedData);

            const header = createWavHeader(encodedData.length);
            const combined = new Uint8Array(header.byteLength + encodedData.length);
            combined.set(new Uint8Array(header), 0);
            combined.set(encodedData, header.byteLength);
            const blob = new Blob([combined], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            setMessage('Conversion complete!');
        } catch (error) {
            console.error('Error during conversion:', error);
            setModalMessage(`Error: ${error.message}`);
            UIkit.modal(modalRef.current).show();
            setMessage(`Error: ${error.message}`);
            setProgress(0);
        } finally {
            setIsProcessing(false);
        }
    };

    const closeModal = () => {
        UIkit.modal(modalRef.current).hide();
        setModalMessage('');
    };

    return (
        <div className="uk-flex uk-flex-center uk-flex-middle uk-height-viewport">
            <div className="uk-width-1-2@m uk-width-2-3@s">
                <div className="uk-card uk-card-default uk-card-body">
                    <h1 className="uk-heading-medium uk-text-center">WAV to μ-law Converter</h1>
                    <FileInput onChange={handleFileChange} ref={fileInputRef} />
                    <FileInfoDisplay fileInfo={fileInfo} />
                    <ConversionButton onConvert={handleRunConversion} disabled={isProcessing} isProcessing={isProcessing} show={fileInfo.bitRate} />
                    <DownloadLink url={downloadUrl} fileName={downloadFileName} />
                    <MessageDisplay message={message} />
                    <ProgressBar progress={progress} />
                    <ULawPlayer uLawData={uLawData} />

                    {/* Updated Footer Text */}
                    <p className="uk-text-small uk-text-muted uk-text-center uk-margin-top">
                        Coded by <a href="https://github.com/Mizar-Contasti" target="_blank" rel="noopener noreferrer">Mizar</a> {currentYear}
                    </p>
                </div>
            </div>

            {/* UIkit Modal */}
            <div ref={modalRef} uk-modal="container: false">
                <div className="uk-modal-dialog uk-modal-body">
                    <h2 className="uk-modal-title">Error</h2>
                    <p>{modalMessage}</p>
                    <button className="uk-button uk-button-default uk-modal-close" type="button" onClick={closeModal}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default App;