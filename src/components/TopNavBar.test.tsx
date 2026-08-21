import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { TopNavBar } from "./TopNavBar";
import { GoogleUser } from "../types";

describe("TopNavBar Component", () => {
  const defaultProps = {
    activeTab: "home" as const,
    setActiveTab: vi.fn(),
    theme: "light" as const,
    toggleTheme: vi.fn(),
    searchQuery: "",
    setSearchQuery: vi.fn(),
    currentUser: null,
    onOpenAuthModal: vi.fn(),
  };

  it("renders branding and main navigation items", () => {
    render(<TopNavBar {...defaultProps} />);
    expect(screen.getByText("LatinoMigra")).toBeInTheDocument();
    expect(screen.getByText(/Becas & Estudios/)).toBeInTheDocument();
    expect(screen.getByText("Guía de Migración")).toBeInTheDocument();
    expect(screen.getByText("Mapa Consular")).toBeInTheDocument();
    expect(screen.getByText("Chat IA")).toBeInTheDocument();
  });

  it("groups secondary destinations behind the tools menu", () => {
    render(<TopNavBar {...defaultProps} />);

    // Not inline in the bar...
    expect(screen.queryByText("Comunidad")).not.toBeInTheDocument();

    // ...but one click away.
    fireEvent.click(screen.getByRole("button", { name: /Herramientas/i }));
    expect(screen.getByText("Comunidad")).toBeInTheDocument();
    expect(screen.getByText(/Planificador/i)).toBeInTheDocument();
  });

  /**
   * Regression for #19. "Panel de Control" is gated on isAdmin(currentUser), which
   * used to return true for any user carrying role === "admin" — a value the
   * user could set on themselves from the auth modal.
   */
  describe("admin navigation entry", () => {
    const signedIn = (overrides: Partial<GoogleUser> = {}): GoogleUser => ({
      id: "usr-1",
      name: "Carlos Mendoza",
      email: "carlos@example.com",
      avatar: "https://example.com/avatar.jpg",
      countryOfOrigin: "Colombia",
      signedInAt: "13 ago 2026",
      ...overrides,
    });

    const openToolsMenu = () =>
      fireEvent.click(screen.getByRole("button", { name: /Herramientas/i }));

    it("is hidden from a signed-in user with no admin entry", () => {
      render(<TopNavBar {...defaultProps} currentUser={signedIn()} />);
      openToolsMenu();
      expect(screen.queryByText("Panel de Control")).not.toBeInTheDocument();
    });

    it("is hidden from a user carrying an injected admin role", () => {
      const escalated = { ...signedIn(), role: "admin" } as GoogleUser;
      render(<TopNavBar {...defaultProps} currentUser={escalated} />);
      openToolsMenu();
      expect(screen.queryByText("Panel de Control")).not.toBeInTheDocument();
    });

    it("is shown when the admins collection granted the flag", () => {
      render(<TopNavBar {...defaultProps} currentUser={signedIn({ isAdmin: true })} />);
      openToolsMenu();
      expect(screen.getByText("Panel de Control")).toBeInTheDocument();
    });
  });

  it("calls setActiveTab when a navigation item or logo is clicked", () => {
    render(<TopNavBar {...defaultProps} />);

    // Click on Becas
    fireEvent.click(screen.getByText(/Becas & Estudios/));
    expect(defaultProps.setActiveTab).toHaveBeenCalledWith("becas");

    // Click on Logo
    fireEvent.click(screen.getByText("LatinoMigra"));
    expect(defaultProps.setActiveTab).toHaveBeenCalledWith("home");
  });

  it("calls toggleTheme from the preferences menu", () => {
    render(<TopNavBar {...defaultProps} />);

    // Currency, language and theme are grouped under one preferences menu.
    fireEvent.click(screen.getByRole("button", { name: /Preferencias/i }));
    const themeBtn = screen.getByTitle(/Cambiar a Modo/i);
    fireEvent.click(themeBtn);
    expect(defaultProps.toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("shows sign in button when user is not logged in and opens modal on click", () => {
    render(<TopNavBar {...defaultProps} currentUser={null} />);
    const authBtn = screen.getByText(/Acceder con Google/i);
    expect(authBtn).toBeInTheDocument();
    fireEvent.click(authBtn);
    expect(defaultProps.onOpenAuthModal).toHaveBeenCalled();
  });

  it("displays user profile info when currentUser is logged in", () => {
    const mockUser: GoogleUser = {
      id: "user-123",
      name: "Ana María",
      email: "ana@example.com",
      avatar: "https://example.com/avatar.jpg",
      countryOfOrigin: "Colombia",
      signedInAt: "12 ago 2026",
    };
    render(<TopNavBar {...defaultProps} currentUser={mockUser} />);
    expect(screen.getByText("Ana María")).toBeInTheDocument();
  });
  /**
   * The greeting sits in a row marked `shrink-0`, so a greeting free to grow
   * pushes into the navigation beside it: a long first name plus a country
   * chip drew "¡Hola, …!" on top of "Herramientas", and neither string was
   * readable.
   */
  describe("the signed-in greeting", () => {
    const user: GoogleUser = {
      id: "uid-1",
      name: "Ana Izaguirre",
      email: "ana@example.com",
      avatar: "https://example.com/a.jpg",
      countryOfOrigin: "Honduras",
      signedInAt: "21 ago 2026",
    };

    it("greets by first name", () => {
      render(<TopNavBar {...defaultProps} currentUser={user} />);

      const greeting = document.getElementById("nav-user-greeting");
      expect(greeting).toHaveTextContent("¡Hola, Ana!");
      expect(greeting).toHaveTextContent("Honduras");
    });

    it("is bounded, so it cannot grow into the navigation", () => {
      render(<TopNavBar {...defaultProps} currentUser={user} />);

      const greeting = document.getElementById("nav-user-greeting");
      expect(greeting).toHaveClass("max-w-[16rem]");
      expect(greeting).toHaveClass("min-w-0");
    });

    it("truncates a long name instead of widening", () => {
      render(
        <TopNavBar
          {...defaultProps}
          currentUser={{ ...user, name: "Maríadelascandelarias Izaguirre" }}
        />
      );

      const name = document.getElementById("nav-user-greeting")?.firstElementChild;
      expect(name).toHaveClass("truncate");
      // The country chip must not be what gives way.
      expect(document.getElementById("nav-user-greeting")?.lastElementChild).toHaveClass(
        "shrink-0"
      );
    });

    it("is absent when nobody is signed in", () => {
      render(<TopNavBar {...defaultProps} />);
      expect(document.getElementById("nav-user-greeting")).toBeNull();
    });

    it("omits the country chip rather than rendering an empty one", () => {
      render(<TopNavBar {...defaultProps} currentUser={{ ...user, countryOfOrigin: "" }} />);

      const greeting = document.getElementById("nav-user-greeting");
      expect(greeting).toHaveTextContent("¡Hola, Ana!");
      expect(greeting?.children).toHaveLength(1);
    });
  });
});
