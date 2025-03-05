// src/utils/audioUtils.js (Complete, with validation, encoding, header creation, and PCM conversion)

export const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
};

// Add WAV file validation
export const validateWavFile = async (file) => {
    if (!file) {
        throw new Error('No file selected.');
    }

    if (file.type !== 'audio/wav' && file.type !== 'audio/x-wav') {
      throw new Error('Invalid file type. Please select a .wav file.');
    }

    try {
        const audioData = await readFileAsArrayBuffer(file);
        const fileData = new DataView(audioData);

        // WAV Header Parsing and Validation
        const riffChunkId = String.fromCharCode(...new Uint8Array(audioData, 0, 4));
        if (riffChunkId !== 'RIFF') { throw new Error('Not a valid RIFF file.'); }

        const waveChunkId = String.fromCharCode(...new Uint8Array(audioData, 8, 4));
        if (waveChunkId !== 'WAVE') { throw new Error('Not a valid WAVE file.'); }

        const fmtChunkId = String.fromCharCode(...new Uint8Array(audioData, 12, 4));
        if (fmtChunkId !== 'fmt ') { throw new Error('fmt chunk not found.'); }

        const fmtChunkSize = fileData.getUint32(16, true);
        if (fmtChunkSize !== 16) { throw new Error('Invalid fmt chunk size. Only PCM/uncompressed WAV is supported.'); }

        const audioFormat = fileData.getUint16(20, true);
        if (audioFormat !== 1) { throw new Error('Only PCM audio format is supported.'); }

        const numChannels = fileData.getUint16(22, true);
        if (numChannels !== 1 && numChannels !== 2) { throw new Error('Only mono or stereo WAV files are supported.'); } //check channels.

        const sampleRate = fileData.getUint32(24, true);
        if (sampleRate % 8000 !== 0) { throw new Error("Sample rate must be a multiple of 8000 Hz.");}

        const bitsPerSample = fileData.getUint16(34, true);
        if (bitsPerSample !== 16) { throw new Error('Only 16-bit audio is supported.'); }

        // Check for the 'data' chunk.
        let dataChunkOffset = 12 + 8 + fmtChunkSize;  // Start *after* the 'fmt ' chunk
        let dataChunkId;
        do {
            dataChunkId = String.fromCharCode(...new Uint8Array(audioData, dataChunkOffset, 4));
            if (dataChunkId !== 'data') {
                // Get the size of the current chunk and skip it
                const chunkSize = fileData.getUint32(dataChunkOffset + 4, true);
                dataChunkOffset += 8 + chunkSize; // Move to the next chunk

                // Prevent infinite loops/out-of-bounds reads:
                if (dataChunkOffset >= fileData.byteLength) {
                    throw new Error("Data chunk not found.");
                }
            }
        } while (dataChunkId !== 'data');


    } catch (error) {
        throw error; // Re-throw the error
    }
};

export const pcm16ToMuLaw = (pcm16) => {
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

// CORRECTED muLawToPcm16
export const muLawToPcm16 = (muLaw) => {
    const MU = 255.0;
    const BIAS = 132;
    muLaw = ~muLaw; // Invert bits
    let sign = (muLaw & 0x80) ? -1 : 1;
    let exponent = (muLaw >> 4) & 0x07;
    let mantissa = muLaw & 0x0f;
    let sample = sign * (BIAS + (((1 << (exponent + 1)) - 1) << 4) + mantissa);

    return sample;
};

// Normalize and clip
export const normalizeAndClipPcm16 = (pcmData) => {
    let maxVal = 0;
    for (let i = 0; i < pcmData.length; i++) {
        if (Math.abs(pcmData[i]) > maxVal) {
            maxVal = Math.abs(pcmData[i]);
        }
    }
    if (maxVal > 32767) {
        const scale = 32767 / maxVal;
        for (let i = 0; i < pcmData.length; i++) {
            pcmData[i] = Math.round(pcmData[i] * scale);
        }
    }
    // Clipping (essential)
    for (let i = 0; i < pcmData.length; i++) {
        if (pcmData[i] > 32767) {
            pcmData[i] = 32767;
        } else if (pcmData[i] < -32768) {
            pcmData[i] = -32768;
        }
    }
};

export const encodeWavToMuLaw = async (audioData, setProgress) => {
    const fileData = new DataView(audioData);

    // WAV Header Parsing
    const riffChunkId = String.fromCharCode(...new Uint8Array(audioData, 0, 4));
    const waveChunkId = String.fromCharCode(...new Uint8Array(audioData, 8, 4));
    const fmtChunkId = String.fromCharCode(...new Uint8Array(audioData, 12, 4));
    const fmtChunkSize = fileData.getUint32(16, true);
    const audioFormat = fileData.getUint16(20, true);
    const numChannels = fileData.getUint16(22, true);
    const sampleRate = fileData.getUint32(24, true);
    const bitsPerSample = fileData.getUint16(34, true);
    if (bitsPerSample !== 16) { throw new Error('Only 16-bit audio is supported.'); } // Keep this check
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

    // Downsampling, Noise Reduction, and Encoding
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

// Creates a WAV header for μ-law data
export const createWavHeader = (dataLength) => {
    try {
        const buffer = new ArrayBuffer(44);
        const view = new DataView(buffer);

        // RIFF chunk descriptor
        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + dataLength, true); // Chunk size (44 - 8 + dataLength)
        view.setUint32(8, 0x57415645, false); // "WAVE"

        // fmt sub-chunk
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true);        // Sub-chunk size (16 for PCM and u-law)
        view.setUint16(20, 7, true);         // Audio format (7 for μ-law)
        view.setUint16(22, 1, true);         // Number of channels (1 = mono)
        view.setUint32(24, 8000, true);      // Sample rate (8000 Hz)
        view.setUint32(28, 8000, true);      // Byte rate (SampleRate * NumChannels * BitsPerSample / 8)
        view.setUint16(32, 1, true);         // Block align (NumChannels * BitsPerSample / 8)
        view.setUint16(34, 8, true);         // Bits per sample (8 for μ-law)

        // data sub-chunk
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, dataLength, true);   // Data size

        return buffer;

    } catch (error) {
        console.error("Error in createWavHeader:", error);
        throw error;
    }
};