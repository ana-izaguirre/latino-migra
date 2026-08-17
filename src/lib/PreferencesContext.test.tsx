import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  PreferencesProvider,
  usePreferences,
  countryCodeFromName,
  countryNameFromCode,
  ANY_COUNTRY,
} from "./PreferencesContext";

/**
 * The country a user picks has to be the same country on every screen — the
 * planner, the guides, the consular map, the scholarship filter and the alert
 * settings all read from this one context.
 */

/** Two independent consumers, standing in for two different screens. */
const ScreenA = () => {
  const { destinationCountry, setDestinationCountry, originCountry, setOriginCountry } =
    usePreferences();
  return (
    <div>
      <span data-testid="a-destination">{destinationCountry || "(none)"}</span>
      <span data-testid="a-origin">{originCountry || "(none)"}</span>
      <button onClick={() => setDestinationCountry("Alemania")}>A set Alemania</button>
      <button onClick={() => setOriginCountry("Perú")}>A set Perú</button>
    </div>
  );
};

const ScreenB = () => {
  const { destinationCountry, destinationCountryCode, setDestinationCountryByCode } =
    usePreferences();
  return (
    <div>
      <span data-testid="b-destination">{destinationCountry || "(none)"}</span>
      <span data-testid="b-code">{destinationCountryCode || "(none)"}</span>
      <button onClick={() => setDestinationCountryByCode("PT")}>B set PT</button>
    </div>
  );
};

const renderBoth = (props = {}) =>
  render(
    <PreferencesProvider {...props}>
      <ScreenA />
      <ScreenB />
    </PreferencesProvider>
  );

describe("PreferencesContext", () => {
  it("starts with no country chosen so screens keep their own defaults", () => {
    renderBoth();
    expect(screen.getByTestId("a-destination")).toHaveTextContent("(none)");
    expect(screen.getByTestId("a-origin")).toHaveTextContent("(none)");
    expect(ANY_COUNTRY).toBe("");
  });

  it("reflects a destination chosen on one screen across every other screen", () => {
    renderBoth();

    fireEvent.click(screen.getByText("A set Alemania"));

    expect(screen.getByTestId("a-destination")).toHaveTextContent("Alemania");
    expect(screen.getByTestId("b-destination")).toHaveTextContent("Alemania");
    expect(screen.getByTestId("b-code")).toHaveTextContent("DE");
  });

  it("reflects a destination set by country code across every other screen", () => {
    renderBoth();

    fireEvent.click(screen.getByText("B set PT"));

    expect(screen.getByTestId("a-destination")).toHaveTextContent("Portugal");
    expect(screen.getByTestId("b-code")).toHaveTextContent("PT");
  });

  it("keeps origin and destination independent of each other", () => {
    renderBoth();

    fireEvent.click(screen.getByText("A set Perú"));

    expect(screen.getByTestId("a-origin")).toHaveTextContent("Perú");
    expect(screen.getByTestId("a-destination")).toHaveTextContent("(none)");
  });

  it("accepts seeded initial countries", () => {
    renderBoth({ initialOriginCountry: "Colombia", initialDestinationCountry: "España" });

    expect(screen.getByTestId("a-origin")).toHaveTextContent("Colombia");
    expect(screen.getByTestId("b-destination")).toHaveTextContent("España");
    expect(screen.getByTestId("b-code")).toHaveTextContent("ES");
  });

  it("writes nothing to browser storage", () => {
    renderBoth();

    fireEvent.click(screen.getByText("A set Alemania"));
    fireEvent.click(screen.getByText("A set Perú"));

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  describe("country name and code mapping", () => {
    it("maps destination names to codes and back", () => {
      expect(countryCodeFromName("España")).toBe("ES");
      expect(countryCodeFromName("Alemania")).toBe("DE");
      expect(countryNameFromCode("PT")).toBe("Portugal");
    });

    it("maps Latin American origin countries too", () => {
      expect(countryCodeFromName("Colombia")).toBe("CO");
      expect(countryNameFromCode("MX")).toBe("México");
    });

    it("is case insensitive and returns empty for unknown values", () => {
      expect(countryCodeFromName("españa")).toBe("ES");
      expect(countryCodeFromName("Atlantis")).toBe("");
      expect(countryNameFromCode("ZZ")).toBe("");
      expect(countryCodeFromName("")).toBe("");
    });
  });
});
