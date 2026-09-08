"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeWhisperPcm } from "@/lib/whisperWasm";

export type ShadowingStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "processing"
  | "done"
  | "error";

export type SpeechShadowingState = {
  status: ShadowingStatus;
  level: number;
  peak: number;
  durationMs: number;
  transcript: string;
  error: string | null;
};

const INITIAL_STATE: SpeechShadowingState = {
  status: "idle",
  level: 0,
  peak: 0,
  durationMs: 0,
  transcript: "",
  error: null,
};

function mergeChunks(chunks: Float32Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function resampleLinear(input: Float32Array, fromRate: number, toRate = 16_000) {
  if (!input.length || fromRate === toRate) return input.slice();
  const ratio = fromRate / toRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const left = Math.floor(sourceIndex);
    const right = Math.min(left + 1, input.length - 1);
    const fraction = sourceIndex - left;
    output[index] = input[left] * (1 - fraction) + input[right] * fraction;
  }

  return output;
}

function userMessage(cause: unknown) {
  const raw = cause instanceof Error ? cause.message : String(cause);
  if (/NotAllowedError|Permission denied/i.test(raw)) return "Microphone permission was denied.";
  if (/NotFoundError|Requested device not found/i.test(raw)) return "No microphone was found on this device.";
  if (raw === "audio_worklet_unsupported") return "This browser does not support AudioWorklet recording.";
  if (raw === "whisper_runtime_assets_missing") return "whisper.cpp WASM runtime is not installed in /public/whisper yet.";
  if (raw === "whisper_model_missing") return "The local Whisper model is missing from /public/whisper.";
  return raw;
}

export function useSpeechShadowing() {
  const [state, setState] = useState<SpeechShadowingState>(INITIAL_STATE);

  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<AudioWorkletNode | null>(null);
  const muteRef = useRef<GainNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(48_000);
  const startedAtRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const stopGraph = useCallback(async () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    recorderRef.current?.disconnect();
    muteRef.current?.disconnect();

    sourceRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
    muteRef.current = null;

    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") {
      await context.close().catch(() => undefined);
    }
  }, []);

  const start = useCallback(async () => {
    if (state.status === "recording" || state.status === "requesting" || state.status === "processing") return;

    setState({ ...INITIAL_STATE, status: "requesting" });
    chunksRef.current = [];

    try {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("microphone_api_unavailable");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
        video: false,
      });

      const context = new AudioContext({ latencyHint: "interactive" });
      if (!context.audioWorklet) {
        stream.getTracks().forEach((track) => track.stop());
        await context.close();
        throw new Error("audio_worklet_unsupported");
      }

      await context.audioWorklet.addModule("/audio/shadowing-processor.js");
      if (context.state === "suspended") await context.resume();

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.7;

      const recorder = new AudioWorkletNode(context, "shadowing-recorder", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      const mute = context.createGain();
      mute.gain.value = 0;

      recorder.port.onmessage = (event: MessageEvent<Float32Array | ArrayBuffer>) => {
        const data = event.data;
        const chunk = data instanceof Float32Array ? data : new Float32Array(data);
        if (chunk.length) chunksRef.current.push(chunk.slice());
      };

      source.connect(analyser);
      analyser.connect(recorder);
      recorder.connect(mute);
      mute.connect(context.destination);

      contextRef.current = context;
      streamRef.current = stream;
      sourceRef.current = source;
      analyserRef.current = analyser;
      recorderRef.current = recorder;
      muteRef.current = mute;
      sampleRateRef.current = context.sampleRate;
      startedAtRef.current = performance.now();

      const waveform = new Float32Array(analyser.fftSize);
      const updateMeter = () => {
        const node = analyserRef.current;
        if (!node) return;

        node.getFloatTimeDomainData(waveform);
        let sumSquares = 0;
        let peak = 0;
        for (const sample of waveform) {
          sumSquares += sample * sample;
          peak = Math.max(peak, Math.abs(sample));
        }
        const rms = Math.sqrt(sumSquares / waveform.length);

        setState((current) => ({
          ...current,
          level: Math.min(1, rms * 4),
          peak: Math.max(current.peak * 0.94, Math.min(1, peak)),
          durationMs: performance.now() - startedAtRef.current,
        }));
        animationRef.current = requestAnimationFrame(updateMeter);
      };

      setState((current) => ({ ...current, status: "recording", error: null }));
      animationRef.current = requestAnimationFrame(updateMeter);
    } catch (cause) {
      await stopGraph();
      setState((current) => ({ ...current, status: "error", error: userMessage(cause) }));
      throw cause;
    }
  }, [state.status, stopGraph]);

  const stopAndTranscribe = useCallback(async () => {
    if (state.status !== "recording") return "";

    setState((current) => ({ ...current, status: "processing", level: 0, error: null }));
    const sampleRate = sampleRateRef.current;

    try {
      await stopGraph();
      const captured = mergeChunks(chunksRef.current);
      chunksRef.current = [];
      if (captured.length < sampleRate * 0.2) throw new Error("Recording is too short to analyse.");

      const pcm16k = resampleLinear(captured, sampleRate, 16_000);
      const transcript = await transcribeWhisperPcm(pcm16k);
      setState((current) => ({ ...current, status: "done", transcript, error: null }));
      return transcript;
    } catch (cause) {
      setState((current) => ({ ...current, status: "error", error: userMessage(cause) }));
      throw cause;
    }
  }, [state.status, stopGraph]);

  const reset = useCallback(async () => {
    await stopGraph();
    chunksRef.current = [];
    setState(INITIAL_STATE);
  }, [stopGraph]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void contextRef.current?.close().catch(() => undefined);
    };
  }, []);

  return {
    ...state,
    isRecording: state.status === "recording",
    start,
    stopAndTranscribe,
    reset,
  };
}
