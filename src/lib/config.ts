/**
 * Configuration centralisée.
 *
 * Seules les variables qui changent par déploiement sont dans .env.
 * Les valeurs fixes sont des constantes ici.
 */
import { env } from '$env/dynamic/public';

export const config = {
  /** URL absolue du backend Rust */
  apiUrl: env.PUBLIC_API_URL || 'http://localhost:8080',

  /** Chemin relatif de l'API admin (ne change jamais) */
  apiBase: '/api/admin',

  /** URL WebSocket pour les mises à jour temps réel */
  wsUrl: env.PUBLIC_WS_URL || 'ws://localhost:8080/ws',

  // ---- Valeurs fixes (modifier le code pour changer) ----

  /** Timeout de session admin en minutes */
  sessionTimeout: 30,
} as const;
