import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { HeroLanding } from "./HeroLanding";
import { Breadcrumbs } from "./Breadcrumbs";
import { useLanguage } from "../lib/i18n";

/**
 * The reported bug: switching the language changed the navigation but left the
 * page itself in Spanish. The mechanism was never broken — `t()` closes over
 * `language` and the provider re-renders. The screens simply had their copy
 * written into the markup, so there was nothing for `t()` to translate.
 *
 * These assert the copy actually changes, which a test for the dictionary
 * alone would not catch.
 */
const LanguageSwitch = () => {
  const { setLanguage, language } = useLanguage();
  return (
    <button type="button" onClick={() => setLanguage(language === "es" ? "en" : "es")}>
      switch-language
    </button>
  );
};

const flip = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "switch-language" }));

describe("HeroLanding language switching", () => {
  const props = { setActiveTab: vi.fn() };

  it("renders Spanish by default", () => {
    render(
      <>
        <LanguageSwitch />
        <HeroLanding {...props} />
      </>
    );
    expect(screen.getByText("Tu futuro no tiene fronteras")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Buscar Becas/i })).toBeInTheDocument();
  });

  it("translates the headline, the calls to action and the feature cards", async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageSwitch />
        <HeroLanding {...props} />
      </>
    );

    await flip(user);

    expect(screen.getByText("Your future has no borders")).toBeInTheDocument();
    expect(screen.queryByText("Tu futuro no tiene fronteras")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Search Scholarships/i })).toBeInTheDocument();
    expect(screen.getByText("Everything you need to take the leap")).toBeInTheDocument();
    expect(screen.getByText("Step-by-Step Guides")).toBeInTheDocument();
  });

  it("translates the signed-in welcome banner", async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageSwitch />
        <HeroLanding
          {...props}
          currentUser={{
            id: "u1",
            name: "Ana",
            email: "ana@example.com",
            avatar: "",
            signedInAt: "2026-01-01",
          }}
        />
      </>
    );

    expect(screen.getByText(/Perfil conectado desde/i)).toBeInTheDocument();
    await flip(user);
    expect(screen.getByText(/Profile connected from/i)).toBeInTheDocument();
    // The name is data, not copy, so it survives the switch untranslated.
    expect(screen.getByText(/Ana/)).toBeInTheDocument();
  });

  it("translates the image alternative text", async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageSwitch />
        <HeroLanding {...props} />
      </>
    );

    expect(
      screen.getByAltText("Estudiantes latinoamericanos en el extranjero")
    ).toBeInTheDocument();
    await flip(user);
    expect(screen.getByAltText("Latin American students abroad")).toBeInTheDocument();
  });
});

describe("Breadcrumbs language switching", () => {
  it("translates the trail and its landmark label", async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageSwitch />
        <Breadcrumbs activeTab="becas" setActiveTab={vi.fn()} />
      </>
    );

    expect(screen.getByLabelText("Ruta de navegación")).toBeInTheDocument();
    expect(screen.getByText("Catálogo de Becas")).toBeInTheDocument();

    await flip(user);

    expect(screen.getByLabelText("Breadcrumbs")).toBeInTheDocument();
    expect(screen.getByText("Scholarship Directory")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("falls back to the tab id when a label is missing rather than rendering blank", () => {
    render(<Breadcrumbs activeTab={"unknown" as never} setActiveTab={vi.fn()} />);
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });
});
