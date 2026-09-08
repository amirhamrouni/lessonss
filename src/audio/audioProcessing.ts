export type AudioMetrics = {
  rms: number;
  peak: number;
};

export function measureAudio(samples: Float32Array): AudioMetrics {
  if (samples.length === 0) return { rms: 0, peak: 0 };

  let sumSquares = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = Number.isFinite(samples[i]) ? samples[i] : 0;
    const absolute = Math.abs(value);
    if (absolute > peak) peak = absolute;
    sumSquares += value * value;
  }

  return {
    rms: Math.sqrt(sumSquares / samples.length),
    peak,
  };
}

export function clampAudio(samples: Float32Array): Float32Array {
  const output = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Number.isFinite(samples[i]) ? samples[i] : 0;
    output[i] = Math.max(-1, Math.min(1, value));
  }
  return output;
}

export function resampleMono(
  samples: Float32Array,
  inputSampleRate: number,
  targetSampleRate: number,
): Float32Array {
  if (!Number.isFinite(inputSampleRate) || !Number.isFinite(targetSampleRate)) {
    throw new Error('Sample rates must be finite numbers.');
  }
  if (inputSampleRate <= 0 || targetSampleRate <= 0) {
    throw new Error('Sample rates must be greater than zero.');
  }
  if (samples.length === 0) return new Float32Array();
  if (inputSampleRate === targetSampleRate) return clampAudio(samples);

  const ratio = inputSampleRate / targetSampleRate;
  const outputLength = Math.max(1, Math.round(samples.length / ratio));
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const sourcePosition = i * ratio;
    const leftIndex = Math.floor(sourcePosition);
    const rightIndex = Math.min(leftIndex + 1, samples.length - 1);
    const fraction = sourcePosition - leftIndex;
    const left = Number.isFinite(samples[leftIndex]) ? samples[leftIndex] : 0;
    const right = Number.isFinite(samples[rightIndex]) ? samples[rightIndex] : 0;
    output[i] = Math.max(-1, Math.min(1, left + (right - left) * fraction));
  }

  return output;
}

export function floatToPcm16Bytes(samples: Float32Array): Uint8Array {
  const pcm = new Int16Array(samples.length);

  for (let i = 0; i < samples.length; i += 1) {
    const finite = Number.isFinite(samples[i]) ? samples[i] : 0;
    const sample = Math.max(-1, Math.min(1, finite));
    pcm[i] = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
  }

  return new Uint8Array(pcm.buffer);
}
