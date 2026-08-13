import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthModal } from './AuthModal';
import { GoogleUser } from '../types';

describe('AuthModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentUser: null,
    onSignIn: vi.fn(),
    onSignOut: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<AuthModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders sign in screen with country selector when user is not authenticated', () => {
    render(<AuthModal {...defaultProps} />);
    expect(screen.getByText(/Inicia Sesión con Google/i)).toBeInTheDocument();
    expect(screen.getByText(/País de origen/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar con Google/i })).toBeInTheDocument();
  });

  it('renders authenticated profile view when currentUser is logged in', () => {
    const mockUser: GoogleUser = {
      id: 'usr-1',
      name: 'Carlos Mendoza',
      email: 'carlos@example.com',
      avatar: 'https://example.com/avatar.jpg',
      countryOfOrigin: 'Colombia',
      signedInAt: '13 ago 2026',
    };
    render(<AuthModal {...defaultProps} currentUser={mockUser} />);
    expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
    expect(screen.getByText('carlos@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cerrar Sesión/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<AuthModal {...defaultProps} />);
    const closeBtn = screen.getByRole('button', { name: /Cerrar modal/i });
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
