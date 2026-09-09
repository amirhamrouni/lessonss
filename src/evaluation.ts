import type { Skill } from './curriculumV2';

export type EvaluationScore = 0 | 1 | 2 | 3 | 4;

export type EvaluationDimension = {
  score: EvaluationScore;
  evidence: string[];
  feedbackCode: string;
};

export type StructuredEvaluation = {
  schemaVersion: 1;
  rubricId: string;
  rubricVersion: string;
  taskId: string;
  attemptId: string;
  dimensions: {
    taskFulfilment: EvaluationDimension;
    coherence: EvaluationDimension;
    grammarControl: EvaluationDimension;
    lexicalRange: EvaluationDimension;
    accuracy: EvaluationDimension;
    register?: EvaluationDimension;
    evidenceUse?: EvaluationDimension;
    synthesisQuality?: EvaluationDimension;
  };
  remediationTargets: Array<{
    skill: Skill;
    code: string;
    priority: 1 | 2 | 3;
  }>;
  modelMetadata?: {
    provider: string;
    model: string;
    evaluationVersion: string;
  };
};

export type EvaluationAggregate = {
  percent: number;
  band: EvaluationScore;
  passed: boolean;
  dimensionPercents: Record<string, number>;
};

const defaultWeights: Record<string, number> = {
  taskFulfilment: 1.2,
  coherence: 1,
  grammarControl: 1,
  lexicalRange: 1,
  accuracy: 1,
  register: 0.8,
  evidenceUse: 1,
  synthesisQuality: 1.1,
};

export function aggregateStructuredEvaluation(
  evaluation: StructuredEvaluation,
  masteryThreshold = 70,
  weights: Record<string, number> = defaultWeights,
): EvaluationAggregate {
  let weighted = 0;
  let possible = 0;
  const dimensionPercents: Record<string, number> = {};

  for (const [name, value] of Object.entries(evaluation.dimensions)) {
    if (!value) continue;
    const weight = weights[name] ?? 1;
    const percent = Math.round((value.score / 4) * 100);
    dimensionPercents[name] = percent;
    weighted += value.score * weight;
    possible += 4 * weight;
  }

  const percent = possible ? Math.round((weighted / possible) * 100) : 0;
  const band = Math.max(0, Math.min(4, Math.round(percent / 25))) as EvaluationScore;
  return { percent, band, passed: percent >= masteryThreshold, dimensionPercents };
}

export type TextPreflightInput = {
  text: string;
  minimumWords?: number;
  maximumWords?: number;
  sourceTexts?: string[];
  requiredSourceIds?: string[];
  citedSourceIds?: string[];
};

export type TextPreflightResult = {
  ok: boolean;
  wordCount: number;
  errors: Array<'empty'|'too_short'|'too_long'|'missing_source_reference'|'possible_source_copy'>;
};

function normalizeTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function longestCopiedWindow(response: string, source: string, windowSize = 12) {
  const responseText = ` ${normalizeTokens(response).join(' ')} `;
  const sourceTokens = normalizeTokens(source);
  if (sourceTokens.length < windowSize) return 0;
  let best = 0;
  for (let size = windowSize; size <= Math.min(30, sourceTokens.length); size += 1) {
    let found = false;
    for (let index = 0; index <= sourceTokens.length - size; index += 1) {
      const phrase = ` ${sourceTokens.slice(index, index + size).join(' ')} `;
      if (responseText.includes(phrase)) { best = size; found = true; break; }
    }
    if (!found) break;
  }
  return best;
}

export function runTextPreflight(input: TextPreflightInput): TextPreflightResult {
  const text = input.text.trim();
  const wordCount = normalizeTokens(text).length;
  const errors: TextPreflightResult['errors'] = [];
  if (!text) errors.push('empty');
  if (input.minimumWords && wordCount < input.minimumWords) errors.push('too_short');
  if (input.maximumWords && wordCount > input.maximumWords) errors.push('too_long');

  if (input.requiredSourceIds?.length) {
    const cited = new Set(input.citedSourceIds || []);
    if (input.requiredSourceIds.some(id => !cited.has(id))) errors.push('missing_source_reference');
  }

  if ((input.sourceTexts || []).some(source => longestCopiedWindow(text, source) >= 18)) {
    errors.push('possible_source_copy');
  }
  return { ok: errors.length === 0, wordCount, errors };
}

export function evaluationNeedsAdditionalEvidence(first: StructuredEvaluation, second: StructuredEvaluation, maxPercentDelta = 18) {
  const a = aggregateStructuredEvaluation(first).percent;
  const b = aggregateStructuredEvaluation(second).percent;
  return Math.abs(a - b) > maxPercentDelta;
}
