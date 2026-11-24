import type { RequestHandler } from "msw";

// Handlers par défaut : vide. Chaque test déclare ses handlers via server.use().
export const handlers: RequestHandler[] = [];
