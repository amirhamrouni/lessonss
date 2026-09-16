package com.amirhamrouni.englishtwin;

/** Shared bounds for the bridge and queued playback: preserve slow lessons. */
final class SpeechRate {
    private SpeechRate() {}

    static float normalize(double rate) {
        if (Double.isNaN(rate) || Double.isInfinite(rate) || rate <= 0) return 0.92f;
        return (float) Math.max(0.5, Math.min(1.08, rate));
    }
}
