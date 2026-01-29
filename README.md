# ManulCore Admin Panel

Interface d'administration pour la plateforme ManulCore.

## Stack Technique

- **Framework**: SvelteKit 2.0
- **UI**: Svelte 5, TailwindCSS 4
- **Auth**: Argon2 + TOTP + Hardware Keys
- **Validation**: Zod
- **State**: Svelte Stores

## Structure

```
src/
├── lib/
│   ├── components/     # Composants réutilisables
│   ├── stores/         # State management
│   ├── api/            # Client API
│   ├── utils/          # Utilitaires
│   └── types/          # Types TypeScript
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   ├── dashboard/      # Tableau de bord
│   ├── bots/           # Gestion bots
│   ├── users/          # Gestion utilisateurs
│   ├── rentals/        # Locations
│   ├── finance/        # Finance
│   ├── security/       # Sécurité
│   ├── audit/          # Logs d'audit
│   └── settings/       # Paramètres
└── static/
```

## Pages

| Route         | Description                          |
| ------------- | ------------------------------------ |
| `/dashboard`  | Vue d'ensemble, métriques temps réel |
| `/bots`       | Liste, création, modification bots   |
| `/bots/[id]`  | Détails bot, stats, contrôles        |
| `/users`      | Liste utilisateurs, recherche        |
| `/users/[id]` | Profil utilisateur, historique       |
| `/rentals`    | Locations actives, historique        |
| `/finance`    | Revenus, transactions, distribution  |
| `/security`   | Alertes, menaces, blocages IP        |
| `/audit`      | Logs système, actions admin          |
| `/settings`   | Configuration système                |

## Composants

| Composant   | Usage                      |
| ----------- | -------------------------- |
| `DataTable` | Tableaux paginés, triables |
| `Chart`     | Graphiques (Chart.js)      |
| `Modal`     | Dialogues modaux           |
| `Toast`     | Notifications              |
| `Sidebar`   | Navigation latérale        |
| `Header`    | En-tête avec profil        |
| `StatCard`  | Cartes de statistiques     |
| `BotCard`   | Carte bot avec état        |
| `UserCard`  | Carte utilisateur          |
| `SearchBar` | Recherche globale          |

## Installation

```bash
cd manul-core-admin
npm install
```

## Développement

```bash
npm run dev
```

Accès: `http://localhost:5173`

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

## Variables d'Environnement

```bash
PUBLIC_API_URL=https://api.manulcore.io
PUBLIC_WS_URL=wss://api.manulcore.io/ws
```

## Authentification

Triple authentification requise:

1. Mot de passe (Argon2)
2. TOTP (Google Authenticator)
3. Hardware Key (WebAuthn) - optionnel

## Permissions

| Rôle        | Accès                    |
| ----------- | ------------------------ |
| Super Admin | Tout                     |
| Admin       | Bots, Users, Rentals     |
| Finance     | Finance, Audit           |
| Support     | Users (lecture), Rentals |
