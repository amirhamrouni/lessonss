import { describe, expect, it } from 'vitest';
import { clampAudio, floatToPcm16Bytes, measureAudio, resampleMono } from './audioProcessing';

describe('audioProcessing', () => {
  it('measures RMS and peak deterministically', () => {
    const samples = new Float32Array([1, -1, 0, 0]);
    const metrics = measureAudio(samples);
    expect(metrics.peak).toBe(1);
    expect(metrics.rms).toBeCloseTo(Math.sqrt(0.5), 6);
  });

  it('clamps invalid and out-of-range samples', () => {
    const samples = new Float32Array([2, -2, Number.NaN, 0.25]);
    expect(Array.from(clampAudio(samples))).toEqual([1, -1, 0, 0.25]);
  });

  it('resamples mono audio to the requested sample rate', () => {
    const samples = new Float32Array([0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25]);
    const output = resampleMono(samples, 48_000, 16_000);
    expect(output.length).toBe(3);
    expect(Array.from(output)).toEqual([0, 0.75, 0.5]);
  });

  it('converts clamped float samples to little-endian PCM16 bytes', () => {
    const bytes = floatToPcm16Bytes(new Float32Array([-1, 0, 1, Number.NaN]));
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    expect(view.getInt16(0, true)).toBe(-32768);
    expect(view.getInt16(2, true)).toBe(0);
    expect(view.getInt16(4, true)).toBe(32767);
    expect(view.getInt16(6, true)).toBe(0);
  });

  it('rejects invalid sample rates', () => {
    expect(() => resampleMono(new Float32Array([0]), 0, 16_000)).toThrow();
  });
});
