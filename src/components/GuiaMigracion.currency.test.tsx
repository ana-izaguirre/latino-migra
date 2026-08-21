import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import React from "react";

import { renderWithProviders as render } from "../test/renderWithProviders";
import { GuiaMigracion } from "./GuiaMigracion";
import { useCurrency } from "../lib/CurrencyContext";
import { MIGRATION_GUIDES_DATA } from "../data/migrationGuides";

/**
 * Regression for #75.
 *
 * The guide printed `cost.range`, a string frozen at "€400 - €750", so a
 * reader who had chosen lempiras saw euros — and a button under the breakdown
 * offered to "simular en mi moneda local (COP, MXN, PEN, ARS…)", naming four
 * currencies that were not the one they picked. Same defect as #64 on the
 * calculator, on the screen nobody covered.
 */

/** Flips the shared currency from inside the provider tree. */
const CurrencySwitch: React.FC<{ to: string }> = ({ to }) => {
  const { setCurrency } = useCurrency();
  return (
    <button type="button" onClick={() => setCurrency(to)}>
      switch-currency
    </button>
  );
};

describe("Migration guide cost breakdown", () => {
  const defaultProps = {
    setActiveTab: vi.fn(),
    onAskAIAboutGuide: vi.fn(),
  };

  const renderWithSwitch = (to: string) =>
    render(
      <>
        <CurrencySwitch to={to} />
        <GuiaMigracion {...defaultProps} />
      </>
    );

  it("shows what the destination charges, in the destination's currency", () => {
    render(<GuiaMigracion {...defaultProps} />);

    const spain = MIGRATION_GUIDES_DATA.ES.costs[0];
    expect(spain.currency).toBe("EUR");
    expect(
      screen.getByText(`€ ${spain.min} - € ${spain.max} / ${spain.period}`)
    ).toBeInTheDocument();
  });

  it("adds the same range in the currency the visitor chose", () => {
    renderWithSwitch("HNL");

    // Nothing converted while the visitor is on the destination's own currency.
    expect(screen.queryByText(/^≈ L /)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("switch-currency"));

    const converted = screen.getAllByText(/^≈ L [\d.]+ - L [\d.]+ \/ mes$/);
    expect(converted.length).toBe(MIGRATION_GUIDES_DATA.ES.costs.length);
  });

  it("says the converted figure is an approximation, not a published price", () => {
    renderWithSwitch("HNL");
    fireEvent.click(screen.getByText("switch-currency"));

    expect(screen.getByText(/no un precio publicado/i)).toBeInTheDocument();
  });

  it("no longer offers to simulate in a currency the visitor has already chosen", () => {
    renderWithSwitch("HNL");
    fireEvent.click(screen.getByText("switch-currency"));

    expect(screen.queryByText(/Simular en mi moneda local/i)).not.toBeInTheDocument();
    // Both controls pointed at the calculator, a screen the navigation hides
    // since #57 — the guide converts inline instead.
    expect(screen.queryByText(/Abrir Calculadora/i)).not.toBeInTheDocument();
  });

  it("keeps the weekly quotes weekly", () => {
    render(<GuiaMigracion {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Australia/i }));

    const weekly = MIGRATION_GUIDES_DATA.AU.costs.filter((c) => c.period === "semana");
    expect(weekly.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\/ semana$/).length).toBeGreaterThanOrEqual(weekly.length);
  });
});
