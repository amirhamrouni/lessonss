/// <reference lib="webworker" />

import { floatToPcm16Bytes, measureAudio, resampleMono } from './audioProcessing';
import type { AudioWorkerInboundMessage, AudioWorkerOutboundMessage } from './audioProtocol';

const workerScope = self as DedicatedWorkerGlobalScope;

let inputSampleRate = 0;
let targetSampleRate = 16_000;
let initialized = false;

function post(message: AudioWorkerOutboundMessage) {
  workerScope.postMessage(message);
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

workerScope.onmessage = (event: MessageEvent<AudioWorkerInboundMessage>) => {
  const message = event.data;

  if (message.type === 'init') {
    const nextInput = Number(message.inputSampleRate);
    const nextTarget = Number(message.targetSampleRate);

    if (!Number.isFinite(nextInput) || !Number.isFinite(nextTarget) || nextInput <= 0 || nextTarget <= 0) {
      initialized = false;
      post({
        type: 'error',
        code: 'invalid_sample_rate',
        message: 'Audio worker received an invalid sample rate.',
      });
      return;
    }

    inputSampleRate = nextInput;
    targetSampleRate = nextTarget;
    initialized = true;
    post({ type: 'ready', inputSampleRate, targetSampleRate });
    return;
  }

  if (message.type === 'reset') {
    initialized = false;
    inputSampleRate = 0;
    targetSampleRate = 16_000;
    return;
  }

  if (message.type === 'flush') {
    post({ type: 'flushed' });
    return;
  }

  if (!initialized) {
    post({
      type: 'error',
      code: 'not_initialized',
      message: 'Audio worker must be initialized before processing samples.',
    });
    return;
  }

  try {
    const processed = resampleMono(message.samples, inputSampleRate, targetSampleRate);
    const metrics = measureAudio(processed);
    const pcm16 = floatToPcm16Bytes(processed);
    const durationMs = processed.length === 0 ? 0 : (processed.length / targetSampleRate) * 1000;

    post({
      type: 'chunk',
      sequence: message.sequence,
      sampleRate: targetSampleRate,
      pcm16Base64: bytesToBase64(pcm16),
      sampleCount: processed.length,
      rms: metrics.rms,
      peak: metrics.peak,
      durationMs,
    });
  } catch (error) {
    post({
      type: 'error',
      code: 'processing_failed',
      message: error instanceof Error ? error.message : 'Audio processing failed.',
    });
  }
};

export {};
