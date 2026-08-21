import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { renderWithProviders as render } from "../test/renderWithProviders";
import { GuiaMigracion } from "./GuiaMigracion";
import * as firebase from "../lib/firebase";
import { MIGRATION_GUIDES_DATA } from "../data/migrationGuides";

/**
 * Regression for #79.
 *
 * The counter rendered `visaVotes[visa.id]?.helpfulVotes || 18`, so every visa
 * in the product claimed eighteen people had found it useful — a number nobody
 * voted for, on the screen whose whole claim is that its information is
 * sourced. Voting was component state and the failed write was answered from an
 * in-memory cache, so a denied write looked exactly like a successful one.
 */

const firstVisaId = MIGRATION_GUIDES_DATA.ES.visas[0].id;

describe("Visa usefulness votes", () => {
  const defaultProps = {
    setActiveTab: vi.fn(),
    onAskAIAboutGuide: vi.fn(),
  };

  const user = {
    id: "user-1",
    name: "Ana",
    email: "ana@example.com",
    avatar: "",
    signedInAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows no number when no votes were read", async () => {
    vi.spyOn(firebase, "fetchVisaGuideVotes").mockResolvedValue({});
    render(<GuiaMigracion {...defaultProps} />);

    await waitFor(() =>
      expect(screen.getAllByText(/Sé el primero en marcarla útil/).length).toBeGreaterThan(0)
    );
    expect(screen.queryByText(/18 útiles/)).not.toBeInTheDocument();
  });

  it("shows the count that was actually read", async () => {
    vi.spyOn(firebase, "fetchVisaGuideVotes").mockResolvedValue({
      [firstVisaId]: { helpfulVotes: 3 },
    });
    render(<GuiaMigracion {...defaultProps} />);

    await waitFor(() => expect(screen.getByText("3 útiles")).toBeInTheDocument());
  });

  it("says so when the counts could not be loaded, instead of inventing them", async () => {
    vi.spyOn(firebase, "fetchVisaGuideVotes").mockRejectedValue(new Error("permission denied"));
    render(<GuiaMigracion {...defaultProps} />);

    await waitFor(() =>
      expect(document.getElementById("visa-votes-failed-status")).toBeInTheDocument()
    );
    expect(screen.queryByText(/\d+ útiles/)).not.toBeInTheDocument();
  });

  it("asks a guest to sign in rather than pretending to record a vote", async () => {
    vi.spyOn(firebase, "fetchVisaGuideVotes").mockResolvedValue({});
    const voteSpy = vi.spyOn(firebase, "voteVisaHelpful");
    const onOpenAuthModal = vi.fn();

    render(<GuiaMigracion {...defaultProps} onOpenAuthModal={onOpenAuthModal} />);
    await waitFor(() => expect(document.getElementById(`visa-vote-${firstVisaId}`)).toBeTruthy());

    fireEvent.click(document.getElementById(`visa-vote-${firstVisaId}`)!);

    expect(onOpenAuthModal).toHaveBeenCalled();
    expect(voteSpy).not.toHaveBeenCalled();
  });

  it("records a signed-in vote against that user and shows the new count", async () => {
    vi.spyOn(firebase, "fetchVisaGuideVotes").mockResolvedValue({});
    const voteSpy = vi.spyOn(firebase, "voteVisaHelpful").mockResolvedValue(1);

    render(<GuiaMigracion {...defaultProps} currentUser={user} />);
    await waitFor(() => expect(document.getElementById(`visa-vote-${firstVisaId}`)).toBeTruthy());

    fireEvent.click(document.getElementById(`visa-vote-${firstVisaId}`)!);

    await waitFor(() => expect(screen.getByText("1 útiles")).toBeInTheDocument());
    expect(voteSpy).toHaveBeenCalledWith(user.id, "ES", firstVisaId);
  });

  it("reports a rejected vote instead of showing a number nobody stored", async () => {
    vi.spyOn(firebase, "fetchVisaGuideVotes").mockResolvedValue({});
    vi.spyOn(firebase, "voteVisaHelpful").mockRejectedValue(new Error("permission denied"));

    render(<GuiaMigracion {...defaultProps} currentUser={user} />);
    await waitFor(() => expect(document.getElementById(`visa-vote-${firstVisaId}`)).toBeTruthy());

    fireEvent.click(document.getElementById(`visa-vote-${firstVisaId}`)!);

    await waitFor(() => expect(document.getElementById("visa-vote-error")).toBeInTheDocument());
    expect(screen.queryByText(/\d+ útiles/)).not.toBeInTheDocument();
  });
});
