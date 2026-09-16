package com.amirhamrouni.englishtwin;

import org.junit.Test;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class SpeechRateTest {
    @Test public void preservesSlowLessonRate() {
        assertEquals(0.62f, SpeechRate.normalize(0.62), 0.0001f);
        assertTrue(SpeechRate.normalize(0.62) < SpeechRate.normalize(0.86));
    }

    @Test public void preservesNormalTeacherRate() {
        assertEquals(0.92f, SpeechRate.normalize(0.92), 0.0001f);
    }

    @Test public void boundsValidRates() {
        assertEquals(0.5f, SpeechRate.normalize(0.1), 0.0001f);
        assertEquals(1.08f, SpeechRate.normalize(100), 0.0001f);
    }

    @Test public void defaultsInvalidRates() {
        for (double rate : new double[]{0, -1, Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY}) {
            assertEquals(0.92f, SpeechRate.normalize(rate), 0.0001f);
        }
    }
}
