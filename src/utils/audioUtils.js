// src/utils/audioUtils.js  (Add muLawToPcm16)

export const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
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


export const muLawToPcm16 = (muLaw) => {
    const MU = 255;
    const BIAS = 132;
    const sign = (muLaw >> 7) & 1;
    let linear = ((1 << ((muLaw >> 4) & 0x07)) - 1) << 4;
     linear |= (muLaw & 0x0F); // Add in the bits
     linear = linear << 1; //Left shift one more time.
     linear = linear - BIAS; //Subtract out the bias.
    if (sign) {
      linear = -linear; // If sign bit is set, take the two's complement
    }

    return linear;
};



export const encodeWavToMuLaw = async (audioData, setProgress) => {
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