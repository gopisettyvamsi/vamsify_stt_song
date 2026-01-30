import lamejs from 'lamejs';

export interface CompressionProgress {
    stage: 'decoding' | 'encoding' | 'complete';
    progress: number; // 0-100
    originalSize: number;
    currentSize?: number;
}

export async function compressAudio(
    file: File,
    onProgress?: (progress: CompressionProgress) => void
): Promise<File> {
    const MAX_SIZE = 4 * 1024 * 1024; // Target 4MB to be safe

    // If file is already small enough, return as-is
    if (file.size <= MAX_SIZE) {
        return file;
    }

    try {
        onProgress?.({
            stage: 'decoding',
            progress: 10,
            originalSize: file.size,
        });

        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();

        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        onProgress?.({
            stage: 'decoding',
            progress: 30,
            originalSize: file.size,
        });

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        onProgress?.({
            stage: 'encoding',
            progress: 50,
            originalSize: file.size,
        });

        // Calculate compression ratio needed
        const compressionRatio = file.size / MAX_SIZE;

        // Determine bitrate based on compression needed
        let bitrate = 64; // Default low bitrate for speech
        if (compressionRatio > 4) {
            bitrate = 32; // Very aggressive compression
        } else if (compressionRatio > 2.5) {
            bitrate = 48;
        } else if (compressionRatio > 1.5) {
            bitrate = 64;
        } else {
            bitrate = 96;
        }

        // Determine sample rate
        let targetSampleRate = 16000; // Good for speech
        if (compressionRatio > 3) {
            targetSampleRate = 12000; // More aggressive
        } else if (compressionRatio > 2) {
            targetSampleRate = 16000;
        } else {
            targetSampleRate = 22050;
        }

        // Resample audio to mono
        const offlineContext = new OfflineAudioContext(
            1, // Mono for smaller size
            audioBuffer.duration * targetSampleRate,
            targetSampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start(0);

        onProgress?.({
            stage: 'encoding',
            progress: 60,
            originalSize: file.size,
        });

        const renderedBuffer = await offlineContext.startRendering();

        onProgress?.({
            stage: 'encoding',
            progress: 75,
            originalSize: file.size,
        });

        // Convert to MP3 using lamejs
        const mp3Data = encodeToMp3(renderedBuffer, bitrate);

        onProgress?.({
            stage: 'encoding',
            progress: 90,
            originalSize: file.size,
        });

        const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });

        const compressedFile = new File(
            [mp3Blob],
            file.name.replace(/\.[^.]+$/, '.mp3'),
            { type: 'audio/mp3' }
        );

        onProgress?.({
            stage: 'complete',
            progress: 100,
            originalSize: file.size,
            currentSize: compressedFile.size,
        });

        console.log(`Compression: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${bitrate}kbps, ${targetSampleRate}Hz)`);

        return compressedFile;
    } catch (error) {
        console.error('Compression error:', error);
        throw new Error('Failed to compress audio file');
    }
}

// Helper function to encode AudioBuffer to MP3
function encodeToMp3(audioBuffer: AudioBuffer, bitrate: number): Blob[] {
    const mp3encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, bitrate);
    const samples = audioBuffer.getChannelData(0);

    // Convert float samples to 16-bit PCM
    const sampleBlockSize = 1152; // LAME encoding block size
    const mp3Data: Int8Array[] = [];

    const int16Samples = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Encode in blocks
    for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
        const sampleChunk = int16Samples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }

    // Flush remaining data
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    return mp3Data.map(data => new Blob([data], { type: 'audio/mp3' }));
}
