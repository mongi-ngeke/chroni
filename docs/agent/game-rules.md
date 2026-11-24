# Règles du jeu (source de vérité métier)

## Mise en place
- Paquet de 100 cartes, stocké en base (table `Card`), mélangé au démarrage
  du run (mélange injecté, jamais `Math.random()` dans le domaine).
- La 1re carte du paquet est posée sur la frise : sa date est visible. Le
  joueur reçoit ensuite une main de 10 cartes ; le reste forme la pioche
  (1 + 10 + 89 avec 100 cartes). Il faut au moins 11 cartes pour démarrer.
- Partie solo uniquement : ne pas anticiper le multijoueur.

## Jouer une carte
- Le joueur envoie `{ cardId, position }` : la carte doit être dans sa main,
  et `position` va de 0 à la longueur de la frise (insertion avant l'élément
  de même indice, ou en fin de frise).
- Placement correct : l'année de la carte est supérieure ou égale à celle de
  son voisin de gauche et inférieure ou égale à celle de son voisin de
  droite (l'égalité est acceptée). La carte rejoint la frise et quitte la
  main. Les années avant J.-C. sont négatives ; l'année 0 n'existe pas.
- Erreur de placement : la carte est révélée (date visible, c'est l'intérêt
  pédagogique) et placée dans la défausse, puis le joueur pioche la carte du
  dessus de la pioche. La défausse est une pile séparée, jamais remélangée
  dans la pioche.
- L'ordre des cartes dans la main est géré côté client (mini-frise de
  réflexion). Le serveur ne le connaît pas et ne le stocke pas.
- La date d'une carte n'est JAMAIS envoyée au client avant que la carte soit
  jouée ou révélée.

## Fin de partie
- Pioche épuisée : la partie continue, le joueur joue ses cartes jusqu'à
  épuisement de sa main. Une erreur de placement sur pioche vide révèle la
  carte et l'écarte définitivement (pas de repioche) : la main diminue donc
  d'une carte, que le placement soit correct ou non.
- Victoire : main vide. Une partie gagnée n'accepte plus de coup.
