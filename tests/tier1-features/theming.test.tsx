import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../src/App';

describe('Tier 1 — Dark / Light Theming System', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    localStorage.setItem('hettety_consent', JSON.stringify({ necessary: true }));
  });

  it('toggles dark mode on, adding .dark class to documentElement and updating localStorage', async () => {
    vi.useFakeTimers();
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    vi.useRealTimers();

    const themeToggleBtn = await screen.findByRole('button', { name: /Toggle Theme/i });
    expect(themeToggleBtn).toBeInTheDocument();

    // Initial state: light mode (no dark class on documentElement)
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Toggle theme to Dark
    fireEvent.click(themeToggleBtn);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggles dark mode off, removing .dark class and saving light to localStorage', async () => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');

    vi.useFakeTimers();
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    vi.useRealTimers();

    const themeToggleBtn = await screen.findByRole('button', { name: /Toggle Theme/i });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Click to toggle back to Light
    fireEvent.click(themeToggleBtn);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('initializes dark mode on mount if localStorage already has theme=dark', async () => {
    localStorage.setItem('theme', 'dark');

    vi.useFakeTimers();
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    vi.useRealTimers();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('initializes light mode on mount if localStorage already has theme=light', async () => {
    localStorage.setItem('theme', 'light');

    vi.useFakeTimers();
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    vi.useRealTimers();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('respects system prefers-color-scheme media query when localStorage is empty', async () => {
    // Mock system preference for dark mode
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    vi.useFakeTimers();
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    vi.useRealTimers();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
