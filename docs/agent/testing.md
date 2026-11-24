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
