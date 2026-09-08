"use client";

import { useState } from "react";
import { RiveSlot } from "@/components/RiveSlot";
import { useSpeechShadowing } from "@/hooks/useSpeechShadowing";

const SAMPLE = "I want to speak English with a clear rhythm and confident timing.";

export default function EditorialShadowingPage() {
  const [targetText, setTargetText] = useState(SAMPLE);
  const {
    status,
    level,
    peak,
    durationMs,
    transcript,
    error,
    isRecording,
    start,
    stopAndTranscribe,
    reset,
  } = useSpeechShadowing();

  const seconds = (durationMs / 1000).toFixed(1);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <header className="grid gap-8 border-b border-black/15 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-black/45">English Twin / Editorial Lab</p>
          <h1 className="text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl">
            Hear the line. Hold the rhythm. Say it as your own.
          </h1>
        </div>
        <div className="max-w-sm border-s border-black/15 ps-5 text-sm leading-6 text-black/55">
          Local-first Speech Shadowing POC. Microphone PCM stays in the browser and is prepared for whisper.cpp WASM transcription.
        </div>
      </header>

      <section className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,.6fr)] lg:py-12">
        <article className="space-y-8">
          <div className="rounded-[2rem] border border-black/10 bg-white/65 p-6 shadow-[0_28px_80px_rgba(20,20,20,.06)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">Shadowing sentence</p>
                <p className="mt-2 text-sm text-black/50">Edit the target before recording.</p>
              </div>
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/60">Local audio · 16 kHz target</span>
            </div>

            <textarea
              value={targetText}
              onChange={(event) => setTargetText(event.target.value)}
              rows={4}
              className="mt-7 w-full resize-none bg-transparent text-3xl font-medium leading-tight tracking-[-0.025em] outline-none placeholder:text-black/20 sm:text-4xl"
              aria-label="Shadowing target sentence"
            />

            <div className="mt-8 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.15em] text-black/45">
                  <span>Voice energy</span>
                  <span>{isRecording ? `${seconds}s` : status}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-black/8">
                  <div
                    className="h-full origin-left rounded-full bg-black transition-[width] duration-75"
                    style={{ width: `${Math.max(2, level * 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-black/40">Peak {(peak * 100).toFixed(0)}%</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    disabled={status === "requesting" || status === "processing"}
                    onClick={() => void start().catch(() => undefined)}
                    className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {status === "requesting" ? "Opening microphone…" : "Start shadowing"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void stopAndTranscribe().catch(() => undefined)}
                    className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                  >
                    Stop & transcribe
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void reset()}
                  className="rounded-full border border-black/15 bg-white/60 px-4 py-3 text-sm font-semibold"
                >
                  Reset
                </button>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-950/15 bg-red-950/[0.04] px-4 py-3 text-sm leading-6 text-red-950/75">
                {error}
              </div>
            ) : null}
          </div>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-black/10 bg-white/45 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">Target</p>
              <p className="mt-4 max-w-reading text-xl font-medium leading-8">{targetText}</p>
            </div>
            <div className="rounded-[1.75rem] border border-black/10 bg-white/45 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">Your local transcript</p>
              <p className="mt-4 min-h-16 text-xl font-medium leading-8 text-black/75">
                {transcript || (status === "processing" ? "whisper.cpp is analysing locally…" : "Your transcript will appear here.")}
              </p>
            </div>
          </section>

          <section dir="rtl" lang="ar" className="rounded-[1.75rem] border border-black/10 bg-white/35 p-6 font-arabic">
            <p className="text-xs font-semibold tracking-wide text-black/45">ملاحظة تعليمية</p>
            <p className="mt-3 max-w-reading text-lg leading-8 text-black/75">
              الهدف في هذه المرحلة ليس تقييم اللهجة فقط، بل تدريب الإيقاع، التوقيت، والثقة. التسجيل والتحليل الأولي يتمان محلياً في المتصفح.
            </p>
          </section>
        </article>

        <aside className="space-y-5">
          <RiveSlot />
          <div className="rounded-[2rem] border border-black/10 bg-[#16191d] p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">POC pipeline</p>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-white/75">
              <li><span className="me-2 text-white/35">01</span> getUserMedia → Web Audio API</li>
              <li><span className="me-2 text-white/35">02</span> AudioWorklet → local Float32 PCM</li>
              <li><span className="me-2 text-white/35">03</span> Resample → mono 16 kHz</li>
              <li><span className="me-2 text-white/35">04</span> whisper.cpp WASM → transcript</li>
              <li><span className="me-2 text-white/35">05</span> Later: timing / phoneme comparison</li>
            </ol>
          </div>
        </aside>
      </section>
    </main>
  );
}
