# Règles du jeu (source de vérité métier)

- Paquet de 100 cartes. Le joueur reçoit une main de 10 cartes, le reste
  forme la pioche.
- Partie solo uniquement : ne pas anticiper le multijoueur.
- Erreur de placement : la carte est révélée (date visible, c'est l'intérêt
  pédagogique), défaussée sous la pioche, et le joueur pioche la carte du
  dessus.
- L'ordre des cartes dans la main est géré côté client (mini-frise de
  réflexion). Le serveur ne le connaît pas et ne le stocke pas.
- La date d'une carte n'est JAMAIS envoyée au client avant que la carte soit
  jouée ou révélée.
- Victoire : main vide.

## Points à trancher avant d'implémenter
- Que se passe-t-il si la pioche est épuisée ? (à décider avec moi, puis à
  écrire ici)
- Stockage des cartes : base de données dès le départ ou fichier de
  données ? (à décider avec moi)
