import { describe, expect, it } from 'vitest';
import { aggregateStructuredEvaluation, evaluationNeedsAdditionalEvidence, runTextPreflight, type StructuredEvaluation } from './evaluation';

function sample(overrides: Partial<Record<'taskFulfilment'|'coherence'|'grammarControl'|'lexicalRange'|'accuracy'|'register'|'evidenceUse'|'synthesisQuality', 0|1|2|3|4>> = {}): StructuredEvaluation {
  const dimension = (score: 0|1|2|3|4, code: string) => ({ score, evidence: ['evidence'], feedbackCode: code });
  return {
    schemaVersion: 1,
    rubricId: 'test-rubric',
    rubricVersion: '1',
    taskId: 'task',
    attemptId: 'attempt',
    dimensions: {
      taskFulfilment: dimension(overrides.taskFulfilment ?? 3, 'task'),
      coherence: dimension(overrides.coherence ?? 3, 'coherence'),
      grammarControl: dimension(overrides.grammarControl ?? 3, 'grammar'),
      lexicalRange: dimension(overrides.lexicalRange ?? 3, 'lexis'),
      accuracy: dimension(overrides.accuracy ?? 3, 'accuracy'),
      register: dimension(overrides.register ?? 3, 'register'),
      evidenceUse: dimension(overrides.evidenceUse ?? 3, 'evidence'),
      synthesisQuality: dimension(overrides.synthesisQuality ?? 3, 'synthesis'),
    },
    remediationTargets: [],
  };
}

describe('structured evaluation engine', () => {
  it('computes the overall result deterministically from dimension scores', () => {
    const result = aggregateStructuredEvaluation(sample(), 70);
    expect(result.percent).toBe(75);
    expect(result.band).toBe(3);
    expect(result.passed).toBe(true);
  });

  it('does not let an AI-supplied overall score influence aggregation', () => {
    const evaluation = sample({ taskFulfilment: 1, coherence: 1, grammarControl: 1, lexicalRange: 1, accuracy: 1, register: 1, evidenceUse: 1, synthesisQuality: 1 }) as StructuredEvaluation & { overallBand?: number };
    evaluation.overallBand = 99;
    const result = aggregateStructuredEvaluation(evaluation, 70);
    expect(result.percent).toBe(25);
    expect(result.passed).toBe(false);
  });

  it('blocks too-short, missing-source and copied responses before AI scoring', () => {
    const source = 'This source contains a long sequence of words that should not be copied directly into a learner response because synthesis should paraphrase and combine ideas from multiple sources with evidence and explanation.';
    const copied = `SOURCE_A ${source}`;
    const result = runTextPreflight({
      text: copied,
      minimumWords: 80,
      sourceTexts: [source],
      requiredSourceIds: ['SOURCE_A','SOURCE_B'],
      citedSourceIds: ['SOURCE_A'],
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('too_short');
    expect(result.errors).toContain('missing_source_reference');
    expect(result.errors).toContain('possible_source_copy');
  });

  it('accepts a sufficiently long independently phrased response with required source references', () => {
    const text = `SOURCE_A argues that practical training can improve confidence when learners have repeated opportunities to apply a skill. SOURCE_B reaches a similar conclusion but stresses that feedback quality matters more than repetition alone. Taken together, the sources suggest that practice is most effective when it is frequent, purposeful, and paired with specific feedback that helps the learner adjust future attempts. The two sources therefore agree on the value of active learning while placing different emphasis on the mechanism that makes it effective.`;
    const result = runTextPreflight({ text, minimumWords: 70, maximumWords: 150, sourceTexts: ['Different source wording'], requiredSourceIds: ['SOURCE_A','SOURCE_B'], citedSourceIds: ['SOURCE_A','SOURCE_B'] });
    expect(result.ok).toBe(true);
  });

  it('requests extra evidence when independent evaluator runs diverge materially', () => {
    const strong = sample();
    const weak = sample({ taskFulfilment: 1, coherence: 1, grammarControl: 1, lexicalRange: 1, accuracy: 1, register: 1, evidenceUse: 1, synthesisQuality: 1 });
    expect(evaluationNeedsAdditionalEvidence(strong, weak, 18)).toBe(true);
    expect(evaluationNeedsAdditionalEvidence(strong, sample(), 18)).toBe(false);
  });
});
