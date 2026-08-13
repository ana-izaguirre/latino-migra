import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopNavBar } from './TopNavBar';
import { GoogleUser } from '../types';

describe('TopNavBar Component', () => {
  const defaultProps = {
    activeTab: 'home' as const,
    setActiveTab: vi.fn(),
    theme: 'light' as const,
    toggleTheme: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    currentUser: null,
    onOpenAuthModal: vi.fn(),
  };

  it('renders branding and main navigation items', () => {
    render(<TopNavBar {...defaultProps} />);
    expect(screen.getByText('LatinoMigra')).toBeInTheDocument();
    expect(screen.getByText('Becas')).toBeInTheDocument();
    expect(screen.getByText('Guía de Migración')).toBeInTheDocument();
    expect(screen.getByText('Mapa Consular')).toBeInTheDocument();
    expect(screen.getByText('Comunidad')).toBeInTheDocument();
    expect(screen.getByText('Chat IA')).toBeInTheDocument();
  });

  it('calls setActiveTab when a navigation item or logo is clicked', () => {
    render(<TopNavBar {...defaultProps} />);
    
    // Click on Becas
    fireEvent.click(screen.getByText('Becas'));
    expect(defaultProps.setActiveTab).toHaveBeenCalledWith('becas');

    // Click on Logo
    fireEvent.click(screen.getByText('LatinoMigra'));
    expect(defaultProps.setActiveTab).toHaveBeenCalledWith('home');
  });

  it('calls toggleTheme when the theme button is clicked', () => {
    render(<TopNavBar {...defaultProps} />);
    const themeBtn = screen.getByTitle(/Cambiar a Modo/i);
    fireEvent.click(themeBtn);
    expect(defaultProps.toggleTheme).toHaveBeenCalledTimes(1);
  });

  it('shows sign in button when user is not logged in and opens modal on click', () => {
    render(<TopNavBar {...defaultProps} currentUser={null} />);
    const authBtn = screen.getByText(/Acceder con Google/i);
    expect(authBtn).toBeInTheDocument();
    fireEvent.click(authBtn);
    expect(defaultProps.onOpenAuthModal).toHaveBeenCalled();
  });

  it('displays user profile info when currentUser is logged in', () => {
    const mockUser: GoogleUser = {
      id: 'user-123',
      name: 'Ana María',
      email: 'ana@example.com',
      avatar: 'https://example.com/avatar.jpg',
      countryOfOrigin: 'Colombia',
      signedInAt: '12 ago 2026',
    };
    render(<TopNavBar {...defaultProps} currentUser={mockUser} />);
    expect(screen.getByText('Ana María')).toBeInTheDocument();
  });
});
