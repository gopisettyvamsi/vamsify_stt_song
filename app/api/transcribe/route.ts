import { NextRequest, NextResponse } from "next/server";
import styles from "./route.module.css"; // Dummy import to trigger css module generation if needed, but not really needed here.
import OpenAI from "openai";

// Configure route to handle larger payloads
export const runtime = 'nodejs';
export const maxDuration = 60; // Maximum execution time in seconds
export const dynamic = 'force-dynamic';

// Initialize OpenAI client with Groq configuration
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

interface Segment {
  start: number;
  end: number;
  text: string;
}

function formatTime(seconds: number): string {
  const date = new Date(0);
  date.setMilliseconds(seconds * 1000);
  const hh = date.getUTCHours().toString().padStart(2, "0");
  const mm = date.getUTCMinutes().toString().padStart(2, "0");
  const ss = date.getUTCSeconds().toString().padStart(2, "0");
  const ms = date.getUTCMilliseconds().toString().padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function generateVTT(segments: Segment[]): string {
  let vtt = "WEBVTT\n\n";
  segments.forEach((segment) => {
    const start = formatTime(segment.start);
    const end = formatTime(segment.end);
    vtt += `${start} --> ${end}\n${segment.text.trim()}\n\n`;
  });
  return vtt;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "audio/webm"]; // Added mp4/webm as they are common container formats for m4a
    // Note: m4a often comes as audio/mp4 or audio/x-m4a.

    // Strict type check might fail if browser sends different mime type? 
    // Let's rely on extension or be lenient if possible, but requirements said "validate file type".
    // We will check extension as well just in case mime type is generic "application/octet-stream"
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp3', 'wav', 'm4a'];

    if (!validExtensions.includes(extension || "") && !validTypes.includes(file.type)) {
      // Only reject if BOTH extension and mime type look wrong
      // Actually, let's keep it simple. If extension is valid, we try.
      if (!validExtensions.includes(extension || "")) {
        return NextResponse.json(
          { error: "Invalid file type. Only mp3, wav, m4a are allowed." },
          { status: 400 }
        );
      }
    }

    // Validate file size (4.5MB - Vercel serverless limit)
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 4.5MB limit." },
        { status: 400 }
      );
    }

    // Check for custom API key in headers
    const customApiKey = req.headers.get("X-Custom-API-Key");
    const apiKeyToUse = customApiKey || process.env.GROQ_API_KEY;

    if (!apiKeyToUse) {
      return NextResponse.json(
        { error: "No API key configured. Please add your Groq API key in settings." },
        { status: 401 }
      );
    }

    // Create OpenAI client with the appropriate API key
    const client = new OpenAI({
      apiKey: apiKeyToUse,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // Call Groq API
    const response = await client.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      response_format: "verbose_json",
      language: "te", // Telugu language code
    });

    // The response type for verbose_json includes segments
    const data = response as any; // Cast to any to access segments if typescript definition is strict on response_format

    const text = data.text;
    const segments = data.segments as Segment[];
    const vtt = generateVTT(segments);

    return NextResponse.json({ text, vtt });

  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
