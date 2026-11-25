import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { HiddenCard, RevealedCard, RunResponse } from "../schemas";
import { CardView } from "./card-view";
import { GameBoard } from "./game-board";
import { Hand } from "./hand";
import { PlayFeedback } from "./play-feedback";
import { Timeline } from "./timeline";
import { hidden, revealed } from "@tests/support/dto";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// Rendu serveur en environnement node : pas de jsdom, on vérifie le HTML produit.

const timeline: RevealedCard[] = [
  revealed("t1", "Marathon", -490, "historical"),
  revealed("t2", "Bastille", 1789),
];
const hand: HiddenCard[] = [
  hidden("h1", "Alpha", "cultural"),
  hidden("h2", "Beta"),
];

const run: RunResponse = {
  id: "run-1",
  status: "in_progress",
  timeline,
  hand,
  drawPileCount: 4,
  discard: [],
};

const content = {
  description: "Une description complète de la carte, affichée en entier.",
  image: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/960px-Example.jpg",
    alt: "Une image de test",
  },
};

/** Texte visible du HTML : les attributs des images (largeurs d'écran, URL) ne sont pas du contenu. */
const visibleText = (html: string) => html.replace(/<[^>]*>/g, " ");

describe("CardView", () => {
  it("shows the image with its alt text and the full description", () => {
    const html = renderToStaticMarkup(<CardView title="Alpha" {...content} />);

    expect(html).toContain("<img");
    expect(html).toContain('alt="Une image de test"');
    // Chargée directement depuis Wikimedia, sans passer par l'optimiseur de Next (voir card-view.tsx).
    expect(html).toContain(`src="${content.image.url}"`);
    expect(html).not.toContain("/_next/image");
    expect(html).toContain("Une description complète de la carte, affichée en entier.");
  });

  it("shows a hidden date placeholder when there is no year", () => {
    const html = renderToStaticMarkup(<CardView title="Alpha" {...content} />);

    expect(html).toContain("????");
    expect(html).toContain("Date cachée");
  });

  it("formats a revealed year, including before the common era", () => {
    expect(renderToStaticMarkup(<CardView title="Marathon" year={-490} {...content} />)).toContain("490 av. J.-C.");
    expect(renderToStaticMarkup(<CardView title="Bastille" year={1789} {...content} />)).toContain("1789");
  });

  it("shows the category label in French", () => {
    expect(renderToStaticMarkup(<CardView title="x" category="cultural" {...content} />)).toContain("Culture");
  });
});

describe("Hand", () => {
  it("renders one button per card and marks the selected one", () => {
    const html = renderToStaticMarkup(<Hand cards={hand} selectedCardId="h1" disabled={false} onSelect={() => {}} />);

    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
  });

  it("lays the cards out on a single scrollable row", () => {
    const html = renderToStaticMarkup(<Hand cards={hand} selectedCardId={null} disabled={false} onSelect={() => {}} />);

    expect(html).toContain("overflow-x-auto");
    expect(html).not.toContain("flex-wrap");
  });

  it("disables the cards while a play is pending", () => {
    const html = renderToStaticMarkup(<Hand cards={hand} selectedCardId={null} disabled onSelect={() => {}} />);

    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });
});

describe("Timeline", () => {
  it("renders one slot more than there are cards, all disabled until a card is selected", () => {
    const html = renderToStaticMarkup(<Timeline cards={timeline} slotsEnabled={false} onPlace={() => {}} />);

    expect(html.match(/<button/g)).toHaveLength(3);
    expect(html.match(/disabled=""/g)).toHaveLength(3);
  });

  it("labels the slots for assistive technologies", () => {
    const html = renderToStaticMarkup(<Timeline cards={timeline} slotsEnabled onPlace={() => {}} />);

    expect(html).toContain("Placer avant « Marathon »");
    expect(html).toContain("Placer entre « Marathon » et « Bastille »");
    expect(html).toContain("Placer après « Bastille »");
    expect(html).not.toContain('disabled=""');
  });

  it("shows the dates of the cards already placed", () => {
    const html = renderToStaticMarkup(<Timeline cards={timeline} slotsEnabled={false} onPlace={() => {}} />);

    expect(html).toContain("490 av. J.-C.");
    expect(html).toContain("1789");
  });
});

describe("PlayFeedback", () => {
  it("announces the outcome to screen readers", () => {
    const html = renderToStaticMarkup(
      <PlayFeedback feedback={{ outcome: "incorrect", card: revealed("c", "Alpha", 1500) }} onDismiss={() => {}} />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("Raté");
    expect(html).toContain("1500");
  });
});

describe("GameBoard", () => {
  it("shows the timeline, the hand and the draw pile size, with no date for the hand", () => {
    const html = renderToStaticMarkup(<GameBoard initialRun={run} />);

    expect(html).toContain("Frise chronologique");
    expect(html).toContain("Votre main (2)");
    expect(html).toContain("4 cartes dans la pioche");
    // Seules les cartes de la frise portent une date.
    expect(visibleText(html).match(/\d{4}/g)).toEqual(["1789"]);
    expect(html).toContain("490 av. J.-C.");
  });

  it("shows the victory screen with a replay button when the run is won", () => {
    const html = renderToStaticMarkup(
      <GameBoard initialRun={{ ...run, status: "won", hand: [], discard: [revealed("x", "Miss", 1500)] }} />,
    );

    expect(html).toContain("Victoire");
    expect(html).toContain("Rejouer");
    expect(html).not.toContain("Votre main");
    expect(html).toContain("Cartes ratées (1)");
  });

  it("links to the image credits", () => {
    const html = renderToStaticMarkup(<GameBoard initialRun={run} />);

    expect(html).toContain('href="/credits"');
    expect(html).toContain("Crédits des images");
  });

  it("announces when the draw pile is empty", () => {
    expect(renderToStaticMarkup(<GameBoard initialRun={{ ...run, drawPileCount: 0 }} />)).toContain("Pioche épuisée");
  });
});
