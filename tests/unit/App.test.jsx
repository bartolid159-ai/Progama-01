import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import App from '../../src/App.jsx';

describe('App Component - Tarea 01', () => {
  afterEach(cleanup);

  it('debe renderizar el título de la aplicación y el Dashboard', () => {
    render(<App />);
    expect(screen.getByText(/Médica/i)).toBeInTheDocument();
    // Dashboard aparece en el sidebar y en el header, usamos getAll y verificamos que existan
    const dashboardElements = screen.getAllByText(/Dashboard/i);
    expect(dashboardElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Ingresos Mensuales/i)).toBeInTheDocument();
  });

  it('debe iniciar en Modo Oscuro por defecto (sin la clase light-mode)', () => {
    render(<App />);
    expect(document.body.classList.contains('light-mode')).toBe(false);
    expect(screen.getByText(/☀️ Modo Claro/i)).toBeInTheDocument();
  });

  it('debe cambiar a Modo Claro al hacer click en el botón de toggle', () => {
    render(<App />);
    const toggleButton = screen.getByRole('button', { name: /Modo Claro/i });
    
    // Cambiar a Modo Claro
    fireEvent.click(toggleButton);
    expect(document.body.classList.contains('light-mode')).toBe(true);
    expect(screen.getByText(/🌙 Modo Oscuro/i)).toBeInTheDocument();

    // Regresar a Modo Oscuro
    fireEvent.click(screen.getByRole('button', { name: /Modo Oscuro/i }));
    expect(document.body.classList.contains('light-mode')).toBe(false);
    expect(screen.getByText(/☀️ Modo Claro/i)).toBeInTheDocument();
  });
});
