import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer Component', () => {
  it('renders branding description and footer links', () => {
    const setActiveTab = vi.fn();
    render(<Footer setActiveTab={setActiveTab} />);

    expect(screen.getByText('LatinoMigra')).toBeInTheDocument();
    expect(screen.getByText(/Empoderando a la comunidad estudiantil/i)).toBeInTheDocument();
    expect(screen.getByText(/Catálogo de Becas/i)).toBeInTheDocument();
    expect(screen.getByText(/Guía Oficial de Migración/i)).toBeInTheDocument();

    // Click on link
    fireEvent.click(screen.getByText(/Catálogo de Becas/i));
    expect(setActiveTab).toHaveBeenCalledWith('becas');
  });
});
