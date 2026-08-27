const MIDI_CHANNEL = 10;
const MIDI_UNPITCHED = 39;

interface InstrumentMapping {
  id: string;
  needsScoreInstrument: boolean;
  needsMidiInstrument: boolean;
}

function mappingForScorePart(scorePart: string, partId: string): InstrumentMapping {
  const scoreInstrumentId = scorePart.match(/<score-instrument\b[^>]*id="([^"]+)"[^>]*>/)?.[1];
  const midiInstrumentId = scorePart.match(/<midi-instrument\b[^>]*id="([^"]+)"[^>]*>/)?.[1];
  const id = scoreInstrumentId ?? midiInstrumentId ?? `${partId}-I1`;
  return {
    id,
    needsScoreInstrument: !scoreInstrumentId,
    needsMidiInstrument: !new RegExp(`<midi-instrument\\b[^>]*id="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`).test(scorePart),
  };
}

function ensureMidiPercussionBody(body: string): string {
  let result = body;
  if (/<midi-channel>\d+<\/midi-channel>/.test(result)) {
    result = result.replace(/<midi-channel>\d+<\/midi-channel>/, `<midi-channel>${MIDI_CHANNEL}</midi-channel>`);
  } else {
    result = `<midi-channel>${MIDI_CHANNEL}</midi-channel>${result}`;
  }
  if (/<midi-unpitched>\d+<\/midi-unpitched>/.test(result)) return result;
  return `${result}<midi-unpitched>${MIDI_UNPITCHED}</midi-unpitched>`;
}

function ensureScorePartMapping(scorePart: string, partId: string): { scorePart: string; instrumentId: string } {
  const mapping = mappingForScorePart(scorePart, partId);
  let result = scorePart;

  if (mapping.needsScoreInstrument) {
    result = result.replace(
      /<\/score-part>\s*$/,
      `<score-instrument id="${mapping.id}"><instrument-name>Practice Pad</instrument-name></score-instrument></score-part>`,
    );
  }

  const midiPattern = new RegExp(`(<midi-instrument\\b[^>]*id="${mapping.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>)([\\s\\S]*?)(<\\/midi-instrument>)`);
  if (midiPattern.test(result)) {
    result = result.replace(midiPattern, (_match, open: string, body: string, close: string) => `${open}${ensureMidiPercussionBody(body)}${close}`);
  } else {
    result = result.replace(
      /<\/score-part>\s*$/,
      `<midi-instrument id="${mapping.id}"><midi-channel>${MIDI_CHANNEL}</midi-channel><midi-unpitched>${MIDI_UNPITCHED}</midi-unpitched></midi-instrument></score-part>`,
    );
  }

  return { scorePart: result, instrumentId: mapping.id };
}

function ensurePartNotes(partBody: string, instrumentId: string): string {
  return partBody.replace(/<note>([\s\S]*?)<\/note>/g, (note, body: string) => {
    if (!body.includes('<unpitched>') || /<instrument\b[^>]*id="[^"]+"\s*\/>/.test(body)) return note;
    return `<note>${body.replace(/<\/unpitched>/, `</unpitched><instrument id="${instrumentId}"/>`)}</note>`;
  });
}

/**
 * Adds only playback metadata required for unpitched percussion.
 * Rhythms, durations, beams, tuplets, sticking, accents and visual notation are left untouched.
 */
export function ensurePercussionPlaybackMapping(xml: string): string {
  if (!xml.includes('<unpitched>')) return xml;

  const instrumentIds = new Map<string, string>();
  let result = xml.replace(/<score-part\b[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/score-part>/g, (scorePart, partId: string) => {
    const normalized = ensureScorePartMapping(scorePart, partId);
    instrumentIds.set(partId, normalized.instrumentId);
    return normalized.scorePart;
  });

  result = result.replace(/<part\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/part>/g, (part, partId: string, body: string) => {
    const instrumentId = instrumentIds.get(partId);
    if (!instrumentId) return part;
    return part.replace(body, ensurePartNotes(body, instrumentId));
  });

  return result;
}