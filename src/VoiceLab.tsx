import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import AppDock from './AppDock';
import { AudioWorkerClient } from './audio/audioWorkerClient';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage } from './languageSupport';
import { liveVoiceSupportCopy } from './liveVoiceSupportCopy';

type VoiceState = 'READY' | 'CONNECTING' | 'LISTENING' | 'AI_SPEAKING' | 'ERROR';
type TranscriptItem = { role: 'learner' | 'twin'; text: string };
type AudioRuntime = {
  inputContext: AudioContext;
  outputContext: AudioContext;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  captureNode: AudioWorkletNode;
  worker: AudioWorkerClient;
};

const LIVE_MODEL = 'gemini-3.1-flash-live-preview';
const CONSENT_KEY = 'english-twin-voice-consent-v1';
const MAX_SOCKET_BUFFER_BYTES = 512 * 1024;

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function VoiceLab() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<VoiceState>('READY');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [inputDraft, setInputDraft] = useState('');
  const [outputDraft, setOutputDraft] = useState('');
  const [voiceConsent, setVoiceConsent] = useState(() => localStorage.getItem(CONSENT_KEY) === 'accepted');
  const [showConsent, setShowConsent] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<AudioRuntime | null>(null);
  const nextPlayTimeRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const transcriptRef = useRef<TranscriptItem[]>([]);
  const inputDraftRef = useRef('');
  const outputDraftRef = useRef('');
  const stateRef = useRef<VoiceState>('READY');
  const modelRef = useRef(LIVE_MODEL);

  const applyState = (next: VoiceState) => {
    stateRef.current = next;
    setState(next);
  };
  const applyInputDraft = (next: string) => {
    inputDraftRef.current = next;
    setInputDraft(next);
  };
  const applyOutputDraft = (next: string) => {
    outputDraftRef.current = next;
    setOutputDraft(next);
  };

  useEffect(
    () =>
      onAuthStateChanged(auth, async current => {
        setUser(current);
        if (!current) {
          setProfile({});
          setLoading(false);
          return;
        }

        try {
          const snap = await getDoc(doc(db, 'users', current.uid));
          setProfile(snap.exists() ? snap.data() : {});
        } finally {
          setLoading(false);
        }
      }),
    [],
  );

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => () => {
    void teardown(false);
  }, []);

  const language = normalizeLanguage(
    profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English',
  );
  const copy = liveVoiceSupportCopy[language];
  const dir = directionFor(language);

  if (loading) {
    return (
      <div className="app-shell" dir={dir}>
        <div className="phone">
          <main className="page">
            <span className="eyebrow">ENGLISH TWIN</span>
            <p>{copy.loading}</p>
          </main>
          <AppDock language={language} />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/welcome" replace />;

  function pushTranscript(role: 'learner' | 'twin', text: string) {
    const clean = text.trim();
    if (clean) setTranscript(current => [...current, { role, text: clean }]);
  }

  function acceptConsent() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVoiceConsent(true);
    setShowConsent(false);
    void start(true);
  }

  async function playPcm(base64: string) {
    const runtime = audioRef.current;
    if (!runtime) return;

    const bytes = base64ToBytes(base64);
    const length = Math.floor(bytes.byteLength / 2);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const audioBuffer = runtime.outputContext.createBuffer(1, length, 24_000);
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
    const raw =
      event.data instanceof Blob
        ? await event.data.text()
        : event.data instanceof ArrayBuffer
          ? new TextDecoder().decode(event.data)
          : String(event.data);

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    if (data.setupComplete) {
      applyState('LISTENING');
      return;
    }

    const content = data.serverContent;
    if (!content) return;

    if (content.inputTranscription?.text) {
      applyInputDraft(`${inputDraftRef.current}${content.inputTranscription.text}`);
    }
    if (content.outputTranscription?.text) {
      applyOutputDraft(`${outputDraftRef.current}${content.outputTranscription.text}`);
    }

    for (const part of content.modelTurn?.parts || []) {
      if (part.inlineData?.data) {
        applyState('AI_SPEAKING');
        await playPcm(part.inlineData.data);
      }
    }

    if (content.turnComplete) {
      if (inputDraftRef.current) {
        pushTranscript('learner', inputDraftRef.current);
        applyInputDraft('');
      }
      if (outputDraftRef.current) {
        pushTranscript('twin', outputDraftRef.current);
        applyOutputDraft('');
      }
      applyState('LISTENING');
    }

    if (content.interrupted) {
      nextPlayTimeRef.current = 0;
      applyState('LISTENING');
    }
  }

  async function createAudioRuntime(ws: WebSocket) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
    const inputContext = new AudioContext();
    const outputContext = new AudioContext();

    const workletModule = new URL('./audio/audio-capture.worklet.js', import.meta.url);
    await inputContext.audioWorklet.addModule(workletModule.href);
    await Promise.all([inputContext.resume(), outputContext.resume()]);

    const source = inputContext.createMediaStreamSource(stream);
    const captureNode = new AudioWorkletNode(inputContext, 'english-twin-audio-capture', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 1,
      channelCountMode: 'explicit',
    });
    const silentGain = inputContext.createGain();
    silentGain.gain.value = 0;

    const worker = new AudioWorkerClient({
      inputSampleRate: inputContext.sampleRate,
      targetSampleRate: 16_000,
      onMessage: message => {
        if (message.type === 'error') {
          setError(copy.micStartError);
          return;
        }
        if (message.type !== 'chunk') return;
        if (ws.readyState !== WebSocket.OPEN || stateRef.current === 'CONNECTING') return;

        if (ws.bufferedAmount > MAX_SOCKET_BUFFER_BYTES) return;

        ws.send(
          JSON.stringify({
            realtimeInput: {
              audio: {
                mimeType: `audio/pcm;rate=${message.sampleRate}`,
                data: message.pcm16Base64,
              },
            },
          }),
        );
      },
      onError: () => {
        setError(copy.micStartError);
        void teardown(false);
      },
    });

    const directChannel = new MessageChannel();
    captureNode.port.postMessage({ type: 'connect', port: directChannel.port1 }, [directChannel.port1]);
    worker.attachInputPort(directChannel.port2);

    source.connect(captureNode);
    captureNode.connect(silentGain);
    silentGain.connect(inputContext.destination);

    audioRef.current = { inputContext, outputContext, stream, source, captureNode, worker };
  }

  async function start(consentOverride = false) {
    if (!voiceConsent && !consentOverride) {
      setShowConsent(true);
      return;
    }
    if (!user || (stateRef.current !== 'READY' && stateRef.current !== 'ERROR')) return;

    setError('');
    setTranscript([]);
    transcriptRef.current = [];
    applyInputDraft('');
    applyOutputDraft('');
    applyState('CONNECTING');

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error(copy.micUnavailable);

      const idToken = await user.getIdToken();
      const tokenResponse = await fetch('/api/live-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const tokenPayload = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenPayload?.token) throw new Error(copy.sessionCreate);

      modelRef.current = tokenPayload.model || LIVE_MODEL;
      const ws = new WebSocket(
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(tokenPayload.token)}`,
      );
      wsRef.current = ws;

      ws.onmessage = event => {
        void handleServerMessage(event);
      };
      ws.onerror = () => {
        setError(copy.connectionError);
        applyState('ERROR');
      };
      ws.onclose = event => {
        if (event.code !== 1000 && stateRef.current !== 'READY') setError(copy.sessionClosed);
        if (stateRef.current !== 'READY') applyState('READY');
      };
      ws.onopen = async () => {
        try {
          ws.send(
            JSON.stringify({
              setup: {
                model: `models/${modelRef.current}`,
                generationConfig: {
                  responseModalities: ['AUDIO'],
                  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
                systemInstruction: {
                  parts: [
                    {
                      text: 'You are English Twin, a patient English speaking coach. Keep the conversation in English, adapt to the learner, ask one natural question at a time, and gently recast meaningful errors without interrupting fluency.',
                    },
                  ],
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
              },
            }),
          );
          await createAudioRuntime(ws);
          startedAtRef.current = Date.now();
        } catch {
          setError(copy.micStartError);
          applyState('ERROR');
          void teardown(false);
        }
      };
    } catch {
      setError(copy.sessionStartError);
      applyState('ERROR');
    }
  }

  async function teardown(saveSession = true) {
    const runtime = audioRef.current;
    audioRef.current = null;

    if (runtime) {
      runtime.captureNode.port.postMessage({ type: 'stop' });
      runtime.worker.flush();
      runtime.worker.dispose();
      try {
        runtime.captureNode.disconnect();
      } catch {}
      try {
        runtime.source.disconnect();
      } catch {}
      runtime.stream.getTracks().forEach(track => track.stop());
      await Promise.allSettled([runtime.inputContext.close(), runtime.outputContext.close()]);
    }

    const ws = wsRef.current;
    wsRef.current = null;
    if (ws && ws.readyState < WebSocket.CLOSING) ws.close(1000, 'session ended');

    nextPlayTimeRef.current = 0;
    const startedAt = startedAtRef.current;
    startedAtRef.current = null;
    const items = [...transcriptRef.current];
    if (inputDraftRef.current.trim()) items.push({ role: 'learner', text: inputDraftRef.current.trim() });
    if (outputDraftRef.current.trim()) items.push({ role: 'twin', text: outputDraftRef.current.trim() });

    if (saveSession && user && startedAt && items.length) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'learningSessions'), {
          type: 'speaking-live',
          model: modelRef.current,
          startedAtMs: startedAt,
          durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
          transcript: items,
          createdAt: serverTimestamp(),
        });
      } catch {}
    }

    applyInputDraft('');
    applyOutputDraft('');
    applyState('READY');
  }

  const active = state === 'CONNECTING' || state === 'LISTENING' || state === 'AI_SPEAKING';
  const stateTitle =
    state === 'READY'
      ? copy.ready
      : state === 'CONNECTING'
        ? copy.connecting
        : state === 'LISTENING'
          ? copy.listening
          : state === 'AI_SPEAKING'
            ? copy.speaking
            : copy.attention;

  return (
    <div className="app-shell" dir={dir}>
      <div className="phone">
        <main className="page voice-live">
          <button className="back" onClick={() => nav('/speak')}>
            {copy.home}
          </button>

          <header>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.intro}</p>
          </header>

          {showConsent && (
            <section
              className="rich-activity-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="voice-consent-title"
            >
              <div className="section-heading">
                <span>{copy.privacy}</span>
                <h3 id="voice-consent-title">{copy.consentTitle}</h3>
              </div>
              <p>{copy.consentBody}</p>
              <div className="lesson-actions">
                <button className="ghost" onClick={() => setShowConsent(false)}>
                  {copy.notNow}
                </button>
                <button className="primary lime" onClick={acceptConsent}>
                  {copy.acceptStart}
                </button>
              </div>
            </section>
          )}

          <section className={`voice-stage ${state.toLowerCase()}`}>
            <div className="voice-pulse" aria-hidden="true">
              LIVE
            </div>
            <span className="status-dot">{state}</span>
            <h2>{stateTitle}</h2>
            <p>{state === 'READY' ? copy.readyHint : copy.activeHint}</p>
            <button
              className={active ? 'voice-stop' : 'primary lime'}
              onClick={() => (active ? void teardown(true) : void start())}
            >
              {active ? copy.end : copy.start}
            </button>
          </section>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <section>
            <div className="section-heading">
              <span>{copy.transcript}</span>
              <h3>{copy.evidence}</h3>
            </div>

            {!transcript.length && !inputDraft && !outputDraft ? (
              <div className="signal-empty">
                <div>
                  <b>{copy.emptyTitle}</b>
                  <p>{copy.emptyBody}</p>
                </div>
              </div>
            ) : (
              <div className="voice-transcript">
                {transcript.map((item, index) => (
                  <article className={item.role} key={`${item.role}-${index}`}>
                    <span>{item.role === 'learner' ? copy.you : copy.twin}</span>
                    <p>{item.text}</p>
                  </article>
                ))}
                {inputDraft && (
                  <article className="learner partial">
                    <span>{copy.you}</span>
                    <p>{inputDraft}</p>
                  </article>
                )}
                {outputDraft && (
                  <article className="twin partial">
                    <span>{copy.twin}</span>
                    <p>{outputDraft}</p>
                  </article>
                )}
              </div>
            )}
          </section>
        </main>
        <AppDock language={language} />
      </div>
    </div>
  );
}
