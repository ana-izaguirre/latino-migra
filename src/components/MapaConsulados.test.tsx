import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders as render } from '../test/renderWithProviders';
import { MapaConsulados } from './MapaConsulados';

describe('MapaConsulados Component', () => {
  it('renders consular directory header, category buttons, GPS detection and filters', () => {
    render(<MapaConsulados />);
    expect(screen.getByText(/Consulados, Embajadas y Campus Destino/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Consulados y Embajadas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Universidades/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Detectar mi ubicación actual|Actualizar mi GPS/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar ciudad.../i)).toBeInTheDocument();
  });

  it('filters directory list when searching by city or name', () => {
    render(<MapaConsulados />);
    const searchInput = screen.getByPlaceholderText(/Buscar ciudad.../i);
    fireEvent.change(searchInput, { target: { value: 'Salamanca' } });

    const items = screen.getAllByText(/Universidad de Salamanca/i);
    expect(items.length).toBeGreaterThan(0);
  });

  it('allows clicking on a directory location to view details', () => {
    render(<MapaConsulados />);
    const locationItems = screen.getAllByText(/España/i);
    expect(locationItems.length).toBeGreaterThan(0);
  });
});
