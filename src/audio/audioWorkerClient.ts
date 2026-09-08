import type { AudioWorkerInboundMessage, AudioWorkerOutboundMessage } from './audioProtocol';

export type AudioWorkerClientOptions = {
  inputSampleRate: number;
  targetSampleRate?: number;
  onMessage: (message: AudioWorkerOutboundMessage) => void;
  onError?: (error: Error) => void;
};

export class AudioWorkerClient {
  private readonly worker: Worker;
  private sequence = 0;
  private disposed = false;

  constructor(options: AudioWorkerClientOptions) {
    this.worker = new Worker(new URL('./audio-worker.ts', import.meta.url), { type: 'module' });

    this.worker.onmessage = (event: MessageEvent<AudioWorkerOutboundMessage>) => {
      options.onMessage(event.data);
    };

    this.worker.onerror = (event) => {
      options.onError?.(new Error(event.message || 'Audio worker failed.'));
    };

    this.post({
      type: 'init',
      inputSampleRate: options.inputSampleRate,
      targetSampleRate: options.targetSampleRate ?? 16_000,
      channels: 1,
    });
  }

  process(samples: Float32Array): number {
    if (this.disposed) throw new Error('AudioWorkerClient has been disposed.');

    const sequence = this.sequence;
    this.sequence += 1;

    const transferable = samples.buffer.slice(0);
    const copiedSamples = new Float32Array(transferable);
    this.post({ type: 'process', sequence, samples: copiedSamples }, [transferable]);
    return sequence;
  }

  flush() {
    if (this.disposed) return;
    this.post({ type: 'flush' });
  }

  reset() {
    if (this.disposed) return;
    this.sequence = 0;
    this.post({ type: 'reset' });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.worker.terminate();
  }

  private post(message: AudioWorkerInboundMessage, transfer?: Transferable[]) {
    this.worker.postMessage(message, transfer ?? []);
  }
}
