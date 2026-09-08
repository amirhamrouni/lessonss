const RUNTIME_SRC = "/whisper/libcommand.js";
const MODEL_URL = "/whisper/ggml-tiny.en.bin";
const MODEL_FILE = "ggml-tiny.en.bin";

type WhisperModule = {
  calledRun?: boolean;
  onRuntimeInitialized?: () => void;
  locateFile?: (path: string) => string;
  FS_createDataFile: (
    parent: string,
    name: string,
    data: Uint8Array,
    canRead: boolean,
    canWrite: boolean,
  ) => void;
  init: (modelPath: string) => number;
  set_audio: (instance: number, audio: Float32Array) => void;
  get_transcribed: () => string;
};

declare global {
  interface Window {
    Module?: Partial<WhisperModule>;
  }
}

let modulePromise: Promise<WhisperModule> | null = null;
let modelLoaded = false;
let whisperInstance: number | null = null;

function loadWhisperRuntime() {
  if (modulePromise) return modulePromise;

  modulePromise = new Promise<WhisperModule>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("whisper_browser_only"));
      return;
    }

    const moduleConfig: Partial<WhisperModule> = {
      locateFile: (path) => `/whisper/${path}`,
    };

    window.Module = moduleConfig;

    const finish = () => {
      const runtime = window.Module as WhisperModule | undefined;
      if (!runtime?.FS_createDataFile || !runtime.init || !runtime.set_audio || !runtime.get_transcribed) {
        reject(new Error("whisper_runtime_api_missing"));
        return;
      }
      resolve(runtime);
    };

    moduleConfig.onRuntimeInitialized = finish;

    const existing = document.querySelector<HTMLScriptElement>(`script[data-whisper-runtime="${RUNTIME_SRC}"]`);
    if (existing) {
      if ((window.Module as WhisperModule | undefined)?.calledRun) finish();
      else existing.addEventListener("load", finish, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RUNTIME_SRC;
    script.async = true;
    script.dataset.whisperRuntime = RUNTIME_SRC;
    script.onerror = () => reject(new Error("whisper_runtime_assets_missing"));
    document.head.appendChild(script);
  });

  return modulePromise;
}

async function ensureModel(runtime: WhisperModule) {
  if (modelLoaded) return;

  const response = await fetch(MODEL_URL, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("whisper_model_missing");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  try {
    runtime.FS_createDataFile("/", MODEL_FILE, bytes, true, false);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    if (!/exist/i.test(message)) throw cause;
  }
  modelLoaded = true;
}

function waitForTranscript(runtime: WhisperModule, timeoutMs = 30_000) {
  return new Promise<string>((resolve, reject) => {
    const startedAt = Date.now();
    let last = "";
    let stableTicks = 0;

    const poll = () => {
      const next = String(runtime.get_transcribed?.() || "").trim();
      if (next && next === last) stableTicks += 1;
      else stableTicks = 0;
      last = next;

      if (last && stableTicks >= 2) {
        resolve(last);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(last ? "whisper_transcription_incomplete" : "whisper_transcription_timeout"));
        return;
      }

      window.setTimeout(poll, 250);
    };

    poll();
  });
}

export async function transcribeWhisperPcm(pcm16k: Float32Array) {
  if (!pcm16k.length) throw new Error("whisper_empty_audio");

  const runtime = await loadWhisperRuntime();
  await ensureModel(runtime);

  if (whisperInstance === null) {
    const instance = runtime.init(MODEL_FILE);
    if (!Number.isFinite(instance) || instance < 0) throw new Error("whisper_model_init_failed");
    whisperInstance = instance;
  }

  runtime.set_audio(whisperInstance, pcm16k);
  return await waitForTranscript(runtime);
}
