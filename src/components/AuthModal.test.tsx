import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { AuthModal, describeSignInError } from "./AuthModal";
import * as firebase from "../lib/firebase";
import { GoogleUser } from "../types";
import { TRANSLATIONS, useLanguage } from "../lib/i18n";
import { LATIN_AMERICAN_COUNTRIES } from "../data/countriesData";
import React from "react";

/** Flips the shared language from inside the provider tree. */
const LanguageSwitch: React.FC = () => {
  const { setLanguage } = useLanguage();
  return (
    <button type="button" onClick={() => setLanguage("en")}>
      switch-to-english
    </button>
  );
};

describe("AuthModal Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentUser: null,
    onSignIn: vi.fn(),
    onSignOut: vi.fn(),
  };

  it("renders nothing when isOpen is false", () => {
    const { container } = render(<AuthModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders sign in screen with country selector when user is not authenticated", () => {
    render(<AuthModal {...defaultProps} />);
    expect(screen.getByText(/Inicia Sesión con Google/i)).toBeInTheDocument();
    expect(screen.getByText(/País de origen/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar con Google/i })).toBeInTheDocument();
  });

  it("renders authenticated profile view when currentUser is logged in", () => {
    const mockUser: GoogleUser = {
      id: "usr-1",
      name: "Carlos Mendoza",
      email: "carlos@example.com",
      avatar: "https://example.com/avatar.jpg",
      countryOfOrigin: "Colombia",
      signedInAt: "13 ago 2026",
    };
    render(<AuthModal {...defaultProps} currentUser={mockUser} />);
    expect(screen.getByText("Carlos Mendoza")).toBeInTheDocument();
    expect(screen.getByText("carlos@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cerrar Sesión/i })).toBeInTheDocument();
  });

  /**
   * Regression for the privilege escalation in #19: the profile view used to
   * render "👤 Persona Normal" / "🔑 Administrador" buttons, and the second
   * called onSignIn({ ...currentUser, role: "admin" }). Administrators are
   * defined by the admins collection now, so no control here may change a role.
   */
  it("offers no control that changes the account role", () => {
    const mockUser: GoogleUser = {
      id: "usr-1",
      name: "Carlos Mendoza",
      email: "carlos@example.com",
      avatar: "https://example.com/avatar.jpg",
      countryOfOrigin: "Colombia",
      signedInAt: "13 ago 2026",
    };
    render(<AuthModal {...defaultProps} currentUser={mockUser} />);

    expect(screen.queryByRole("button", { name: /Administrador/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Persona Normal/i })).toBeNull();

    // The role is still shown, as a label rather than a choice. Matched on the
    // exact badge text: the descriptive paragraph below it repeats the words.
    expect(screen.getByText("👤 Usuario Estándar")).toBeInTheDocument();
  });

  it("shows the administrator label when the admins collection granted it", () => {
    const adminUser: GoogleUser = {
      id: "usr-2",
      name: "Ana Izaguirre",
      email: "ana@example.com",
      avatar: "https://example.com/avatar.jpg",
      countryOfOrigin: "Costa Rica",
      signedInAt: "13 ago 2026",
      isAdmin: true,
    };
    render(<AuthModal {...defaultProps} currentUser={adminUser} />);

    expect(screen.getByText("🔑 Administrador")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Administrador/i })).toBeNull();
  });

  it("calls onClose when close button is clicked", () => {
    render(<AuthModal {...defaultProps} />);
    const closeBtn = screen.getByRole("button", { name: /Cerrar modal/i });
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
  /**
   * Regression for the fabricated session.
   *
   * The catch branch used to build a "Invitada LatinoMigra" user and sign the
   * visitor in with it, so a blocked popup was indistinguishable from a real
   * sign-in: the modal closed, the greeting said hello, and everything the
   * visitor saved went under an id that changed on every attempt — and
   * vanished on the next reload, because Firebase had never issued it.
   */
  describe("when sign-in does not complete", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const clickSignIn = async () => {
      const button = screen.getByRole("button", { name: /Continuar con Google/i });
      fireEvent.click(button);
      await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    };

    it("creates no session", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(firebase, "signInWithGoogle").mockRejectedValue(
        Object.assign(new Error("popup"), { code: "auth/popup-blocked" })
      );
      const onSignIn = vi.fn();
      const onClose = vi.fn();

      render(<AuthModal {...defaultProps} onSignIn={onSignIn} onClose={onClose} />);
      await clickSignIn();

      expect(onSignIn).not.toHaveBeenCalled();
      // The modal stays open so the attempt can be repeated.
      expect(onClose).not.toHaveBeenCalled();
    });

    it("never invents an identity", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(firebase, "signInWithGoogle").mockRejectedValue(new Error("offline"));

      render(<AuthModal {...defaultProps} />);
      await clickSignIn();

      expect(screen.queryByText(/Invitada/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/invitado@latinomigra/i)).not.toBeInTheDocument();
    });

    it("says what happened, in Spanish, where a screen reader will hear it", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(firebase, "signInWithGoogle").mockRejectedValue(
        Object.assign(new Error("popup"), { code: "auth/popup-blocked" })
      );

      render(<AuthModal {...defaultProps} />);
      await clickSignIn();

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/ventanas emergentes/i);
    });

    it("clears the previous message when the visitor tries again", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const signIn = vi.spyOn(firebase, "signInWithGoogle").mockRejectedValue(new Error("offline"));

      render(<AuthModal {...defaultProps} />);
      await clickSignIn();

      signIn.mockImplementation(() => new Promise(() => {}));
      fireEvent.click(screen.getByRole("button", { name: /Continuar con Google/i }));

      await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    });
  });

  /**
   * The message is a pure mapping, so it is asserted directly rather than
   * through four more renders.
   */
  describe("describeSignInError", () => {
    /** Stands in for `useLanguage().t`, which resolves to the fallback in `es`. */
    const es = (_key: string, fallback?: string) => fallback ?? _key;

    it("explains a blocked popup, which the visitor can act on", () => {
      expect(describeSignInError({ code: "auth/popup-blocked" }, es)).toMatch(
        /ventanas emergentes/i
      );
    });

    it("does not blame the visitor for closing the window", () => {
      expect(describeSignInError({ code: "auth/popup-closed-by-user" }, es)).toMatch(/Cerraste/i);
      expect(describeSignInError({ code: "auth/cancelled-popup-request" }, es)).toMatch(
        /Cerraste/i
      );
    });

    it("points at the connection when that is the cause", () => {
      expect(describeSignInError({ code: "auth/network-request-failed" }, es)).toMatch(/conexión/i);
    });

    it("falls back to a generic message rather than showing the raw error", () => {
      const message = describeSignInError(new Error("FirebaseError: internal-error"), es);
      expect(message).toMatch(/No pudimos completar/i);
      expect(message).not.toMatch(/Firebase/i);
    });

    it("survives an error that is not an object", () => {
      expect(describeSignInError("boom", es)).toMatch(/No pudimos completar/i);
      expect(describeSignInError(null, es)).toMatch(/No pudimos completar/i);
      expect(describeSignInError(undefined, es)).toMatch(/No pudimos completar/i);
    });
  });

  /**
   * Regression for #80. The modal rendered entirely in Spanish whatever the
   * chosen language — including the strings it asks for personal data with.
   */
  /**
   * Regression for #88. The list was nine countries written into the markup, so
   * someone from Panamá, Paraguay or Uruguay could not say where they were
   * from — on a platform whose audience is Latin America.
   */
  describe("country of origin", () => {
    it("offers every Latin American country the platform knows about", () => {
      render(<AuthModal {...defaultProps} />);

      const select = document.getElementById("auth-origin-country") as HTMLSelectElement;
      const offered = Array.from(select.options).map((option) => option.value);

      expect(offered).toHaveLength(LATIN_AMERICAN_COUNTRIES.length);
      for (const country of LATIN_AMERICAN_COUNTRIES) {
        expect(offered, country.name).toContain(country.name);
      }
      // The ones the hardcoded list left out.
      for (const missing of ["Panamá", "Paraguay", "Uruguay", "Bolivia", "Brasil"]) {
        expect(offered, missing).toContain(missing);
      }
    });

    it("is sorted, so the reader can find their country", () => {
      render(<AuthModal {...defaultProps} />);

      const select = document.getElementById("auth-origin-country") as HTMLSelectElement;
      const offered = Array.from(select.options).map((option) => option.value);

      expect(offered).toEqual([...offered].sort((a, b) => a.localeCompare(b, "es")));
      expect(new Set(offered).size).toBe(offered.length);
    });

    it("labels the control, so it is announced", () => {
      render(<AuthModal {...defaultProps} />);

      const select = document.getElementById("auth-origin-country")!;
      const label = document.querySelector('label[for="auth-origin-country"]');
      expect(label).toBeInTheDocument();
      expect(select.tagName).toBe("SELECT");
    });
  });

  describe("in English", () => {
    const en = (key: string) => TRANSLATIONS[key]?.en ?? key;

    it("translates the sign-in errors", () => {
      expect(describeSignInError({ code: "auth/popup-blocked" }, en)).toMatch(/pop-ups/i);
      expect(describeSignInError({ code: "auth/network-request-failed" }, en)).toMatch(
        /could not reach Google/i
      );
      expect(describeSignInError("boom", en)).toMatch(/could not complete/i);
    });

    it("has an English entry for every string the modal renders", () => {
      const keys = [
        "auth.titleSignIn",
        "auth.titleAccount",
        "auth.descSignIn",
        "auth.descAccount",
        "auth.continueWithGoogle",
        "auth.signOut",
        "auth.verifiedAccount",
        "auth.roleLabel",
        "auth.roleAdmin",
        "auth.roleStandard",
        "auth.roleAdminBody",
        "auth.roleStandardBody",
        "auth.syncBookmarks",
        "auth.syncCalendar",
        "auth.syncChat",
        "auth.originCountry",
        "auth.privacyNotice",
        "auth.errorPopupBlocked",
        "auth.errorPopupClosed",
        "auth.errorNetwork",
        "auth.errorGeneric",
      ];

      for (const key of keys) {
        expect(TRANSLATIONS[key], key).toBeDefined();
        expect(TRANSLATIONS[key].en, key).not.toBe(TRANSLATIONS[key].es);
      }
    });

    it("renders the modal in English when the language is English", () => {
      render(
        <>
          <LanguageSwitch />
          <AuthModal {...defaultProps} />
        </>
      );

      fireEvent.click(screen.getByText("switch-to-english"));

      expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
      expect(screen.getByText(/Country of origin/i)).toBeInTheDocument();
      expect(screen.queryByText(/Continuar con Google/i)).not.toBeInTheDocument();
    });
  });

  describe("when sign-in succeeds", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("signs the user in with the identity Firebase returned", async () => {
      vi.spyOn(firebase, "signInWithGoogle").mockResolvedValue({
        user: {
          uid: "firebase-uid-1",
          displayName: "Ana Izaguirre",
          email: "ana@example.com",
          photoURL: "https://example.com/a.jpg",
        },
        countryOfOrigin: "Honduras",
      } as never);
      vi.spyOn(firebase, "isUserAdmin").mockResolvedValue(false as never);
      const onSignIn = vi.fn();

      render(<AuthModal {...defaultProps} onSignIn={onSignIn} />);
      fireEvent.click(screen.getByRole("button", { name: /Continuar con Google/i }));

      await waitFor(() => expect(onSignIn).toHaveBeenCalled());
      const user = onSignIn.mock.calls[0][0];
      // The id is Firebase's, not a generated one: everything saved is keyed
      // on it, so a fabricated id loses the visitor's data on the next visit.
      expect(user.id).toBe("firebase-uid-1");
      expect(user.name).toBe("Ana Izaguirre");
      expect(user.countryOfOrigin).toBe("Honduras");
      expect(user.isAdmin).toBe(false);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("carries the administrator flag from the admins collection", async () => {
      vi.spyOn(firebase, "signInWithGoogle").mockResolvedValue({
        user: { uid: "uid-2", displayName: "Admin", email: "a@b.c", photoURL: null },
        countryOfOrigin: "México",
      } as never);
      // Never from the profile document, which its owner can write.
      vi.spyOn(firebase, "isUserAdmin").mockResolvedValue(true as never);
      const onSignIn = vi.fn();

      render(<AuthModal {...defaultProps} onSignIn={onSignIn} />);
      fireEvent.click(screen.getByRole("button", { name: /Continuar con Google/i }));

      await waitFor(() => expect(onSignIn).toHaveBeenCalled());
      expect(onSignIn.mock.calls[0][0].isAdmin).toBe(true);
    });

    it("uses the country picked in the modal when Firebase has none", async () => {
      vi.spyOn(firebase, "signInWithGoogle").mockResolvedValue({
        user: { uid: "uid-3", displayName: null, email: null, photoURL: null },
        countryOfOrigin: null,
      } as never);
      vi.spyOn(firebase, "isUserAdmin").mockResolvedValue(false as never);
      const onSignIn = vi.fn();

      render(<AuthModal {...defaultProps} onSignIn={onSignIn} />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "Honduras" } });
      fireEvent.click(screen.getByRole("button", { name: /Continuar con Google/i }));

      await waitFor(() => expect(onSignIn).toHaveBeenCalled());
      expect(onSignIn.mock.calls[0][0].countryOfOrigin).toBe("Honduras");
    });

    it("disables the button while the popup is open, so it cannot be double-fired", async () => {
      vi.spyOn(firebase, "signInWithGoogle").mockImplementation(() => new Promise(() => {}));

      render(<AuthModal {...defaultProps} />);
      const button = screen.getByRole("button", { name: /Continuar con Google/i });
      fireEvent.click(button);

      await waitFor(() => expect(button).toBeDisabled());
    });
  });
});
