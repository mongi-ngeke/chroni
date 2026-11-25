import { http, HttpResponse } from "msw";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { server } from "@tests/msw/server";
import { createAuthApi } from "./api-client";
import { AccountPanel } from "./components/account-panel";
import { AuthForm } from "./components/auth-form";
import { authErrorMessage } from "./messages";
import type { SessionResponse } from "./schemas";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const BASE = "http://api.test";
const api = createAuthApi(BASE);
const session: SessionResponse = { user: { id: "u1", email: "ada@example.org" } };
const credentials = { email: "ada@example.org", password: "correct horse" };

describe("createAuthApi", () => {
  it("signs up with the credentials as JSON", async () => {
    let received: unknown;
    server.use(
      http.post(`${BASE}/api/users`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(session, { status: 201 });
      }),
    );

    expect(await api.signUp(credentials)).toEqual(session);
    expect(received).toEqual(credentials);
  });

  it("logs in and reports a wrong password with its business code", async () => {
    server.use(
      http.post(`${BASE}/api/sessions`, () =>
        HttpResponse.json({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" }, { status: 401 }),
      ),
    );

    await expect(api.logIn(credentials)).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", status: 401 });
  });

  it("refuses a session response that leaks more than the id and the email", async () => {
    server.use(
      http.post(`${BASE}/api/sessions`, () =>
        HttpResponse.json({ user: { ...session.user, passwordHash: "scrypt$x" } }, { status: 201 }),
      ),
    );

    await expect(api.logIn(credentials)).rejects.toMatchObject({ code: "UNEXPECTED_RESPONSE" });
  });

  it("logs out with DELETE on the current session", async () => {
    server.use(http.delete(`${BASE}/api/sessions/current`, () => new HttpResponse(null, { status: 204 })));

    await expect(api.logOut()).resolves.toBeUndefined();
  });
});

describe("authErrorMessage", () => {
  it("explains each business error in French", () => {
    expect(authErrorMessage("INVALID_CREDENTIALS")).toBe("Email ou mot de passe incorrect.");
    expect(authErrorMessage("EMAIL_ALREADY_USED")).toContain("existe déjà");
    expect(authErrorMessage("WEAK_PASSWORD")).toContain("entre 8 et 128 caractères");
    expect(authErrorMessage("NETWORK_ERROR")).toContain("injoignable");
  });

  it("falls back to a generic message", () => {
    expect(authErrorMessage("SOMETHING_ELSE")).toContain("erreur inattendue");
  });
});

/** Balise `<input>` du champ `name`, pour en vérifier les attributs quel que soit leur ordre. */
function input(html: string, name: string): string {
  const tag = html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0];
  if (tag === undefined) throw new Error(`no input named ${name}`);
  return tag;
}

describe("AuthForm", () => {
  it("asks for an email and the current password to log in, and links to sign-up", () => {
    const html = renderToStaticMarkup(<AuthForm mode="login" />);

    expect(html).toContain("Connexion");
    for (const attribute of ['type="email"', 'required=""', 'autoComplete="email"']) {
      expect(input(html, "email")).toContain(attribute);
    }
    for (const attribute of ['type="password"', 'required=""', 'autoComplete="current-password"']) {
      expect(input(html, "password")).toContain(attribute);
    }
    expect(html).toContain('href="/signup"');
    expect(html).not.toContain('role="alert"');
  });

  it("asks for a new password of at least 8 characters to sign up, and links to log-in", () => {
    const html = renderToStaticMarkup(<AuthForm mode="signup" />);

    expect(html).toContain("Créer mon compte");
    for (const attribute of ['minLength="8"', 'maxLength="128"', 'autoComplete="new-password"']) {
      expect(input(html, "password")).toContain(attribute);
    }
    expect(html).toContain("Au moins 8 caractères.");
    expect(html).toContain('href="/login"');
  });
});

describe("AccountPanel", () => {
  it("tells a guest that the run is open and invites them to log in", () => {
    const html = renderToStaticMarkup(<AccountPanel email={null} />);

    expect(html).toContain("Partie en invité");
    expect(html).toContain('href="/login"');
    expect(html).not.toContain("Se déconnecter");
  });

  it("shows the email of a logged-in player, that their runs are private, and a log-out button", () => {
    const html = renderToStaticMarkup(<AccountPanel email="ada@example.org" />);

    expect(html).toContain("ada@example.org");
    expect(html).toContain("Vos parties sont privées.");
    expect(html).toMatch(/<button[^>]*>Se déconnecter<\/button>/);
  });
});
