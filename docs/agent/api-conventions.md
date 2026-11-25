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
- Une carte (masquée ou révélée) porte `description` et `image { url, alt }`,
  visibles dès la main : le domaine garantit qu'elles ne contiennent pas la
  date. Le crédit de l'image n'est jamais dans ces réponses : il est servi
  par la page `/credits`.

## Comptes et sessions
- `POST /api/users` `{ email, password }` : crée le compte et connecte
  (`201 { user: { id, email } }` + cookie). Erreurs : `422 INVALID_EMAIL`,
  `422 WEAK_PASSWORD` (8 à 128 caractères), `409 EMAIL_ALREADY_USED`.
- `POST /api/sessions` `{ email, password }` : connecte (`201`, même corps).
  Erreur unique `401 INVALID_CREDENTIALS`, que l'email soit inconnu ou le
  mot de passe faux.
- `DELETE /api/sessions/current` : déconnecte et efface le cookie (`204`,
  idempotent).
- Une réponse ne contient jamais l'empreinte d'un mot de passe ; le jeton de
  session ne circule que dans `Set-Cookie`.
- Routes `runs` : le joueur vient du cookie. `POST /api/runs` lance une partie
  privée si le joueur est connecté, d'invité sinon. La partie privée d'un
  autre joueur répond `404 RUN_NOT_FOUND`, comme une partie inexistante.

## Exemple de handler fin
```ts
// src/app/api/runs/route.ts
export async function POST(request: Request) {
  const body = startRunRequestSchema.parse(await request.json());
  const run = await startRun(body);          // cas d'usage
  return Response.json(toRunResponse(run), { status: 201 });
}
```
