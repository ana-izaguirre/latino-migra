import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { AuthModal } from "./AuthModal";
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
});
