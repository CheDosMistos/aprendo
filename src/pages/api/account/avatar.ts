import type { APIRoute } from 'astro';
import { AvatarValidationError, MAX_AVATAR_BYTES, readAvatar, removeAvatar, saveAvatar } from '@platform/auth/avatarStore';
import { ApiRequestError, apiErrorResponse, assertSameOrigin, jsonResponse } from '@platform/server/http';
import { getRuntime } from '@platform/server/runtime';

export const prerender = false;

export const GET: APIRoute = ({ locals }) => {
  const user = locals.user;
  if (!user) return jsonResponse({ error: 'Authentication required.' }, 401);
  const avatar = readAvatar(user.id);
  if (!avatar) return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  const body = Uint8Array.from(avatar);
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'image/webp',
      'content-length': String(body.byteLength),
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    assertSameOrigin(request);
    const user = locals.user;
    if (!user) throw new ApiRequestError('Authentication required.', 401);
    const form = await request.formData();
    const file = form.get('avatar');
    if (!(file instanceof File) || file.type !== 'image/webp') throw new ApiRequestError('El avatar debe ser WebP.', 400);
    if (file.size < 24 || file.size > MAX_AVATAR_BYTES) throw new ApiRequestError('El avatar procesado es demasiado grande.', 400);

    const version = saveAvatar(user.id, new Uint8Array(await file.arrayBuffer()));
    getRuntime().auth.setAvatarVersion(user.id, version);
    locals.user = { ...user, avatarVersion: version };
    return jsonResponse({ avatarVersion: version }, 201);
  } catch (error) {
    if (error instanceof ApiRequestError) return apiErrorResponse(error);
    if (error instanceof AvatarValidationError) return jsonResponse({ error: error.message }, 400);
    console.error('[api/account/avatar] write failed');
    return apiErrorResponse(error);
  }
};

export const DELETE: APIRoute = ({ request, locals }) => {
  try {
    assertSameOrigin(request);
    const user = locals.user;
    if (!user) throw new ApiRequestError('Authentication required.', 401);
    removeAvatar(user.id);
    getRuntime().auth.setAvatarVersion(user.id, null);
    locals.user = { ...user, avatarVersion: null };
    return new Response(null, { status: 204 });
  } catch (error) {
    if (!(error instanceof ApiRequestError)) console.error('[api/account/avatar] delete failed');
    return apiErrorResponse(error);
  }
};
