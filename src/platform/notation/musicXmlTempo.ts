const SOUND_TEMPO = /<sound\b[^>]*\btempo\s*=\s*(["'])([^"']+)\1[^>]*>/i;
const PER_MINUTE = /<per-minute>\s*([^<]+?)\s*<\/per-minute>/i;

const toPositiveBpm = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const bpm = Number(raw.trim());
  return Number.isFinite(bpm) && bpm > 0 ? bpm : null;
};

export const readMusicXmlRecommendedBpm = (xml: string): number | null => {
  const soundTempo = SOUND_TEMPO.exec(xml);
  const fromSound = toPositiveBpm(soundTempo?.[2]);
  if (fromSound !== null) return fromSound;

  const metronomeTempo = PER_MINUTE.exec(xml);
  return toPositiveBpm(metronomeTempo?.[1]);
};
