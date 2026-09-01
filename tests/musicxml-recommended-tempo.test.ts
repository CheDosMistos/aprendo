import assert from 'node:assert/strict';
import test from 'node:test';
import { readMusicXmlRecommendedBpm } from '../src/platform/notation/musicXmlTempo';

test('reads the recommended BPM from MusicXML sound tempo metadata', () => {
  assert.equal(readMusicXmlRecommendedBpm('<direction><sound tempo="120"/></direction>'), 120);
  assert.equal(readMusicXmlRecommendedBpm("<sound dynamics='90' tempo='87.5'/>") , 87.5);
});

test('falls back to a written metronome per-minute value when sound tempo is absent', () => {
  assert.equal(readMusicXmlRecommendedBpm('<metronome><beat-unit>quarter</beat-unit><per-minute>96</per-minute></metronome>'), 96);
});

test('ignores absent, invalid and non-positive tempo metadata', () => {
  assert.equal(readMusicXmlRecommendedBpm('<score-partwise/>'), null);
  assert.equal(readMusicXmlRecommendedBpm('<sound tempo="fast"/>'), null);
  assert.equal(readMusicXmlRecommendedBpm('<sound tempo="0"/>'), null);
  assert.equal(readMusicXmlRecommendedBpm('<sound tempo="-20"/>'), null);
});
