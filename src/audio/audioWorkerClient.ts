import type { AudioWorkerInboundMessage, AudioWorkerOutboundMessage } from './audioProtocol';

export type AudioWorkerClientOptions = {
  inputSampleRate: number;
  targetSampleRate?: number;
  onMessage: (message: AudioWorkerOutboundMessage) => void;
  onError?: (error: Error) => void;
};

type QueuedChunk = {
  sequence: number;
  samples: Float32Array;
};

const MAX_PENDING_CHUNKS = 8;

export class AudioWorkerClient {
  private readonly worker: Worker;
  private readonly inputSampleRate: number;
  private readonly targetSampleRate: number;
  private sequence = 0;
  private disposed = false;
  private ready = false;
  private pending: QueuedChunk[] = [];
  private pendingInputPort: MessagePort | null = null;

  constructor(options: AudioWorkerClientOptions) {
    this.inputSampleRate = options.inputSampleRate;
    this.targetSampleRate = options.targetSampleRate ?? 16_000;
    this.worker = new Worker(new URL('./audio-worker.ts', import.meta.url), { type: 'module' });

    this.worker.onmessage = (event: MessageEvent<AudioWorkerOutboundMessage>) => {
      const message = event.data;

      if (message.type === 'ready') {
        this.ready = true;
        this.attachPendingInputPort();
        this.drainPending();
      }

      options.onMessage(message);
    };

    this.worker.onerror = (event) => {
      options.onError?.(new Error(event.message || 'Audio worker failed.'));
    };

    this.initialize();
  }

  attachInputPort(port: MessagePort) {
    if (this.disposed) {
      port.close();
      return;
    }

    this.pendingInputPort?.close();
    this.pendingInputPort = port;
    this.attachPendingInputPort();
  }

  process(samples: Float32Array): number {
    if (this.disposed) throw new Error('AudioWorkerClient has been disposed.');

    const sequence = this.sequence;
    this.sequence += 1;

    const copiedSamples = new Float32Array(samples.length);
    copiedSamples.set(samples);
    const chunk = { sequence, samples: copiedSamples };

    if (!this.ready) {
      if (this.pending.length >= MAX_PENDING_CHUNKS) this.pending.shift();
      this.pending.push(chunk);
      return sequence;
    }

    this.sendChunk(chunk);
    return sequence;
  }

  flush() {
    if (this.disposed) return;
    this.post({ type: 'flush' });
  }

  reset() {
    if (this.disposed) return;
    this.sequence = 0;
    this.ready = false;
    this.pending = [];
    this.pendingInputPort?.close();
    this.pendingInputPort = null;
    this.post({ type: 'reset' });
    this.initialize();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.ready = false;
    this.pending = [];
    this.pendingInputPort?.close();
    this.pendingInputPort = null;
    this.worker.terminate();
  }

  private initialize() {
    this.post({
      type: 'init',
      inputSampleRate: this.inputSampleRate,
      targetSampleRate: this.targetSampleRate,
      channels: 1,
    });
  }

  private attachPendingInputPort() {
    if (!this.ready || this.disposed || !this.pendingInputPort) return;

    const port = this.pendingInputPort;
    this.pendingInputPort = null;
    this.post({ type: 'attach_port', port }, [port]);
  }

  private drainPending() {
    if (!this.ready || this.disposed || this.pending.length === 0) return;

    const queued = this.pending;
    this.pending = [];
    for (const chunk of queued) this.sendChunk(chunk);
  }

  private sendChunk(chunk: QueuedChunk) {
    this.post(
      { type: 'process', sequence: chunk.sequence, samples: chunk.samples },
      [chunk.samples.buffer],
    );
  }

  private post(message: AudioWorkerInboundMessage, transfer?: Transferable[]) {
    if (this.disposed) return;
    this.worker.postMessage(message, transfer ?? []);
  }
}
