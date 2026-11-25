# Architecture : feature-based + DDD

Chaque fonctionnalité métier est un dossier autonome, découpé en couches.
La règle de dépendance va toujours vers le centre :
`presentation → application → domain` et `infrastructure → domain`.

```
src/
  app/                      # Next.js : routes, pages, route handlers (fins)
    api/runs/route.ts       # parse Zod → appelle un cas d'usage → répond
    runs/[id]/page.tsx      # page serveur : charge le run, le convertit en DTO
    container.ts            # racine de composition : assemble ports et adaptateurs
  features/
    runs/
      domain/               # entités, objets-valeurs, règles, erreurs métier
                            # AUCUN import de Next, Prisma, Zod ou React
      application/          # cas d'usage (start-run, play-card...), ports
      infrastructure/       # dépôts Prisma qui implémentent les ports
      presentation/         # schémas Zod (DTO), mappers, client API,
                            # logique d'écran (game-state.ts), composants UI
      index.ts              # API publique de la feature
    cards/
      (même structure)
    auth/                   # comptes (email + mot de passe) et sessions
      (même structure)
  shared/                   # utilitaires transverses, sans logique métier
                            # (DomainError, toHttpError, callApi, env)
  prisma/                   # Prisma 8 : contract.prisma, contract.json/.d.ts
    db.ts                   # client unique ; importé par infrastructure/ seulement
migrations/                 # migrations générées (versionnées)
tests/                      # alias @tests/*
  msw/                      # handlers et serveur MSW
  support/                  # aides de test (reset de la base)
  api/                      # tests des route handlers
```

## Règles
- Le domaine est pur : testable sans base de données ni réseau.
- Les cas d'usage dépendent d'interfaces (ports), jamais de Prisma
  directement.
- Une feature n'importe une autre feature que via son `index.ts`.
- Les route handlers restent fins : valider (Zod), appeler un cas d'usage,
  transformer l'erreur métier en réponse HTTP.
- Seul `infrastructure/` importe `@/prisma/db` (règle ESLint). Les modèles
  Prisma ne sortent jamais de `infrastructure/` : on les convertit
  en entités du domaine.
- Interface : le client ne manipule que des DTO (`HiddenCard` sans date,
  `RevealedCard` avec) et parle à l'API par HTTP (`api-client.ts`), jamais
  aux cas d'usage ni à Prisma. Seules les pages serveur (`app/`) appellent
  les cas d'usage, pour charger l'état initial. Style : Tailwind CSS.
  La logique d'écran vit dans `game-state.ts` (pure, sans React) ; les
  composants restent fins. Textes affichés en français.
- Images des cartes : URLs Wikimedia Commons chargées par le navigateur avec
  `next/image` en mode `unoptimized`. L'optimiseur de Next les téléchargerait
  côté serveur depuis une seule IP et Wikimedia répond 429 sur une main de
  10 cartes. Le crédit (auteur, licence) n'est jamais dans les DTO du jeu :
  il est servi par la page `/credits` (cas d'usage `listCardCredits`, trié par
  titre, jamais par date).
- Erreurs métier : chaque feature dérive sa famille (`RunError`, `AuthError`)
  de `DomainError` (`shared/domain-error.ts`) et publie la table de ses
  statuts HTTP (`RUN_ERROR_STATUS`, `AUTH_ERROR_STATUS`) ; `app/api/http.ts`
  les fusionne.
- Authentification (`features/auth`) : sans bibliothèque. Mot de passe haché
  avec scrypt (module `crypto`, sel aléatoire, comparaison à temps constant).
  Session en base, identifiée par l'empreinte SHA-256 d'un jeton aléatoire de
  256 bits ; le jeton n'existe que dans le cookie `chroni_session`
  (`HttpOnly`, `SameSite=Lax`, `Secure` en production, 30 jours). Aucun secret
  à configurer.
- Joueur courant : les routes d'API le lisent dans l'en-tête `Cookie`
  (`app/api/current-player.ts`, testable hors de Next) ; les pages serveur
  via `cookies()` (`app/current-player.ts`). Les cas d'usage `runs` reçoivent
  un `playerId` (`null` pour un invité) et ne connaissent pas la feature auth.
- Composition entre features dans l'interface : `GameBoard` (runs) reçoit le
  panneau de compte (auth) par sa prop `account`, rempli par la page.
- Client Prisma en dev : mis en cache sur `globalThis` et lié à l'empreinte du
  contrat (`src/prisma/db.ts`) ; après une migration, le rechargement à chaud
  le recrée.
- Contenu des cartes : `cards/infrastructure/seed-data.ts` est la source du
  contenu (titre, année, description, image). Après une migration qui touche
  `Card`, rejouer `pnpm db:seed` : une carte à contenu vide est refusée par le
  domaine, ce qui est voulu.
- Racine de composition : `app/container.ts` est le seul endroit qui importe
  les implémentations de plusieurs features (exception à « via `index.ts` »).
- Aléatoire (mélange du paquet) injecté en paramètre, jamais `Math.random()`
  dans le domaine.

## Conventions de code
- Pas de `any` : `unknown` puis restreindre le type.
- Fonctions courtes, noms explicites, commentaires pour le « pourquoi ».
- Fichiers en `kebab-case`, types en `PascalCase`.
- Vocabulaire métier du jeu dans le domaine, identique à celui de l'API.
