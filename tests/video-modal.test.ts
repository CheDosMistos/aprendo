import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getYouTubeVideoId, youtubePrivacyEmbedUrl } from '../src/platform/media/youtube.ts';

const modalPath = new URL('../src/platform/components/VideoModal.astro', import.meta.url);
const layoutPath = new URL('../src/platform/layouts/BaseLayout.astro', import.meta.url);
const contentReadmePath = new URL('../src/courses/bateria/content/README.md', import.meta.url);

const expectedDrumeoVideos = new Map([
  ['u1-l1-rebote-pulso-rolls.md', ['6nq-JeTUIEY', 'ynIV2P_trYQ', 'cBy0grsyz8U']],
  ['u1-l2-doubles-paradiddle.md', ['r89XcU9NZtA', '-imiZIrGwXE']],
  ['u1-l3-flam-drag-alturas.md', ['8w3E7EhFRgQ', '5ujmfxvr0bQ', 'QnMubw9P1Ow']],
]);

test('YouTube URL parser supports normal, short, shorts, live and embed URLs', () => {
  const id = 'ynIV2P_trYQ';
  assert.equal(getYouTubeVideoId(`https://www.youtube.com/watch?v=${id}&list=test`), id);
  assert.equal(getYouTubeVideoId(`https://youtu.be/${id}?si=test`), id);
  assert.equal(getYouTubeVideoId(`https://www.youtube.com/shorts/${id}`), id);
  assert.equal(getYouTubeVideoId(`https://youtube.com/live/${id}`), id);
  assert.equal(getYouTubeVideoId(`https://www.youtube-nocookie.com/embed/${id}`), id);
  assert.equal(getYouTubeVideoId('https://example.com/watch?v=ynIV2P_trYQ'), null);
  assert.equal(getYouTubeVideoId('https://youtube.com/watch?v=too-short'), null);
});

test('YouTube embeds use privacy-enhanced mode and autoplay only after opening', () => {
  assert.equal(
    youtubePrivacyEmbedUrl('ynIV2P_trYQ'),
    'https://www.youtube-nocookie.com/embed/ynIV2P_trYQ?autoplay=1&rel=0',
  );
  assert.throws(() => youtubePrivacyEmbedUrl('bad-id'), TypeError);
});

test('Aprendo mounts one general modal with the required close interactions', async () => {
  const modal = await readFile(modalPath, 'utf8');
  const layout = await readFile(layoutPath, 'utf8');

  assert.match(layout, /import VideoModal from '@platform\/components\/VideoModal\.astro'/);
  assert.match(layout, /<VideoModal\s*\/>/);
  assert.match(modal, /width:\s*90vw/);
  assert.match(modal, /height:\s*90dvh/);
  assert.match(modal, /data-video-modal-close/);
  assert.match(modal, /position:\s*fixed/);
  assert.match(modal, /top:\s*1rem/);
  assert.match(modal, /right:\s*1rem/);
  assert.match(modal, /event\.target === dialog/);
  assert.match(modal, /dialog\?\.addEventListener\('close', cleanUp\)/);
  assert.match(modal, /frame\.src = 'about:blank'/);
});

test('the reviewed Phase 1 audiovisual links use the verified Drumeo YouTube selection', async () => {
  for (const [filename, ids] of expectedDrumeoVideos) {
    const source = await readFile(new URL(`../src/courses/bateria/content/pages/${filename}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /ae\.vicfirth\.com\/education\/40-essential-rudiments/);
    for (const id of ids) {
      assert.ok(source.includes(`https://www.youtube.com/watch?v=${id}`), `${filename} must include verified Drumeo video ${id}`);
    }
  }

  const readme = await readFile(contentReadmePath, 'utf8');
  assert.match(readme, /Drumeo \(`@DrumeoOfficial`\)/);
  assert.match(readme, /PAS sigue siendo la fuente normativa/);
});
