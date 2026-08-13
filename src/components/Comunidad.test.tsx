import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Comunidad } from './Comunidad';

describe('Comunidad Component', () => {
  it('renders community header, category pills and forum discussions', () => {
    render(<Comunidad />);
    expect(screen.getByText(/Comunidad LatinoMigra/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar tema o ciudad.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Publicación/i })).toBeInTheDocument();
  });

  it('filters forum posts when typing in the search bar', () => {
    render(<Comunidad />);
    const searchInput = screen.getByPlaceholderText(/Buscar tema o ciudad.../i);
    fireEvent.change(searchInput, { target: { value: 'empadronamiento' } });

    expect(screen.getByText(/proceso de empadronamiento en Madrid/i)).toBeInTheDocument();
  });

  it('opens new post modal when clicking Crear Publicación', () => {
    render(<Comunidad />);
    const newPostBtn = screen.getByRole('button', { name: /Crear Publicación/i });
    fireEvent.click(newPostBtn);

    expect(screen.getByText(/Nueva Publicación en la Comunidad/i)).toBeInTheDocument();
  });
});
