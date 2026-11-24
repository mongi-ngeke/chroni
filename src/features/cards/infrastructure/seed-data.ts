export interface SeedCard {
  title: string;
  /** Année historique : négative avant J.-C. Les titres ne doivent jamais contenir la date. */
  year: number;
  category: "historical" | "cultural";
}

const h = (title: string, year: number): SeedCard => ({ title, year, category: "historical" });
const c = (title: string, year: number): SeedCard => ({ title, year, category: "cultural" });

// Années toutes distinctes pour qu'aucun placement ne soit ambigu.
export const seedCards: readonly SeedCard[] = [
  // Antiquité
  h("Fondation légendaire de Rome", -753),
  c("Début de la construction du Parthénon à Athènes", -447),
  h("Bataille de Marathon", -490),
  h("Mort de Socrate", -399),
  h("Mort d'Alexandre le Grand", -323),
  h("Destruction de Carthage", -146),
  h("Assassinat de Jules César", -44),
  h("Éruption du Vésuve qui ensevelit Pompéi", 79),
  c("Inauguration du Colisée à Rome", 80),
  h("Chute de l'Empire romain d'Occident", 476),
  // Moyen Âge
  h("Bataille de Poitiers", 732),
  h("Couronnement de Charlemagne", 800),
  h("Bataille d'Hastings", 1066),
  h("Prise de Jérusalem par les croisés", 1099),
  h("Signature de la Grande Charte en Angleterre", 1215),
  c("Dante achève la Divine Comédie", 1320),
  h("Début de la Peste noire en Europe", 1347),
  h("Jeanne d'Arc délivre Orléans", 1429),
  h("Chute de Constantinople", 1453),
  c("Gutenberg imprime la Bible", 1455),
  // Temps modernes
  h("Christophe Colomb atteint l'Amérique", 1492),
  c("Michel-Ange peint le plafond de la chapelle Sixtine", 1512),
  h("Luther affiche ses quatre-vingt-quinze thèses", 1517),
  h("Édit de Nantes", 1598),
  c("Publication du premier tome de Don Quichotte", 1605),
  h("Fondation de Québec par Champlain", 1608),
  h("Galilée observe les lunes de Jupiter", 1610),
  c("Première représentation du Cid de Corneille", 1637),
  h("Newton publie les Principia", 1687),
  c("Vivaldi compose Les Quatre Saisons", 1725),
  c("Parution du premier volume de l'Encyclopédie", 1751),
  h("Déclaration d'indépendance des États-Unis", 1776),
  h("Prise de la Bastille", 1789),
  c("Création de La Flûte enchantée de Mozart", 1791),
  h("Exécution de Louis XVI", 1793),
  h("Sacre de Napoléon Ier", 1804),
  h("Bataille de Waterloo", 1815),
  // XIXe siècle
  c("Champollion déchiffre les hiéroglyphes", 1822),
  c("Première de la Neuvième Symphonie de Beethoven", 1824),
  h("Abolition définitive de l'esclavage en France", 1848),
  c("Publication de Madame Bovary", 1857),
  h("Darwin publie L'Origine des espèces", 1859),
  h("Début de la guerre de Sécession", 1861),
  c("Publication des Misérables de Victor Hugo", 1862),
  h("Commune de Paris", 1871),
  c("Première exposition impressionniste à Paris", 1874),
  h("Alexander Graham Bell invente le téléphone", 1876),
  c("Inauguration de la statue de la Liberté", 1886),
  h("Inauguration de la tour Eiffel", 1889),
  c("Edvard Munch peint Le Cri", 1893),
  c("Première séance publique de cinéma des frères Lumière", 1895),
  h("Premiers Jeux olympiques modernes à Athènes", 1896),
  // XXe siècle
  h("Premier vol motorisé des frères Wright", 1903),
  h("Einstein publie la relativité restreinte", 1905),
  h("Naufrage du Titanic", 1912),
  c("Première du Sacre du printemps de Stravinsky", 1913),
  h("Début de la Première Guerre mondiale", 1914),
  h("Révolution russe d'Octobre", 1917),
  h("Armistice du 11 novembre", 1918),
  c("Sortie du Chanteur de jazz, premier film parlant", 1927),
  h("Fleming découvre la pénicilline", 1928),
  h("Krach de Wall Street", 1929),
  h("Première Coupe du monde de football en Uruguay", 1930),
  h("Hitler devient chancelier d'Allemagne", 1933),
  c("Picasso peint Guernica", 1937),
  h("Début de la Seconde Guerre mondiale", 1939),
  c("Publication de L'Étranger d'Albert Camus", 1942),
  h("Débarquement de Normandie", 1944),
  h("Bombardement atomique d'Hiroshima", 1945),
  c("Premier Festival de Cannes", 1946),
  h("Indépendance de l'Inde", 1947),
  h("Déclaration universelle des droits de l'homme", 1948),
  h("Proclamation de la République populaire de Chine", 1949),
  h("Watson et Crick décrivent la double hélice de l'ADN", 1953),
  c("Publication du Seigneur des anneaux", 1954),
  c("Elvis Presley enregistre Heartbreak Hotel", 1956),
  h("Signature du traité de Rome", 1957),
  c("Première publication d'Astérix", 1959),
  h("Construction du mur de Berlin", 1961),
  h("Crise des missiles de Cuba", 1962),
  h("Assassinat de John F. Kennedy", 1963),
  c("Les Beatles publient Sgt. Pepper's", 1967),
  h("Mai 68 en France", 1968),
  h("Premier pas sur la Lune", 1969),
  c("Sortie du premier Star Wars", 1977),
  h("Abolition de la peine de mort en France", 1981),
  h("Catastrophe de Tchernobyl", 1986),
  h("Chute du mur de Berlin", 1989),
  h("Dissolution de l'URSS", 1991),
  c("Le CERN place le World Wide Web dans le domaine public", 1993),
  h("Élection de Nelson Mandela à la présidence de l'Afrique du Sud", 1994),
  c("Sortie de Toy Story, premier long métrage en images de synthèse", 1995),
  c("Publication de Harry Potter à l'école des sorciers", 1997),
  // XXIe siècle
  h("Attentats du 11 septembre", 2001),
  c("Lancement de YouTube", 2005),
  c("Présentation du premier iPhone", 2007),
  h("Séisme et tsunami de Fukushima", 2011),
  h("Accord de Paris sur le climat", 2015),
  c("Incendie de la cathédrale Notre-Dame de Paris", 2019),
  h("Début de la pandémie de Covid-19", 2020),
];

/** Identifiant stable dérivé du titre : rejouer le seed met à jour sans dupliquer. */
export function seedCardId(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
