import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CreditsList } from "./credits-list";

describe("CreditsList", () => {
  it("renders one item per card with its title and credit", () => {
    const html = renderToStaticMarkup(
      <CreditsList
        credits={[
          { cardId: "c1", title: "Bastille", credit: "Auteur A — CC0, via Wikimedia Commons" },
          { cardId: "c2", title: "Marathon", credit: "Auteur B — CC BY 2.5, via Wikimedia Commons" },
        ]}
      />,
    );

    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html).toContain("Bastille");
    expect(html).toContain("Auteur B — CC BY 2.5, via Wikimedia Commons");
  });

  it("escapes markup contained in a credit", () => {
    const html = renderToStaticMarkup(
      <CreditsList credits={[{ cardId: "c1", title: "T", credit: "<script>alert(1)</script>" }]} />,
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("explains when there are no cards", () => {
    expect(renderToStaticMarkup(<CreditsList credits={[]} />)).toContain("Aucune carte");
  });
});
