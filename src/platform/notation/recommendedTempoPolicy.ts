export interface RecommendedTempoPlayDecision {
  bpm: number;
  syncMetronome: boolean;
  hasPlayed: true;
}

const normalizeRecommendedBpm = (recommendedBpm: number | null): number | null => {
  if (recommendedBpm === null || !Number.isFinite(recommendedBpm) || recommendedBpm <= 0) return null;
  return Math.round(recommendedBpm);
};

export const resolveRecommendedTempoForPlay = (
  currentBpm: number,
  recommendedBpm: number | null,
  hasPlayed: boolean,
  userSelectedBpm: boolean,
): RecommendedTempoPlayDecision => {
  const normalizedRecommendedBpm = normalizeRecommendedBpm(recommendedBpm);
  const shouldUseRecommended = normalizedRecommendedBpm !== null && !hasPlayed && !userSelectedBpm;

  return {
    bpm: shouldUseRecommended ? normalizedRecommendedBpm : currentBpm,
    syncMetronome: shouldUseRecommended,
    hasPlayed: true,
  };
};

export const resolveRecommendedTempoReset = (
  currentBpm: number,
  recommendedBpm: number | null,
): { bpm: number; syncMetronome: boolean } => {
  const normalizedRecommendedBpm = normalizeRecommendedBpm(recommendedBpm);
  return normalizedRecommendedBpm === null
    ? { bpm: currentBpm, syncMetronome: false }
    : { bpm: normalizedRecommendedBpm, syncMetronome: true };
};
