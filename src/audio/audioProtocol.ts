export type AudioWorkerInitMessage = {
  type: 'init';
  inputSampleRate: number;
  targetSampleRate: number;
  channels?: 1;
};

export type AudioWorkerProcessMessage = {
  type: 'process';
  sequence: number;
  samples: Float32Array;
};

export type AudioWorkerFlushMessage = {
  type: 'flush';
};

export type AudioWorkerResetMessage = {
  type: 'reset';
};

export type AudioWorkerInboundMessage =
  | AudioWorkerInitMessage
  | AudioWorkerProcessMessage
  | AudioWorkerFlushMessage
  | AudioWorkerResetMessage;

export type AudioWorkerReadyMessage = {
  type: 'ready';
  inputSampleRate: number;
  targetSampleRate: number;
};

export type AudioWorkerChunkMessage = {
  type: 'chunk';
  sequence: number;
  sampleRate: number;
  pcm16Base64: string;
  sampleCount: number;
  rms: number;
  peak: number;
  durationMs: number;
};

export type AudioWorkerFlushedMessage = {
  type: 'flushed';
};

export type AudioWorkerErrorMessage = {
  type: 'error';
  code: 'not_initialized' | 'invalid_sample_rate' | 'processing_failed';
  message: string;
};

export type AudioWorkerOutboundMessage =
  | AudioWorkerReadyMessage
  | AudioWorkerChunkMessage
  | AudioWorkerFlushedMessage
  | AudioWorkerErrorMessage;
