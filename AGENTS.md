# AGENTS.md

## Projet
Chroni : jeu solo de frise chronologique (dates historiques et événements
culturels). Le joueur place des cartes dans le bon ordre chronologique.
Stack : Next.js (App Router), Prisma 8 (`@prisma/orm-postgres`), PostgreSQL,
Zod, Vitest, MSW, pnpm.
Architecture : feature-based DDD. Projet démarré de zéro.

## Méthode de travail (OBLIGATOIRE)

### 1. Plan d'abord, aucun code avant validation
Pour toute tâche non triviale, ne PAS écrire de code ni créer de fichier.
Présenter d'abord un plan contenant :
- le besoin reformulé en une ou deux phrases ;
- les fichiers à créer ou à modifier, rangés par couche (domain,
  application, infrastructure, presentation) ;
- les décisions d'architecture et les compromis éventuels ;
- les cas limites identifiés et les tests prévus ;
- le découpage en commits atomiques (liste ordonnée, un message par commit).

Puis ATTENDRE ma validation explicite. Si le plan est ambigu, poser la
question avant de continuer.

### 2. Commits atomiques, présentés avant d'être faits
- Un commit = un changement logique unique, qui compile et dont les tests
  passent (`pnpm typecheck && pnpm lint && pnpm test`).
- Ne jamais mélanger refactoring, nouvelle fonctionnalité et correction.
- Pour CHAQUE commit, me présenter avant de l'exécuter :
  1. le message (Conventional Commits : `feat(runs): ...`) ;
  2. la liste des fichiers touchés ;
  3. un résumé du diff et la raison du changement ;
  4. le résultat des vérifications.
- Attendre mon accord avant de lancer `git commit`, puis passer au suivant.
- Ne jamais utiliser `git commit --amend`, `git push --force` ni `git push`
  sans demande explicite.
- Si je demande un changement après présentation, l'appliquer dans le même
  commit (pas encore créé) plutôt que d'en ajouter un de correction.

### 3. Tests d'abord quand c'est pertinent
Pour le domaine : écrire le test qui échoue, puis l'implémentation (un commit
pour le test, un pour le code, ou un seul si je le préfère : le dire dans le
plan).

## Règles non négociables
- La date d'une carte n'est JAMAIS envoyée au client avant que la carte soit
  jouée ou révélée.
- Le domaine (`features/*/domain`) n'importe ni Next, ni Prisma, ni Zod, ni React.
- Les cas d'usage dépendent de ports (interfaces), jamais de Prisma directement.
- API entièrement en anglais ; ressource principale : `runs`.

## Commandes
```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck        # tsc --noEmit
pnpm build
docker compose up -d --wait   # PostgreSQL (bases chroni et chroni_test)
pnpm db:emit                  # prisma contract emit : régénère contract.json/.d.ts
pnpm db:update                # aligne la base de dev sur le contrat (sans migration)
pnpm prisma migration plan --name <nom>   # écrit une migration à relire
pnpm prisma db migrate                    # applique les migrations
pnpm prisma db verify                     # contrat et base cohérents ?
```
Prisma 8 : jamais `@prisma/client`, `schema.prisma` ni `prisma migrate dev`
(syntaxe Prisma 7). Lire le skill `prisma-8` avant de toucher au contrat.
Ne jamais réinitialiser ni supprimer une base pour régler un problème de
migration.
Avant de présenter un commit : `pnpm typecheck && pnpm lint && pnpm test`.

## À ne pas faire
- Pas de dépendance ajoutée sans me le demander.
- Pas de fonctionnalité hors périmètre (multijoueur, comptes, classements).
- Pas de secrets ni de fichiers `.env` dans git.
- Pas de code écrit avant validation du plan.
- Pas de modification d'une migration Prisma déjà appliquée : en créer une
  nouvelle (`migrations/` est versionné, `.env` ne l'est pas).

## Documentation à lire AVANT d'agir
- Toucher à `src/features/**` ou créer une feature :
  `docs/agent/architecture.md`
- Écrire une règle du jeu, un cas d'usage `runs` ou `cards` :
  `docs/agent/game-rules.md`
- Créer ou modifier une route API : `docs/agent/api-conventions.md`
- Écrire ou modifier un test : `docs/agent/testing.md`

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
