/**
 * Server hooks — runs only on the SvelteKit server (never sent to browser).
 *
 * Injects the ADMIN_SECRET into API requests that are proxied through SvelteKit.
 * The ADMIN_SECRET never leaves the server; the browser never sees it.
 */
import { ADMIN_SECRET } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Expose ADMIN_SECRET to server-side load functions via event.locals
  event.locals.adminSecret = ADMIN_SECRET || '';

  return resolve(event);
};
