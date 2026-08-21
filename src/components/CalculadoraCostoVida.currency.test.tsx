import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, act } from "@testing-library/react";
import React from "react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { CalculadoraCostoVida } from "./CalculadoraCostoVida";
import { useCurrency } from "../lib/CurrencyContext";
import { SUPPORTED_CURRENCIES } from "../lib/currency";

/**
 * Regression for #64.
 *
 * The screen whose whole purpose is converting money was the one screen
 * ignoring the money the visitor picked: it kept its own
 * `useState<string>("COP")` and never read the shared preference. With the
 * menu set to Lempiras, the totals came out in Colombian pesos.
 *
 * It also carried a second, ten-currency rate table of its own, while the
 * application supports sixteen. The seven missing ones — HNL among them —
 * fell through `|| FX_RATES_FROM_USD["COP"]` and were answered in pesos
 * without a word.
 */

/** Sets the shared currency from inside the provider tree. */
const SetCurrency: React.FC<{ code: string }> = ({ code }) => {
  const { setCurrency } = useCurrency();
  return (
    <button type="button" onClick={() => setCurrency(code)}>
      set-{code}
    </button>
  );
};

describe("CalculadoraCostoVida currency", () => {
  const defaultProps = { setActiveTab: vi.fn() };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const currencySelect = () =>
    screen
      .getByText(/Convertir y ver totales en mi moneda local/i)
      .closest("div")!
      .querySelector("select") as HTMLSelectElement;

  it("takes its currency from the shared preference, not a hardcoded one", () => {
    render(
      <>
        <SetCurrency code="HNL" />
        <CalculadoraCostoVida {...defaultProps} />
      </>
    );

    act(() => {
      screen.getByRole("button", { name: "set-HNL" }).click();
    });

    expect(currencySelect().value).toBe("HNL");
  });

  it("does not fall back to Colombian pesos for a currency it once lacked a rate for", () => {
    render(
      <>
        <SetCurrency code="HNL" />
        <CalculadoraCostoVida {...defaultProps} />
      </>
    );

    act(() => {
      screen.getByRole("button", { name: "set-HNL" }).click();
    });

    const select = currencySelect();
    expect(select.value).not.toBe("COP");
    // The seven currencies the local table was missing.
    for (const code of ["HNL", "GTQ", "BOB", "CRC", "DOP", "UYU", "GBP"]) {
      expect(
        [...select.options].map((o) => o.value),
        code
      ).toContain(code);
    }
  });

  it("offers every currency the application supports, and no others", () => {
    render(<CalculadoraCostoVida {...defaultProps} />);

    const offered = [...currencySelect().options].map((o) => o.value).sort();
    expect(offered).toEqual(Object.keys(SUPPORTED_CURRENCIES).sort());
  });

  it("follows the preference when it changes, without a reload", () => {
    const Toggle: React.FC = () => {
      const { setCurrency, currency } = useCurrency();
      return (
        <button type="button" onClick={() => setCurrency(currency === "MXN" ? "PEN" : "MXN")}>
          toggle
        </button>
      );
    };

    render(
      <>
        <Toggle />
        <CalculadoraCostoVida {...defaultProps} />
      </>
    );

    const toggle = screen.getByRole("button", { name: "toggle" });
    act(() => toggle.click());
    expect(currencySelect().value).toBe("MXN");

    act(() => toggle.click());
    expect(currencySelect().value).toBe("PEN");
  });

  it("writes back, so the rest of the application follows the calculator", () => {
    const Readout: React.FC = () => {
      const { currency } = useCurrency();
      return <span data-testid="shared-currency">{currency}</span>;
    };

    render(
      <>
        <Readout />
        <CalculadoraCostoVida {...defaultProps} />
      </>
    );

    const select = currencySelect();
    act(() => {
      select.value = "PEN";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // The country selector already behaves this way; the currency now does too.
    expect(screen.getByTestId("shared-currency")).toHaveTextContent("PEN");
  });

  it("shows the chosen currency's own name in the totals", () => {
    render(
      <>
        <SetCurrency code="HNL" />
        <CalculadoraCostoVida {...defaultProps} />
      </>
    );

    act(() => {
      screen.getByRole("button", { name: "set-HNL" }).click();
    });

    expect(screen.getAllByText(/Lempira/i).length).toBeGreaterThan(0);
  });
});
