import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StartButton } from "./start-button";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("StartButton", () => {
  it("shows the default label and no error at first", () => {
    const html = renderToStaticMarkup(<StartButton />);

    expect(html).toContain("Nouvelle partie");
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('disabled=""');
  });

  it("accepts a custom label", () => {
    expect(renderToStaticMarkup(<StartButton label="Rejouer" />)).toContain("Rejouer");
  });
});
