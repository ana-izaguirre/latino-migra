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

  it('renders pagination controls and navigates between pages', () => {
    render(<BecasExplorer {...defaultProps} />);
    
    // Page 1 should be active initially with 6 cards displayed
    const page1Btn = screen.getByRole('button', { name: '1' });
    expect(page1Btn).toHaveAttribute('aria-current', 'page');

    // Check next page button
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).toBeInTheDocument();
    expect(nextBtn).not.toBeDisabled();

    // Click next page
    fireEvent.click(nextBtn);
    const page2Btn = screen.getByRole('button', { name: '2' });
    expect(page2Btn).toHaveAttribute('aria-current', 'page');
  });

  it('supports lazy loading / carga diferida mode and loading more items', () => {
    render(<BecasExplorer {...defaultProps} />);
    
    // Switch to Carga Diferida mode
    const lazyModeBtn = screen.getByRole('button', { name: /Carga Diferida/i });
    fireEvent.click(lazyModeBtn);

    // Look for the "Cargar Más Convocatorias" button
    const loadMoreBtn = screen.getByRole('button', { name: /Cargar Más Convocatorias/i });
    expect(loadMoreBtn).toBeInTheDocument();

    // Click load more
    fireEvent.click(loadMoreBtn);
    expect(screen.getByText(/Progreso de carga/i)).toBeInTheDocument();
  });

  it('changes items per page when selecting size option', () => {
    const { container } = render(<BecasExplorer {...defaultProps} />);
    
    // Click on "Todas" items per page button by ID
    const allBtn = container.querySelector('#items-per-page-all');
    expect(allBtn).toBeInTheDocument();
    if (allBtn) {
      fireEvent.click(allBtn);
    }

    expect(screen.getByText(/Mostrando todas las/i)).toBeInTheDocument();
  });

  it('toggles favorites, saves to localStorage and filters by My Favorites section', () => {
    localStorage.clear();
    const { container } = render(<BecasExplorer {...defaultProps} />);

    // Click on the "Mis Becas Favoritas" tab
    const favTab = screen.getByRole('button', { name: /Mis Becas Favoritas/i });
    expect(favTab).toBeInTheDocument();
    fireEvent.click(favTab);

    // Check favorites banner is displayed
    expect(screen.getByText(/Sección: Mis Becas Guardadas/i)).toBeInTheDocument();

    // Switch back to all
    const allTab = screen.getByRole('button', { name: /Todas las Convocatorias/i });
    fireEvent.click(allTab);

    // Find favorite button on a card and click it
    const favButtons = container.querySelectorAll('button[title*="favoritos"], button[title*="beca"]');
    if (favButtons.length > 0) {
      fireEvent.click(favButtons[0]);
    }

    // Verify localStorage has been updated
    const saved = localStorage.getItem('latinomigra_favorite_scholarships');
    expect(saved).not.toBeNull();
  });
});

