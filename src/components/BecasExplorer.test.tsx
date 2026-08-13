import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BecasExplorer } from './BecasExplorer';

describe('BecasExplorer Component', () => {
  const defaultProps = {
    searchQuery: '',
    setSearchQuery: vi.fn(),
    setActiveTab: vi.fn(),
    onAskAIAboutScholarship: vi.fn(),
  };

  it('renders scholarships header and search field', () => {
    render(<BecasExplorer {...defaultProps} />);
    expect(screen.getByText(/Directorio Oficial de Becas/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar por nombre, país, área o universidad/i)).toBeInTheDocument();
  });

  it('filters scholarships when typing in the search bar', () => {
    const { rerender } = render(<BecasExplorer {...defaultProps} searchQuery="" />);
    expect(screen.getByText(/Fundación Carolina/i)).toBeInTheDocument();

    // Rerender with search query for DAAD
    rerender(<BecasExplorer {...defaultProps} searchQuery="DAAD" />);
    expect(screen.getByText(/DAAD Helmut-Schmidt/i)).toBeInTheDocument();
  });

  it('opens scholarship modal details when clicking on a card', () => {
    render(<BecasExplorer {...defaultProps} />);
    
    // Find and click on the first scholarship "Ver Detalles" button
    const detailButtons = screen.getAllByRole('button', { name: /Ver Detalles/i });
    expect(detailButtons.length).toBeGreaterThan(0);
    fireEvent.click(detailButtons[0]);

    // Check that modal details appear
    expect(screen.getByText(/Requisitos Principales/i)).toBeInTheDocument();
    expect(screen.getByText(/Beneficios Incluidos/i)).toBeInTheDocument();
  });

  it('calls onAskAIAboutScholarship when clicking Consultar IA in modal', () => {
    render(<BecasExplorer {...defaultProps} />);
    
    // Open modal
    const detailButtons = screen.getAllByRole('button', { name: /Ver Detalles/i });
    fireEvent.click(detailButtons[0]);

    // Click on "Consultar IA" button
    const askAiBtn = screen.getByRole('button', { name: /Consultar IA/i });
    fireEvent.click(askAiBtn);

    expect(defaultProps.onAskAIAboutScholarship).toHaveBeenCalled();
  });

  it('opens suggest scholarship modal when clicking Sugerir Beca Oficial', () => {
    render(<BecasExplorer {...defaultProps} />);
    const suggestBtn = screen.getByRole('button', { name: /Sugerir Beca Oficial/i });
    fireEvent.click(suggestBtn);
    expect(screen.getByText(/Sugerir Beca Universitaria/i)).toBeInTheDocument();
  });
});
