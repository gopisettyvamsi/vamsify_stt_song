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

        // Reduce sample rate based on compression needed
        let targetSampleRate = 16000; // Default for speech
        if (compressionRatio > 3) {
            targetSampleRate = 12000; // More aggressive compression
        } else if (compressionRatio > 2) {
            targetSampleRate = 16000;
        } else {
            targetSampleRate = 22050;
        }

        // Resample audio
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
            progress: 70,
            originalSize: file.size,
        });

        const renderedBuffer = await offlineContext.startRendering();

        onProgress?.({
            stage: 'encoding',
            progress: 85,
            originalSize: file.size,
        });

        // Convert to WAV format (simple, no external dependencies)
        const wavBlob = audioBufferToWav(renderedBuffer);

        const compressedFile = new File(
            [wavBlob],
            file.name.replace(/\.[^.]+$/, '.wav'),
            { type: 'audio/wav' }
        );

        onProgress?.({
            stage: 'complete',
            progress: 100,
            originalSize: file.size,
            currentSize: compressedFile.size,
        });

        return compressedFile;
    } catch (error) {
        console.error('Compression error:', error);
        throw new Error('Failed to compress audio file');
    }
}

// Helper function to convert AudioBuffer to WAV
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
        view.setUint16(pos, data, true);
        pos += 2;
    };

    const setUint32 = (data: number) => {
        view.setUint32(pos, data, true);
        pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // File length minus RIFF identifier length and file description length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // Format chunk identifier
    setUint32(0x20746d66);
    // Format chunk length
    setUint32(16);
    // Sample format (raw)
    setUint16(1);
    // Channel count
    setUint16(buffer.numberOfChannels);
    // Sample rate
    setUint32(buffer.sampleRate);
    // Byte rate (sample rate * block align)
    setUint32(buffer.sampleRate * buffer.numberOfChannels * 2);
    // Block align (channel count * bytes per sample)
    setUint16(buffer.numberOfChannels * 2);
    // Bits per sample
    setUint16(16);
    // Data chunk identifier
    setUint32(0x61746164);
    // Data chunk length
    setUint32(length - pos - 4);

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            let sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
}
