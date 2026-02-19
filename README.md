# ManulCore Admin Panel

Interface d'administration et de monitoring pour la plateforme ManulCore.

> ⚠️ **Monitoring en lecture seule** — L'admin panel est un dashboard d'observation. Aucune action de modification n'est possible via l'UI. Le système (bots, trades, allocations) est entièrement autonome.

## Stack technique

| Composant | Technologie                                           |
| --------- | ----------------------------------------------------- |
| Framework | SvelteKit 2, Svelte 5                                 |
| Styles    | TailwindCSS 4                                         |
| Langage   | TypeScript 5                                          |
| Auth      | Triple facteur (voir ci-dessous)                      |
| State     | Svelte Stores (runes)                                 |
| HTTP      | Proxy SvelteKit (X-Admin-Secret injecté côté serveur) |

## Authentification admin

Triple authentification séquentielle obligatoire :

### Étape 1 — Identifiants

- **Username** : généré par le système (format `manul_XXXXXX`), affiché dans les logs backend au premier démarrage
- **Mot de passe** : valeur de la variable d'environnement `MANUL_ADMIN_PASSWORD` côté backend (défaut en dev : clé insecure)

### Étape 2 — TOTP (Time-based One-Time Password)

- Code 6 chiffres validé par `totp-rs` (RFC 6238, SHA1, 30 secondes)
- Au premier démarrage du backend, le **secret Base32** est affiché dans les logs
- Scanner ce secret dans une app authenticator (Google Authenticator, Authy, etc.)
- Pour persister le secret entre redémarrages : `export MANUL_TOTP_SECRET=<base32_secret>`

### Étape 3 — Passkey (WebAuthn)

Le navigateur propose automatiquement les méthodes d'authentification disponibles :

- **Fingerprint / Face ID** (biométrie intégrée à l'appareil)
- **Microsoft Authenticator** (passkey sur téléphone)
- **Google Passkey** (synchronisé via compte Google)
- **YubiKey / clé de sécurité USB/NFC**

Enregistré une fois au premier login, réutilisé aux connexions suivantes.

**Urgence** : 10 codes à usage unique affichés au premier démarrage (pas dans les logs). Ne servent QUE si l'étape 3 échoue.

> **Note** : `ADMIN_SECRET` dans le `.env` admin n'est PAS le mot de passe du login.
> C'est le header `X-Admin-Secret` injecté par le proxy SvelteKit vers le backend.

## Pages

| Route        | Description                             | Fonctionnalités             |
| ------------ | --------------------------------------- | --------------------------- |
| `/login`     | Authentification triple facteur         | Credentials → TOTP → HW Key |
| `/dashboard` | Vue d'ensemble, métriques temps réel    | Stats live, uptime, bots    |
| `/bots`      | Liste complète des bots                 | Filtres, export CSV         |
| `/users`     | Liste des utilisateurs                  | Filtres, export CSV         |
| `/rentals`   | Contrats de location actifs             | Stats, export CSV           |
| `/finance`   | Revenus, transactions, résumé financier | Export rapport CSV          |
| `/security`  | Alertes sécurité, menaces, sessions     | Status temps réel           |
| `/audit`     | Logs système et événements de sécurité  | Pagination, export CSV      |
| `/database`  | Statistiques base de données            | Pool, tables, backups       |
| `/settings`  | Configuration système (lecture seule)   | Paramètres actuels          |

## Structure du projet

```
src/
├── lib/
│   ├── api/
│   │   └── client.ts          # Client API admin (AdminApiClient)
│   ├── components/
│   │   ├── auth/              # CredentialsForm, TotpForm, HardwareKeyForm
│   │   └── ui/                # Card, Button, Input, Alert, DataTable, Toast
│   ├── stores/
│   │   ├── auth.ts            # authStore, toastStore, securityAlertsStore
│   │   └── ...
│   ├── security/              # Device fingerprint, lockout, security events
│   └── config/                # API base URL, env config
├── routes/
│   ├── +layout.svelte         # Layout principal avec Sidebar + Toast
│   ├── login/+page.svelte     # Page login triple auth
│   ├── dashboard/+page.svelte
│   ├── bots/+page.svelte
│   ├── users/+page.svelte
│   ├── rentals/+page.svelte
│   ├── finance/+page.svelte
│   ├── security/+page.svelte
│   ├── audit/+page.svelte
│   ├── database/+page.svelte
│   └── settings/+page.svelte
└── hooks.server.ts            # Proxy API (injection X-Admin-Secret)
```

## Installation & Développement

```bash
cd manul-core-admin
npm install
npm run dev     # http://localhost:5173
```

## Build Production

```bash
npm run build
npm run preview
```

## Docker

```bash
docker build -t manulcore-admin .
docker run -p 3001:3000 manulcore-admin
```

## Variables d'environnement

```bash
# Configuration API
PUBLIC_API_URL=https://api.manulcore.io     # URL du backend
ADMIN_SECRET=your_admin_secret              # Injecté par le proxy serveur SvelteKit
```

## Système de notifications

Le panel utilise un système de **toast notifications** (`toastStore`) :

```typescript
toastStore.add('success', 'Operation completed');
toastStore.add('error', 'Something went wrong');
toastStore.add('info', 'Read-only: no modifications allowed');
toastStore.add('warning', 'Attention required');
```

> Signature : `toastStore.add(type, message)` — type en premier, message en second.
