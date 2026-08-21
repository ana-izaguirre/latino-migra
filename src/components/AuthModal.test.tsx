import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { AuthModal, describeSignInError } from "./AuthModal";
import * as firebase from "../lib/firebase";
import { GoogleUser } from "../types";

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
    it("explains a blocked popup, which the visitor can act on", () => {
      expect(describeSignInError({ code: "auth/popup-blocked" })).toMatch(/ventanas emergentes/i);
    });

    it("does not blame the visitor for closing the window", () => {
      expect(describeSignInError({ code: "auth/popup-closed-by-user" })).toMatch(/Cerraste/i);
      expect(describeSignInError({ code: "auth/cancelled-popup-request" })).toMatch(/Cerraste/i);
    });

    it("points at the connection when that is the cause", () => {
      expect(describeSignInError({ code: "auth/network-request-failed" })).toMatch(/conexión/i);
    });

    it("falls back to a generic message rather than showing the raw error", () => {
      const message = describeSignInError(new Error("FirebaseError: internal-error"));
      expect(message).toMatch(/No pudimos completar/i);
      expect(message).not.toMatch(/Firebase/i);
    });

    it("survives an error that is not an object", () => {
      expect(describeSignInError("boom")).toMatch(/No pudimos completar/i);
      expect(describeSignInError(null)).toMatch(/No pudimos completar/i);
      expect(describeSignInError(undefined)).toMatch(/No pudimos completar/i);
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
