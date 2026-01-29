"use client";

import { useState, useRef, useEffect } from "react";
import { Ramaraja } from "next/font/google";

const ramaraja = Ramaraja({
    weight: "400",
    subsets: ["latin", "telugu"],
});

interface TranscriptionViewProps {
    text: string;
    vtt: string;
    audioUrl: string;
    onReset: () => void;
}

interface Word {
    text: string;
    startTime: number;
    endTime: number;
}

interface Caption {
    start: number;
    end: number;
    text: string;
    words: Word[];
}

export default function TranscriptionView({ text, vtt, audioUrl, onReset }: TranscriptionViewProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [captions, setCaptions] = useState<Caption[]>([]);
    const [displayedText, setDisplayedText] = useState("");
    const audioRef = useRef<HTMLAudioElement>(null);

    // Parse VTT to extract captions and estimate word timings
    useEffect(() => {
        const parsedCaptions: Caption[] = [];
        const lines = vtt.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const timestampMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);

            if (timestampMatch) {
                const startH = parseInt(timestampMatch[1]);
                const startM = parseInt(timestampMatch[2]);
                const startS = parseInt(timestampMatch[3]);
                const startMs = parseInt(timestampMatch[4]);
                const endH = parseInt(timestampMatch[5]);
                const endM = parseInt(timestampMatch[6]);
                const endS = parseInt(timestampMatch[7]);
                const endMs = parseInt(timestampMatch[8]);

                const start = startH * 3600 + startM * 60 + startS + startMs / 1000;
                const end = endH * 3600 + endM * 60 + endS + endMs / 1000;

                const captionText = lines[i + 1]?.trim() || "";

                if (captionText) {
                    // Split text into words and estimate timing for each word
                    const words = captionText.split(/\s+/);
                    const duration = end - start;
                    const timePerWord = duration / words.length;

                    const wordTimings: Word[] = words.map((word, idx) => ({
                        text: word,
                        startTime: start + (idx * timePerWord),
                        endTime: start + ((idx + 1) * timePerWord),
                    }));

                    parsedCaptions.push({ start, end, text: captionText, words: wordTimings });
                }
            }
        }

        setCaptions(parsedCaptions);
    }, [vtt]);

    // Update current time and displayed text as audio plays
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            const time = audio.currentTime;
            setCurrentTime(time);

            // Find current and previous caption to show only last 2 sentences
            let displayCaptions: string[] = [];
            let currentIndex = -1;

            // Find the current caption index
            for (let i = 0; i < captions.length; i++) {
                if (time >= captions[i].start && time <= captions[i].end) {
                    currentIndex = i;
                    break;
                }
            }

            // If we found a current caption, show it and the previous one
            if (currentIndex >= 0) {
                // Add previous caption if it exists
                if (currentIndex > 0) {
                    displayCaptions.push(captions[currentIndex - 1].text);
                }
                // Add current caption
                displayCaptions.push(captions[currentIndex].text);
            } else {
                // If no current caption, check if we're past any captions
                for (let i = captions.length - 1; i >= 0; i--) {
                    if (time > captions[i].end) {
                        // Show the last 2 completed captions
                        if (i > 0) {
                            displayCaptions.push(captions[i - 1].text);
                        }
                        displayCaptions.push(captions[i].text);
                        break;
                    }
                }
            }

            setDisplayedText(displayCaptions.join('\n'));
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
    }, [captions]);

    return (
        <div className="w-full space-y-6 opacity-0" style={{ animation: 'fadeIn 0.7s ease-out forwards' }}>

            {/* Audio Player Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl shadow-black/10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Audio Playback</h3>
                </div>
                <audio
                    ref={audioRef}
                    controls
                    className="w-full h-12 rounded-xl accent-purple-500 shadow-inner"
                    src={audioUrl}
                >
                    Your browser does not support the audio element.
                </audio>
            </div>

            {/* Live Lyrics Display */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Live Lyrics</h3>
                            <p className="text-xs text-gray-400">Words appear as the audio plays</p>
                        </div>
                    </div>
                </div>

                {/* Lyrics Content */}
                <div className="p-8 min-h-[400px] max-h-[500px] overflow-y-auto custom-scrollbar bg-gradient-to-b from-black/20 to-black/40">
                    {displayedText ? (
                        <div className="prose prose-invert max-w-none">
                            <p
                                className={`${ramaraja.className} text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 font-bold text-center whitespace-pre-line`}
                                style={{
                                    animation: 'slowFadeIn 2s ease-in-out',
                                    textShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
                                }}
                            >
                                {displayedText}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="p-4 bg-purple-500/10 rounded-full">
                                <svg className="w-16 h-16 text-purple-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xl text-gray-300 font-semibold">Press play to start</p>
                                <p className="text-sm text-gray-500 mt-2">Lyrics will appear as the audio plays</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 bg-black/30 flex flex-wrap gap-3 items-center justify-between border-t border-white/5">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(text);
                        }}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 border border-white/10 flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                        Copy Full Text
                    </button>

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(vtt);
                        }}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 border border-white/10 flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                        </svg>
                        Copy VTT
                    </button>

                    <button
                        onClick={onReset}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/30 hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        Upload New File
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slowFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
            filter: blur(4px);
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }
      `}</style>
        </div>
    );
}
