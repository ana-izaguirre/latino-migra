import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer Component', () => {
  it('renders branding description and footer links', () => {
    const setActiveTab = vi.fn();
    render(<Footer setActiveTab={setActiveTab} />);

    expect(screen.getByText('LatinoMigra')).toBeInTheDocument();
    expect(screen.getByText(/Empoderando a la comunidad estudiantil/i)).toBeInTheDocument();
    expect(screen.getByText(/Catálogo de Becas 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Guía Migratoria España/i)).toBeInTheDocument();

    // Click on link
    fireEvent.click(screen.getByText(/Catálogo de Becas 2026/i));
    expect(setActiveTab).toHaveBeenCalledWith('becas');
  });
});
