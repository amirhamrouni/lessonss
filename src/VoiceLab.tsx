import { useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, BookOpen, Gauge, Home, Mic, MicOff, Radio, Square, UserRound, Volume2 } from 'lucide-react';
import { auth, db } from './firebase';

type VoiceState = 'READY' | 'CONNECTING' | 'LISTENING' | 'AI_SPEAKING' | 'ERROR';
type TranscriptItem = { role: 'learner' | 'twin'; text: string };

type AudioRuntime = {
  inputContext: AudioContext;
  outputContext: AudioContext;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  processor: ScriptProcessorNode;
};

const LIVE_MODEL = 'gemini-3.1-flash-live-preview';

function Dock() {
  return <nav className="dock">{[
    ['/', Home, 'Home'], ['/learn', BookOpen, 'Learn'], ['/practice', Gauge, 'Practice'], ['/speak', Mic, 'Speak'], ['/profile', UserRound, 'Me'],
  ].map(([to, Icon, label]: any) => <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>)}</nav>;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function downsample(buffer: Float32Array, sourceRate: number, targetRate: number) {
  if (targetRate >= sourceRate) return buffer;
  const ratio = sourceRate / targetRate;
  const length = Math.round(buffer.length / ratio);
  const result = new Float32Array(length);
  let sourceOffset = 0;
  for (let i = 0; i < length; i += 1) {
    const nextOffset = Math.round((i + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let j = sourceOffset; j < nextOffset && j < buffer.length; j += 1) { sum += buffer[j]; count += 1; }
    result[i] = count ? sum / count : 0;
    sourceOffset = nextOffset;
  }
  return result;
}

function floatToPcm16(buffer: Float32Array) {
  const pcm = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, buffer[i]));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return new Uint8Array(pcm.buffer);
}

export default function VoiceLab() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<VoiceState>('READY');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [inputDraft, setInputDraft] = useState('');
  const [outputDraft, setOutputDraft] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<AudioRuntime | null>(null);
  const nextPlayTimeRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const transcriptRef = useRef<TranscriptItem[]>([]);

  useEffect(() => onAuthStateChanged(auth, current => { setUser(current); setLoading(false); }), []);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => () => { void teardown(false); }, []);

  if (loading) return <div className="app-shell"><div className="phone"><main className="page"><Radio /><p>Preparing voice lab…</p></main><Dock /></div></div>;
  if (!user) return <Navigate to="/welcome" replace />;

  function pushTranscript(role: 'learner' | 'twin', text: string) {
    const clean = text.trim();
    if (!clean) return;
    setTranscript(current => [...current, { role, text: clean }]);
  }

  async function playPcm(base64: string) {
    const runtime = audioRef.current;
    if (!runtime) return;
    const bytes = base64ToBytes(base64);
    const length = Math.floor(bytes.byteLength / 2);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const audioBuffer = runtime.outputContext.createBuffer(1, length, 24000);
    const channel = audioBuffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) channel[i] = view.getInt16(i * 2, true) / 32768;
    const source = runtime.outputContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(runtime.outputContext.destination);
    const now = runtime.outputContext.currentTime;
    const startAt = Math.max(now + 0.02, nextPlayTimeRef.current || now);
    source.start(startAt);
    nextPlayTimeRef.current = startAt + audioBuffer.duration;
  }

  async function handleServerMessage(event: MessageEvent) {
    const raw = event.data instanceof Blob ? await event.data.text() : event.data instanceof ArrayBuffer ? new TextDecoder().decode(event.data) : String(event.data);
    let data: any;
    try { data = JSON.parse(raw); } catch { return; }
    if (data.setupComplete) { setState('LISTENING'); return; }
    const content = data.serverContent;
    if (!content) return;

    if (content.inputTranscription?.text) {
      const next = `${inputDraft}${content.inputTranscription.text}`;
      setInputDraft(next);
      if (content.inputTranscription.finished) { pushTranscript('learner', next); setInputDraft(''); }
    }
    if (content.outputTranscription?.text) {
      const next = `${outputDraft}${content.outputTranscription.text}`;
      setOutputDraft(next);
      if (content.outputTranscription.finished) { pushTranscript('twin', next); setOutputDraft(''); }
    }

    const parts = content.modelTurn?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) { setState('AI_SPEAKING'); await playPcm(part.inlineData.data); }
    }
    if (content.turnComplete) setState('LISTENING');
    if (content.interrupted) { nextPlayTimeRef.current = 0; setState('LISTENING'); }
  }

  async function createAudioRuntime(ws: WebSocket) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
    const inputContext = new AudioContext();
    const outputContext = new AudioContext();
    await Promise.all([inputContext.resume(), outputContext.resume()]);
    const source = inputContext.createMediaStreamSource(stream);
    const processor = inputContext.createScriptProcessor(4096, 1, 1);
    const silentGain = inputContext.createGain();
    silentGain.gain.value = 0;
    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(inputContext.destination);

    processor.onaudioprocess = event => {
      if (ws.readyState !== WebSocket.OPEN || state === 'AI_SPEAKING') return;
      const samples = event.inputBuffer.getChannelData(0);
      const pcm = floatToPcm16(downsample(samples, inputContext.sampleRate, 16000));
      ws.send(JSON.stringify({ realtimeInput: { audio: { mimeType: 'audio/pcm;rate=16000', data: bytesToBase64(pcm) } } }));
    };

    audioRef.current = { inputContext, outputContext, stream, source, processor };
  }

  async function start() {
    if (!user || state !== 'READY' && state !== 'ERROR') return;
    setError('');
    setTranscript([]);
    setInputDraft('');
    setOutputDraft('');
    setState('CONNECTING');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone is not available in this browser.');
      const idToken = await user.getIdToken();
      const tokenResponse = await fetch('/api/live-token', { method: 'POST', headers: { Authorization: `Bearer ${idToken}` } });
      const tokenPayload = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenPayload?.token) throw new Error(tokenPayload?.error || 'Could not create Live session.');

      const ws = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(tokenPayload.token)}`);
      wsRef.current = ws;
      ws.onmessage = event => { void handleServerMessage(event); };
      ws.onerror = () => { setError('Gemini Live connection error.'); setState('ERROR'); };
      ws.onclose = () => { if (state !== 'READY') setState('READY'); };
      ws.onopen = async () => {
        try {
          ws.send(JSON.stringify({ setup: {
            model: `models/${LIVE_MODEL}`,
            generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
            systemInstruction: { parts: [{ text: 'You are English Twin, a patient English speaking coach. Keep the conversation in English, adapt to the learner, ask one natural question at a time, and gently recast meaningful errors without interrupting fluency.' }] },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          } }));
          await createAudioRuntime(ws);
          startedAtRef.current = Date.now();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not start microphone.');
          setState('ERROR');
          void teardown(false);
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start voice session.');
      setState('ERROR');
    }
  }

  async function teardown(saveSession = true) {
    const runtime = audioRef.current;
    audioRef.current = null;
    if (runtime) {
      runtime.processor.onaudioprocess = null;
      try { runtime.processor.disconnect(); } catch { /* noop */ }
      try { runtime.source.disconnect(); } catch { /* noop */ }
      runtime.stream.getTracks().forEach(track => track.stop());
      await Promise.allSettled([runtime.inputContext.close(), runtime.outputContext.close()]);
    }
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws && ws.readyState < WebSocket.CLOSING) ws.close(1000, 'session ended');
    nextPlayTimeRef.current = 0;

    const startedAt = startedAtRef.current;
    startedAtRef.current = null;
    const items = transcriptRef.current;
    if (saveSession && user && startedAt && items.length) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'learningSessions'), {
          type: 'speaking-live',
          model: LIVE_MODEL,
          startedAtMs: startedAt,
          durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
          transcript: items,
          createdAt: serverTimestamp(),
        });
      } catch { /* session saving should not block cleanup */ }
    }
    setState('READY');
  }

  const active = state === 'CONNECTING' || state === 'LISTENING' || state === 'AI_SPEAKING';

  return <div className="app-shell"><div className="phone"><main className="page voice-live">
    <button className="back" onClick={() => nav('/')}><ArrowLeft /> Home</button>
    <header><span className="eyebrow">GEMINI LIVE · REAL MICROPHONE</span><h1>Speak with your Twin</h1><p>Your microphone streams directly to Gemini Live through a short-lived authenticated token. The permanent API key never reaches the browser.</p></header>

    <section className={`voice-stage ${state.toLowerCase()}`}><div className="voice-pulse"><Mic /></div><span className="status-dot">{state}</span><h2>{state === 'READY' ? 'Ready when you are.' : state === 'CONNECTING' ? 'Securing live session…' : state === 'LISTENING' ? 'I’m listening.' : state === 'AI_SPEAKING' ? 'Twin is speaking.' : 'Session needs attention.'}</h2><p>{state === 'READY' ? 'Use headphones for the cleanest conversation.' : 'Speak naturally. Gemini handles turn detection and interruption.'}</p><button className={active ? 'voice-stop' : 'primary lime'} onClick={() => active ? void teardown(true) : void start()}>{active ? <><Square /> End session</> : <><Mic /> Start speaking</>}</button></section>

    {error && <p className="error">{error}</p>}
    <section><div className="section-heading"><span>LIVE TRANSCRIPT</span><h3>Conversation evidence</h3></div>{!transcript.length && !inputDraft && !outputDraft ? <div className="signal-empty"><Volume2 /><div><b>No invented transcript.</b><p>Words appear only after a real Live API transcription arrives.</p></div></div> : <div className="voice-transcript">{transcript.map((item, index) => <article className={item.role} key={`${item.role}-${index}`}><span>{item.role === 'learner' ? 'YOU' : 'TWIN'}</span><p>{item.text}</p></article>)}{inputDraft && <article className="learner partial"><span>YOU</span><p>{inputDraft}</p></article>}{outputDraft && <article className="twin partial"><span>TWIN</span><p>{outputDraft}</p></article>}</div>}</section>
  </main><Dock /></div></div>;
}
