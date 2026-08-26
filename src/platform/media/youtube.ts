const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
]);

function validVideoId(value: string | null | undefined): string | null {
  if (!value || !YOUTUBE_VIDEO_ID.test(value)) return null;
  return value;
}

export function getYouTubeVideoId(rawHref: string, base = 'https://aprendo.invalid/'): string | null {
  let url: URL;
  try {
    url = new URL(rawHref, base);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

  if (hostname === 'youtu.be') {
    return validVideoId(url.pathname.split('/').filter(Boolean)[0]);
  }

  if (!YOUTUBE_HOSTS.has(hostname)) return null;

  if (url.pathname === '/watch') return validVideoId(url.searchParams.get('v'));

  const [kind, id] = url.pathname.split('/').filter(Boolean);
  if (kind === 'embed' || kind === 'shorts' || kind === 'live') return validVideoId(id);

  return null;
}

export function youtubePrivacyEmbedUrl(videoId: string): string {
  const id = validVideoId(videoId);
  if (!id) throw new TypeError('Invalid YouTube video id');
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}
