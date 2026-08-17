import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders as render } from '../test/renderWithProviders';
import { HeroLanding } from './HeroLanding';

describe('HeroLanding Component', () => {
  it('renders hero title, metrics and quick action buttons', () => {
    const setActiveTab = vi.fn();
    render(<HeroLanding setActiveTab={setActiveTab} />);

    // Check main title and tagline
    expect(screen.getByText(/Tu viaje comienza aquí/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Tu futuro no tiene fronteras/i);

    // Check action buttons exist
    const becasBtn = screen.getByRole('button', { name: /Buscar Becas/i });
    const guiasBtn = screen.getByRole('button', { name: /Ver Guías Migratorias/i });

    expect(becasBtn).toBeInTheDocument();
    expect(guiasBtn).toBeInTheDocument();

    // Verify clicks trigger navigation tab changes
    fireEvent.click(becasBtn);
    expect(setActiveTab).toHaveBeenCalledWith('becas');

    fireEvent.click(guiasBtn);
    expect(setActiveTab).toHaveBeenCalledWith('guia');
  });
});
