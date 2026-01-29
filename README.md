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

> ⚠️ **Interface de monitoring uniquement** - Aucune action de modification n'est possible via l'UI.

| Route        | Description                          |
| ------------ | ------------------------------------ |
| `/login`     | Authentification admin               |
| `/dashboard` | Vue d'ensemble, métriques temps réel |
| `/bots`      | Liste des bots (lecture seule)       |
| `/users`     | Liste utilisateurs (lecture seule)   |
| `/rentals`   | Locations actives                    |
| `/finance`   | Revenus, transactions                |
| `/security`  | Alertes sécurité                     |
| `/audit`     | Logs système                         |
| `/database`  | Stats base de données                |
| `/settings`  | Configuration (lecture seule)        |

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
