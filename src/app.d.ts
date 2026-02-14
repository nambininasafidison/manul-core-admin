// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      message: string;
      code?: string;
    }
    interface Locals {
      /** ADMIN_SECRET from server env — never sent to browser */
      adminSecret: string;
      admin?: {
        id: string;
        username: string;
        role: 'creator' | 'super_admin';
        sessionId: string;
        lastActivity: number;
      };
    }
    interface PageData {}
    interface PageState {}
    interface Platform {}
  }
}

export {};
