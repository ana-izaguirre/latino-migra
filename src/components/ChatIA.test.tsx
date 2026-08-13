import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatIA } from './ChatIA';

describe('ChatIA Component', () => {
  it('renders AI assistant header, chat history and input field', () => {
    render(<ChatIA />);
    expect(screen.getByText(/Nueva Consulta/i)).toBeInTheDocument();
    expect(screen.getAllByText(/LatinoMigra IA/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Pregunta sobre visas, requisitos o becas específicas.../i)).toBeInTheDocument();
    expect(screen.getByText(/¿Cuáles son los requisitos clave para la visa de estudiante de España desde Colombia\?/i)).toBeInTheDocument();
  });

  it('updates text input when user types a custom question', () => {
    render(<ChatIA />);
    const input = screen.getByPlaceholderText(/Pregunta sobre visas, requisitos o becas específicas.../i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '¿Cómo obtengo la visa para Alemania?' } });
    expect(input.value).toBe('¿Cómo obtengo la visa para Alemania?');
  });

  it('allows starting a new conversation', () => {
    render(<ChatIA />);
    const newChatBtn = screen.getByText(/Nueva Consulta/i);
    fireEvent.click(newChatBtn);
    expect(screen.getByText(/¿Cómo puedo ayudarte hoy\?/i)).toBeInTheDocument();
  });
});
