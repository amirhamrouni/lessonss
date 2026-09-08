import { describe, expect, it } from 'vitest';
import { clampAudio, measureAudio, resampleMono } from './audioProcessing';

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

  it('rejects invalid sample rates', () => {
    expect(() => resampleMono(new Float32Array([0]), 0, 16_000)).toThrow();
  });
});
