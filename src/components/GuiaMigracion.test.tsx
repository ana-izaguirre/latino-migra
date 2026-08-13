import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuiaMigracion } from './GuiaMigracion';

describe('GuiaMigracion Component', () => {
  const defaultProps = {
    setActiveTab: vi.fn(),
    onAskAIAboutGuide: vi.fn(),
  };

  it('renders migration guides header and country selection tabs', () => {
    render(<GuiaMigracion {...defaultProps} />);
    expect(screen.getByText(/Guías Oficiales Paso a Paso/i)).toBeInTheDocument();
    expect(screen.getAllByText(/España/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Alemania/i)).toBeInTheDocument();
  });

  it('changes country guide when clicking on a different country button', () => {
    render(<GuiaMigracion {...defaultProps} />);
    
    const germanyBtn = screen.getByRole('button', { name: /Alemania/i });
    fireEvent.click(germanyBtn);

    expect(screen.getByText(/Tipos de Visado en Alemania/i)).toBeInTheDocument();
  });

  it('allows clicking on checklist documents to toggle status', () => {
    render(<GuiaMigracion {...defaultProps} />);
    
    expect(screen.getByText(/Documentación Clave Requerida/i)).toBeInTheDocument();
    const docItem = screen.getByText(/Pasaporte Vigente/i);
    expect(docItem).toBeInTheDocument();
    fireEvent.click(docItem);
  });

  it('calls onAskAIAboutGuide when clicking Ask AI button in guide', () => {
    render(<GuiaMigracion {...defaultProps} />);
    const askAiBtn = screen.getByRole('button', { name: /Preguntar a IA cuál me conviene/i });
    fireEvent.click(askAiBtn);
    expect(defaultProps.onAskAIAboutGuide).toHaveBeenCalledWith('España');
  });
});
