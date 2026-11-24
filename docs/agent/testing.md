# Stratégie de tests

- Vitest pour tout ; MSW pour simuler les appels HTTP.
- Domaine : tests unitaires exhaustifs (placement correct, erreur, paquet
  épuisé, main vide = victoire), sans mock.
- Cas d'usage : dépôts en mémoire ou factices.
- Routes : MSW pour les appels HTTP sortants ; base de test dédiée pour les
  dépôts Prisma. Ne PAS mocker Prisma.
- Vérifier explicitement qu'une date n'est pas exposée avant révélation.
- MSW : `onUnhandledRequest: "error"`, pour qu'un appel non prévu fasse
  échouer le test.
- Le mélange du paquet est injecté pour rendre les tests déterministes.
- Base de test : Vitest force `DATABASE_URL` sur `TEST_DATABASE_URL`, les tests
  ne touchent jamais la base de dev. Migrations : `pnpm db:migrate:test`.
  Les tests d'intégration partagent la base (`fileParallelism: false`) et
  appellent `resetDatabase()` (`@tests/support/database`).
- Alias `@tests/*` pour importer depuis `tests/` : pas de chemins en `../`.
- Interface : pas de jsdom. La logique d'écran (`game-state.ts`) est testée
  seule ; les composants sont rendus en HTML avec `renderToStaticMarkup`
  (fichiers `.test.tsx`) et le HTML est inspecté (dont l'absence de date
  pour les cartes masquées). Le rendu réel se vérifie dans un navigateur.
- Client API : MSW avec une URL de base absolue.
