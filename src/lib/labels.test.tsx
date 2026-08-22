import { describe, it, expect } from "vitest";
import { screen, act } from "@testing-library/react";
import React from "react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { useLabels, LABEL_KEYS } from "./labels";
import { TRANSLATIONS, useLanguage } from "./i18n";

/**
 * Regression for #51.
 *
 * A filter's value is data — `item.country === "España"` is how the list is
 * narrowed — so the value cannot be translated, only the label. The two were
 * the same string, which is why an English interface still offered "Cursos",
 * "En línea" and "Requisito de un visado" beside "PROGRAMME TYPE".
 */
const Probe: React.FC<{
  dimension: Parameters<ReturnType<typeof useLabels>>[0];
  value: string;
}> = ({ dimension, value }) => {
  const label = useLabels();
  const { setLanguage, language } = useLanguage();
  return (
    <>
      <span data-testid="label">{label(dimension, value)}</span>
      <button type="button" onClick={() => setLanguage(language === "es" ? "en" : "es")}>
        toggle
      </button>
    </>
  );
};

const read = () => screen.getByTestId("label").textContent;
const toggle = () =>
  act(() => {
    screen.getByRole("button", { name: "toggle" }).click();
  });

describe("useLabels", () => {
  it("renders Spanish by default", () => {
    render(<Probe dimension="country" value="Alemania" />);
    expect(read()).toBe("Alemania");
  });

  it("translates a stored value", () => {
    render(<Probe dimension="country" value="Alemania" />);
    toggle();
    expect(read()).toBe("Germany");
  });

  it.each([
    ["programmeKind", "curso", "Cursos", "Courses"],
    ["modality", "En línea", "En línea", "Online"],
    ["migrationRoute", "requisito", "Requisito de un visado", "Required for a visa"],
    ["supportType", "Manutención", "Manutención", "Living Stipend"],
    ["institutionType", "Fundación", "Fundación", "Foundation"],
    ["area", "Artes y Humanidades", "Artes y Humanidades", "Arts and Humanities"],
    ["dateRange", "urgent", "⚡ Cierra en 30 días", "⚡ Closes within 30 days"],
    ["sort", "deadline-asc", "⏱️ Cierre más próximo (Inminente)", "⏱️ Closing soonest"],
  ])("translates %s/%s", (dimension, value, es, en) => {
    render(<Probe dimension={dimension as never} value={value} />);
    expect(read()).toBe(es);
    toggle();
    expect(read()).toBe(en);
  });

  it("falls back to the value itself, never to a bare key", () => {
    // A catalogue entry with a country nobody has added a key for still reads
    // as that country rather than as "label.country.xx".
    render(<Probe dimension="country" value="Nueva Zelanda" />);
    expect(read()).toBe("Nueva Zelanda");
    toggle();
    expect(read()).toBe("Nueva Zelanda");
  });

  describe("the dictionary behind it", () => {
    it("has an entry for every key the module names", () => {
      const missing = LABEL_KEYS.filter((key) => !TRANSLATIONS[key]);
      expect(missing, missing.join(", ")).toEqual([]);
    });

    it("fills in both languages for each", () => {
      for (const key of LABEL_KEYS) {
        expect(TRANSLATIONS[key].es, key).toBeTruthy();
        expect(TRANSLATIONS[key].en, key).toBeTruthy();
      }
    });

    it("ships no English label identical to its Spanish one", () => {
      // A missing translation falls back to Spanish, which is precisely the
      // half-and-half state this issue is about. Proper nouns are exempt.
      const properNouns = new Set(["STEM", "Portugal", "Australia"]);
      const untranslated = LABEL_KEYS.filter(
        (key) =>
          TRANSLATIONS[key].es === TRANSLATIONS[key].en && !properNouns.has(TRANSLATIONS[key].es)
      );
      expect(untranslated, untranslated.join(", ")).toEqual([]);
    });
  });
});
