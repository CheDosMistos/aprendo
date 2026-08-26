import type { APIRoute } from 'astro';
import { PAS_RUDIMENTS } from '@courses/bateria/rudiments/pasRudiments';
import { generateRudimentStudyMusicXml } from '@courses/bateria/rudiments/rudimentStudyMusicXml';

export const prerender = false;

export const GET: APIRoute = ({ params }) => {
  const definition = PAS_RUDIMENTS.find((candidate) => candidate.slug === params.slug);
  if (!definition) return new Response('Not Found', { status: 404 });

  return new Response(generateRudimentStudyMusicXml(definition), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.recordare.musicxml+xml; charset=utf-8',
      'Cache-Control': 'private, max-age=86400',
    },
  });
};
