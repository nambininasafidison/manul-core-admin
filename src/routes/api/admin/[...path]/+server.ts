/**
 * Server-side API proxy for admin endpoints.
 *
 * Ce endpoint proxy toutes les requêtes /api/admin/* vers le backend Rust
 * en injectant le X-Admin-Secret côté serveur. Le secret ne quitte JAMAIS
 * le serveur SvelteKit — le navigateur n'y a pas accès.
 *
 * En dev, le proxy Vite gère cela. En production, ce hook intercepte
 * les requêtes /api/admin/* pour ajouter le header sécurisé.
 */
import { env as dynamicEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from '@sveltejs/kit';

const BACKEND_URL = publicEnv.PUBLIC_API_URL || 'http://localhost:8080';

export const fallback: RequestHandler = async ({ request, url, locals }) => {
  const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);

  // Injecter le ADMIN_SECRET côté serveur — le browser ne le voit jamais
  if (dynamicEnv.ADMIN_SECRET) {
    headers.set('X-Admin-Secret', dynamicEnv.ADMIN_SECRET);
  }

  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    // @ts-ignore - duplex needed for streaming body
    duplex: 'half',
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};
