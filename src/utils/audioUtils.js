// src/utils/audioUtils.js
export const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
};

export const encodeWavToMuLaw = async (audioData, setProgress) => { // audioData is a Uint8Array
    return new Promise((resolve, reject) => {
        try {
            console.log("encodeWavToMuLaw: Started");
            // Create DataView from the *underlying* buffer of the Uint8Array
            const fileData = new DataView(audioData.buffer);

            // --- WAV Header Parsing ---
            const riffChunkId = String.fromCharCode(...new Uint8Array(audioData.buffer, 0, 4));
            if (riffChunkId !== 'RIFF') throw new Error('Not a valid RIFF file.');

            const waveChunkId = String.fromCharCode(...new Uint8Array(audioData.buffer, 8, 4));
            if (waveChunkId !== 'WAVE') throw new Error('Not a valid WAVE file.');

            const fmtChunkId = String.fromCharCode(...new Uint8Array(audioData.buffer, 12, 4));
            if (fmtChunkId !== 'fmt ') throw new Error('fmt chunk not found.');

            const fmtChunkSize = fileData.getUint32(16, true);
            const audioFormat = fileData.getUint16(20, true);
            if (audioFormat !== 1) throw new Error('Only PCM audio format is supported.');
            const numChannels = fileData.getUint16(22, true);
            const sampleRate = fileData.getUint32(24, true);
            const bitsPerSample = fileData.getUint16(34, true);

            if (bitsPerSample !== 16) throw new Error('Only 16-bit audio is supported.');
            if (sampleRate % 8000 !== 0) throw new Error("Sample rate must be a multiple of 8000 Hz.");

            let dataChunkOffset = 12 + 8 + fmtChunkSize;
            let dataChunkId;
            do {
                dataChunkId = String.fromCharCode(...new Uint8Array(audioData.buffer, dataChunkOffset, 4));
                if (dataChunkId !== 'data') {
                    const chunkSize = fileData.getUint32(dataChunkOffset + 4, true);
                    dataChunkOffset += 8 + chunkSize;
                    if (dataChunkOffset >= fileData.byteLength) throw new Error("Data chunk not found."); // Use byteLength
                }
            } while (dataChunkId !== 'data');

            const dataChunkSize = fileData.getUint32(dataChunkOffset + 4, true);
            const dataStart = dataChunkOffset + 8;
            const bytesPerSample = bitsPerSample / 8;
            console.log(`encodeWavToMuLaw: dataChunkSize=${dataChunkSize}, dataStart=${dataStart}, bytesPerSample=${bytesPerSample}, numChannels=${numChannels}, sampleRate=${sampleRate}`);

            // --- Downsampling, Noise Reduction, and Encoding ---
            const downsampleFactor = sampleRate / 8000;
            const outputBufferSize = Math.floor(dataChunkSize / (numChannels * bytesPerSample) / downsampleFactor);
            const outputBuffer = new Uint8Array(outputBufferSize);
            let outputIndex = 0;
            const windowSize = 5;
            const sampleBuffer = [];
            console.log(`encodeWavToMuLaw: downsampleFactor=${downsampleFactor}, outputBufferSize=${outputBufferSize}`);

            let i = dataStart;
            const processChunk = () => {
                try {
                    console.log(`processChunk: Called! i=${i}, outputIndex=${outputIndex}`); // VERY DETAILED LOGGING

                    if (outputIndex < outputBufferSize) {
                        let sum = 0;
                        for (let channel = 0; channel < numChannels; channel++) {
                            const sampleIndex = i + channel * bytesPerSample;
                            console.log(`processChunk:  sampleIndex=${sampleIndex}`); // Log sampleIndex

                            if (sampleIndex < dataStart + dataChunkSize) {
                                console.log(`processChunk:  Attempting to read from DataView`); // Log before read
                                try {
                                    const sample = fileData.getInt16(sampleIndex, true); // Read and store in a variable
                                    console.log(`processChunk:  Successfully read sample: ${sample}`); // Log successful read
                                    sum += sample;
                                } catch (readError) {
                                    console.error("processChunk:  Error reading from DataView:", readError); // Log DataView errors
                                    reject(readError); // Reject the promise
                                    return; // IMPORTANT: Stop processing if there's a read error
                                }
                            } else {
                                console.log(`processChunk: sampleIndex out of bounds`);
                            }
                        }
                        let monoSample = Math.round(sum / numChannels);

                        sampleBuffer.push(monoSample);
                        if (sampleBuffer.length > windowSize) {
                            sampleBuffer.shift();
                        }

                        let smoothedSample = 0;
                        if (sampleBuffer.length > 0) {
                            smoothedSample = Math.round(sampleBuffer.reduce((a, b) => a + b, 0) / sampleBuffer.length);
                        }
                        const muLawSample = pcm16ToMuLaw(smoothedSample);
                        console.log(`processChunk:  Writing muLawSample: ${muLawSample} to outputIndex: ${outputIndex}`); // Log write
                        outputBuffer[outputIndex++] = muLawSample;
                        i += bytesPerSample * numChannels * downsampleFactor;

                        const currentProgress = Math.round((100.0 * outputIndex) / outputBufferSize);
                        setProgress(currentProgress);
                        console.log(`processChunk: Progress: ${currentProgress}%`);
                        requestAnimationFrame(processChunk);

                    } else {
                        console.log("processChunk: Resolving promise - All chunks processed.");
                        resolve(outputBuffer);
                    }
                } catch (err) {
                    console.error("processChunk: Error:", err);
                    reject(err);
                }
            };
            console.log("encodeWavToMuLaw: Starting processing with requestAnimationFrame");
            requestAnimationFrame(processChunk);

        } catch (err) {
            console.error("encodeWavToMuLaw: Error in outer try-catch:", err);
            reject(err);
        }
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