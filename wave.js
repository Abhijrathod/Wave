const fs = require('fs');

const sampleRate = 44100;
const bitDepth = 16;

class SineOscillator {
    constructor(freq, amp) {
        this.frequency = freq;
        this.amplitude = amp;
        this.angle = 0.0;
        this.offset = (2 * Math.PI * this.frequency) / sampleRate;
    }

    process() {
        const sample = this.amplitude * Math.sin(this.angle);
        this.angle += this.offset;
        return sample;
    }
}

function writeToFile(filename, data) {
    fs.writeFileSync(filename, data);
}

function generateWavFile(filename, duration) {
    const audioData = [];
    const maxAmplitude = Math.pow(2, bitDepth - 1) - 1;
    const sineOscillator = new SineOscillator(440, 0.5);

    for (let i = 0; i < sampleRate * duration; i++) {
        const sample = sineOscillator.process();
        const intSample = Math.round(sample * maxAmplitude);
        audioData.push(intSample & 0xff, (intSample >> 8) & 0xff);
    }

    const dataSize = audioData.length * (bitDepth / 8);
    const fileSize = 36 + dataSize;

    // Header chunk
    const header = new Uint8Array(44);
    header.set([82, 73, 70, 70]); // "RIFF"
    header.set(new Uint32Array([fileSize]), 4);
    header.set([87, 65, 86, 69], 8); // "WAVE"
    // Format chunk
    header.set([102, 109, 116, 32], 12); // "fmt "
    header.set(new Uint32Array([16]), 16); // Size of format chunk
    header.set(new Uint16Array([1]), 20); // Compression code
    header.set(new Uint16Array([1]), 22); // Number of channels
    header.set(new Uint32Array([sampleRate]), 24); // Sample rate
    header.set(new Uint32Array([sampleRate * bitDepth / 8]), 28); // Byte rate
    header.set(new Uint16Array([bitDepth / 8]), 32); // Block align
    header.set(new Uint16Array([bitDepth]), 34); // Bit depth
    // Data chunk
    header.set([100, 97, 116, 97], 36); // "data"
    header.set(new Uint32Array([dataSize]), 40); // Size of data chunk

    const wavData = new Uint8Array(header.length + audioData.length);
    wavData.set(header);
    wavData.set(audioData, header.length);

    writeToFile(filename, wavData);
}

const filename = 'waveform.wav';
const duration = 2; // seconds
generateWavFile(filename, duration);
