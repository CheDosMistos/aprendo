export interface PracticeDuration {
  title: string;
  minimumMinutes: number;
  maximumMinutes: number;
  countdownSeconds: number;
  badgeLabel: string;
  sourceLabel: string;
}

const PRACTICE_DURATION_SUFFIX = /\s+[—–-]\s+(?:(?:unos?|aprox\.?|aproximadamente)\s+)?(\d+)(?:\s*[–-]\s*(\d+))?\s*(?:min(?:uto)?s?)\.?\s*$/iu;

export function parsePracticeDurationHeading(value: string): PracticeDuration | null {
  const normalized = value.trim();
  const match = PRACTICE_DURATION_SUFFIX.exec(normalized);
  if (!match) return null;

  const minimumMinutes = Number.parseInt(match[1] ?? '', 10);
  const maximumMinutes = Number.parseInt(match[2] ?? match[1] ?? '', 10);
  if (!Number.isFinite(minimumMinutes) || !Number.isFinite(maximumMinutes)) return null;
  if (minimumMinutes <= 0 || maximumMinutes < minimumMinutes) return null;

  const title = normalized.slice(0, match.index).trim();
  if (!title) return null;

  return {
    title,
    minimumMinutes,
    maximumMinutes,
    // A range is a budget window. The timer uses its upper bound so it never
    // silently shortens the authored practice recommendation.
    countdownSeconds: maximumMinutes * 60,
    badgeLabel: minimumMinutes === maximumMinutes
      ? `${maximumMinutes}min`
      : `${minimumMinutes}–${maximumMinutes}min`,
    sourceLabel: match[0].trim(),
  };
}
