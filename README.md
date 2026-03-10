# ManulCore Admin Dashboard

Administration dashboard for the ManulCore autonomous trading platform. Built with SvelteKit 2, Svelte 5, and TailwindCSS 4. Deployed on Cloudflare Pages.

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Framework  | SvelteKit 2 (`@sveltejs/kit` ^2.49)               |
| UI         | Svelte 5 (`svelte` ^5.45)                         |
| Styling    | TailwindCSS 4 + `@tailwindcss/forms`              |
| Icons      | Lucide Svelte                                     |
| State      | TanStack Svelte Query v6                          |
| Validation | Zod v4                                            |
| Auth       | JWT (`jose`), TOTP (`otpauth`/`otplib`), QR codes |
| Password   | Argon2 (`argon2` ^0.44)                           |
| Adapter    | Cloudflare Pages                                  |
| Bundler    | Vite 7                                            |
| Language   | TypeScript 5.9                                    |

## Project Structure

```
manul-core-admin/
├── src/
│   ├── app.html                 # HTML shell
│   ├── app.css                  # Global styles (TailwindCSS)
│   ├── hooks.server.ts          # Server hooks (auth middleware)
│   ├── lib/
│   │   ├── api/                 # Backend API client functions
│   │   ├── assets/              # Static assets (images, logos)
│   │   ├── components/          # Reusable Svelte components
│   │   ├── security/            # Security utilities (TOTP, hashing)
│   │   ├── stores/              # Svelte stores (auth state, settings)
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # Utility functions
│   │   ├── config.ts            # API base URL, environment config
│   │   └── index.ts             # Library barrel exports
│   └── routes/
│       ├── +layout.svelte       # Root layout
│       ├── +page.svelte         # Landing / redirect
│       ├── api/                  # Server-side API routes
│       ├── login/                # Admin login page
│       └── (admin)/              # Protected route group
│           ├── +layout.svelte    # Admin layout (sidebar, header)
│           ├── allocations/      # Bot capital allocation management
│           ├── audit/            # Audit log viewer
│           ├── bots/             # Bot management (create, monitor, control)
│           ├── dashboard/        # System overview, metrics, charts
│           ├── database/         # Database administration
│           ├── finance/          # Financial reports, P&L, revenue
│           ├── rentals/          # Bot rental marketplace management
│           ├── security/         # Security settings, IP blocking, keys
│           ├── settings/         # System configuration
│           └── users/            # User management, roles, bans
├── static/
│   └── robots.txt
├── k8s/                          # Kubernetes manifests
│   ├── configmap.yaml
│   ├── deployment.yaml
│   ├── hpa.yaml                  # Horizontal Pod Autoscaler
│   ├── ingress.yaml
│   ├── namespace.yaml
│   ├── secrets.yaml
│   └── service.yaml
├── docker-compose.yml
├── Dockerfile
├── package.json
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc                # Cloudflare Workers config
```

## Pages

| Route                  | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `/login`               | Admin authentication (credentials + TOTP)     |
| `/(admin)/dashboard`   | System overview: active bots, revenue, health |
| `/(admin)/bots`        | Bot listing, creation, start/stop controls    |
| `/(admin)/finance`     | Financial reports, P&L breakdown, withdrawals |
| `/(admin)/allocations` | Capital allocation per bot, strategy weights  |
| `/(admin)/audit`       | Audit log with filtering and search           |
| `/(admin)/security`    | IP whitelist, API keys, threat monitoring     |
| `/(admin)/users`       | User listing, role assignment, ban/unban      |
| `/(admin)/database`    | Database stats, migration status, backups     |
| `/(admin)/settings`    | System configuration, feature flags           |
| `/(admin)/rentals`     | Bot rental marketplace management             |

## Authentication

Admin access requires triple authentication:

1. **Credentials** — Username and password (Argon2id hashed)
2. **TOTP** — Time-based one-time password (RFC 6238)
3. **Hardware key** — Optional WebAuthn/FIDO2 support

JWT tokens are issued by the ManulCore backend and validated in `hooks.server.ts`.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run check

# Production build
npm run build
npm run preview
```

## Deployment

### Cloudflare Pages

```bash
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=manul-core-admin
```

### Docker

```bash
docker build -t manul-core-admin .
docker-compose up -d
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

## Environment

The dashboard connects to the ManulCore backend API. Configure the API base URL in `src/lib/config.ts`.
