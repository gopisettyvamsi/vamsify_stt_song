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

        // Determine sample rate based on compression needed
        let targetSampleRate = 16000; // Good for speech
        if (compressionRatio > 3) {
            targetSampleRate = 11025; // More aggressive
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

        // Use MediaRecorder to compress to webm/opus (very efficient for speech)
        const compressedBlob = await encodeWithMediaRecorder(renderedBuffer, compressionRatio);

        onProgress?.({
            stage: 'encoding',
            progress: 90,
            originalSize: file.size,
        });

        const compressedFile = new File(
            [compressedBlob],
            file.name.replace(/\.[^.]+$/, '.webm'),
            { type: 'audio/webm' }
        );

        onProgress?.({
            stage: 'complete',
            progress: 100,
            originalSize: file.size,
            currentSize: compressedFile.size,
        });

        console.log(`Compression: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${targetSampleRate}Hz)`);

        return compressedFile;
    } catch (error) {
        console.error('Compression error:', error);
        throw new Error('Failed to compress audio file');
    }
}

// Helper function to encode AudioBuffer using MediaRecorder
async function encodeWithMediaRecorder(audioBuffer: AudioBuffer, compressionRatio: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        // Create a new audio context for playback
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create a MediaStreamDestination
        const destination = audioContext.createMediaStreamDestination();

        // Create a buffer source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(destination);

        // Determine bitrate based on compression ratio
        let audioBitsPerSecond = 48000; // Default
        if (compressionRatio > 4) {
            audioBitsPerSecond = 24000; // Very aggressive
        } else if (compressionRatio > 2.5) {
            audioBitsPerSecond = 32000;
        } else if (compressionRatio > 1.5) {
            audioBitsPerSecond = 48000;
        } else {
            audioBitsPerSecond = 64000;
        }

        // Create MediaRecorder with opus codec (best compression for speech)
        const mimeType = 'audio/webm;codecs=opus';
        const mediaRecorder = new MediaRecorder(destination.stream, {
            mimeType,
            audioBitsPerSecond,
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            resolve(blob);
        };

        mediaRecorder.onerror = (e) => {
            reject(new Error('MediaRecorder error'));
        };

        // Start recording
        mediaRecorder.start();
        source.start(0);

        // Stop recording when audio finishes
        source.onended = () => {
            setTimeout(() => {
                mediaRecorder.stop();
                audioContext.close();
            }, 100);
        };
    });
}
