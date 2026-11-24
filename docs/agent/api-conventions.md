# Conventions d'API

- Tout en anglais : ressources, champs, routes, messages d'erreur.
- Ressource principale : `runs` (une partie solo), pas `games`.
- Routes au pluriel, champs en `camelCase`.
- Chaque route a un schéma Zod de requête ET de réponse ; les types sont
  déduits avec `z.infer`.
- Erreurs au format `{ code, message }`, code métier stable
  (ex. `CARD_NOT_IN_HAND`) et statut HTTP adapté.
- Une réponse ne contient jamais la date d'une carte non révélée : le schéma
  de réponse doit le garantir (type distinct pour une carte masquée et une
  carte révélée).

## Exemple de handler fin
```ts
// src/app/api/runs/route.ts
export async function POST(request: Request) {
  const body = startRunRequestSchema.parse(await request.json());
  const run = await startRun(body);          // cas d'usage
  return Response.json(toRunResponse(run), { status: 201 });
}
```
