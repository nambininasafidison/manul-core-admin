# ManulCore Admin (`manul-core-admin`)

Frontend d'administration SvelteKit connecté au backend Rust `manul-core`.

## Stack

| Couche    | Technologie                    |
| --------- | ------------------------------ |
| Framework | SvelteKit `^2.49.1`            |
| UI        | Svelte `^5.45.6`               |
| Styling   | TailwindCSS `^4.1.18`          |
| Build     | Vite `^7.2.6`                  |
| Adapter   | `@sveltejs/adapter-cloudflare` |
| Typage    | TypeScript `^5.9.3`            |

## Scripts (`package.json`)

```bash
bun run dev
bun run build
bun run preview
bun run check
bun run check:watch
```

## Structure Réelle

```text
src/
    lib/
        api/
        assets/
        components/
        security/
        stores/
        types/
        utils/
        config.ts
    routes/
        +layout.svelte
        +page.svelte
        login/+page.svelte
        api/admin/[...path]/+server.ts
        (admin)/
            +layout.svelte
            dashboard/+page.svelte
            bots/+page.svelte
            finance/+page.svelte
            allocations/+page.svelte
            audit/+page.svelte
            security/+page.svelte
            users/+page.svelte
            database/+page.svelte
            settings/+page.svelte
            rentals/+page.svelte
```

## Routage UI

| Route                           | Usage                |
| ------------------------------- | -------------------- |
| `/login`                        | Auth admin           |
| `/dashboard` (groupe `(admin)`) | Vue système          |
| `/bots`                         | Gestion bots         |
| `/finance`                      | Finance admin        |
| `/allocations`                  | Allocation bots      |
| `/audit`                        | Audit trails         |
| `/security`                     | Sécurité             |
| `/users`                        | Gestion utilisateurs |
| `/database`                     | État base            |
| `/settings`                     | Paramétrage          |
| `/rentals`                      | Gestion rentals      |

## Intégration API

### Config frontend

`src/lib/config.ts` expose:

- `apiUrl` (défaut `http://localhost:8080`, via `PUBLIC_API_URL`)
- `apiBase` (`/api/admin`)
- `wsUrl` (défaut `ws://localhost:8080/ws`, via `PUBLIC_WS_URL`)
- `sessionTimeout` (constant `30` minutes)

### Proxy serveur admin

Le endpoint SvelteKit `src/routes/api/admin/[...path]/+server.ts`:

- proxy les requêtes `/api/admin/*` vers le backend Rust
- injecte `X-Admin-Secret` depuis `ADMIN_SECRET` (variable privée serveur)
- ne divulgue jamais ce secret au navigateur

`src/hooks.server.ts` place également `adminSecret` dans `event.locals` côté serveur.

### Proxy Vite en dev

`vite.config.ts` configure un proxy local vers `PUBLIC_API_URL` pour:

- `/api`
- `/graphql`
- `/ws` (WebSocket)

Port dev admin: `5174`.

## Variables D'environnement Utiles

| Variable         | Type           | Effet                                               |
| ---------------- | -------------- | --------------------------------------------------- |
| `PUBLIC_API_URL` | Public         | URL backend cible                                   |
| `PUBLIC_WS_URL`  | Public         | URL WebSocket cible                                 |
| `ADMIN_SECRET`   | Privée serveur | Header `X-Admin-Secret` injecté dans le proxy admin |

## Build Et Déploiement

### Build local

```bash
bun install
bun run build
bun run preview
```

### Cloudflare

Le projet est configuré avec l'adapter Cloudflare (`svelte.config.js`) et `wrangler.jsonc`.

Exemple deployment Pages:

```bash
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=manul-core-admin
```

### Docker / K8s

Les fichiers `Dockerfile`, `docker-compose.yml` et `k8s/*.yaml` sont présents dans le projet pour un packaging/déploiement infra.
