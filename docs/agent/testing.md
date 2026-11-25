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
- Cartes de test : `buildCard({ id, year })` (`@tests/support/cards`) pour une
  entité valide, `insertCard({ id, year })` (`@tests/support/database`) pour une
  ligne en base, `hidden(...)` et `revealed(...)` (`@tests/support/dto`) pour
  les DTO. Ne pas écrire de carte à la main dans un test.
- Auth : les cas d'usage se testent avec `inMemoryAuth()`
  (`auth/application/testing/in-memory.ts` : hacheur et jetons factices,
  horloge fixe) ; le vrai hachage scrypt est testé dans l'infrastructure.
  Dans les tests d'API, un joueur connecté = l'en-tête `cookie` renvoyé par
  `POST /api/users` ; `insertUser(id)` (`@tests/support/database`) crée un
  compte quand le mot de passe ne compte pas. Vérifier qu'une partie privée
  répond 404 à un invité et à un autre joueur.
- Les données du paquet sont testées dans `seed-data.test.ts` : longueur et
  nombre de phrases des descriptions, aucun nombre à 3 ou 4 chiffres ni mot
  « siècle », aucune année dans le nom de fichier d'image (URL décodée).
- Vérification complète lisible : `pnpm exec vitest run --reporter=verbose`.
