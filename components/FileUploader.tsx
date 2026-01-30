"use client";

import { useState, useRef, ChangeEvent } from "react";

interface FileUploaderProps {
    onTranscriptionComplete: (data: { text: string; vtt: string; audioUrl: string }) => void;
    apiKey?: string;
}

export default function FileUploader({ onTranscriptionComplete, apiKey }: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        setError(null);
        const validExtensions = ["mp3", "wav", "m4a"];
        const extension = file.name.split(".").pop()?.toLowerCase();

        if (!extension || !validExtensions.includes(extension)) {
            setError("Invalid file type. Please upload MP3, WAV, or M4A.");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setError("File size exceeds 20MB limit.");
            return;
        }

        setFile(file);
    };

    const handleTranscribe = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/transcribe", {
                method: "POST",
                headers: apiKey ? {
                    "X-Custom-API-Key": apiKey,
                } : {},
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Transcription failed");
            }

            // Create a local blob URL for the audio file to play it back
            const audioUrl = URL.createObjectURL(file);

            onTranscriptionComplete({
                text: data.text,
                vtt: data.vtt,
                audioUrl,
            });

        } catch (err: any) {
            setError(err.message || "An error occurred during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/20">

                <div
                    className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center gap-5 group
            ${isDragging
                            ? "border-purple-400 bg-purple-500/20 scale-[1.02] shadow-lg shadow-purple-500/20"
                            : "border-gray-600/50 hover:border-purple-400/70 hover:bg-white/5"
                        }
          `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".mp3,.wav,.m4a"
                        className="hidden"
                    />

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                        <div className="relative p-5 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className="w-10 h-10"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        {file ? (
                            <>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-semibold text-green-300">File Selected</span>
                                </div>
                                <p className="text-base font-medium text-white break-all px-4">{file.name}</p>
                                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </>
                        ) : (
                            <>
                                <p className="text-xl font-semibold text-white">
                                    Drop your audio file here
                                </p>
                                <p className="text-sm text-gray-400">
                                    or click to browse
                                </p>
                                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
                                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">MP3</span>
                                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">WAV</span>
                                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">M4A</span>
                                    <span className="text-gray-600">•</span>
                                    <span>Max 20MB</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleTranscribe}
                    disabled={!file || isUploading}
                    className={`mt-6 w-full py-4 rounded-xl font-bold text-base text-white shadow-xl transition-all duration-300 relative overflow-hidden
            ${!file || isUploading
                            ? "bg-gray-700 cursor-not-allowed opacity-50"
                            : "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]"
                        }
          `}
                >
                    {!file || isUploading ? null : (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    )}
                    {isUploading ? (
                        <div className="flex items-center justify-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Transcribing with AI...</span>
                        </div>
                    ) : (
                        <span className="relative z-10">Start Transcription</span>
                    )}
                </button>
            </div>
        </div>
    );
}
