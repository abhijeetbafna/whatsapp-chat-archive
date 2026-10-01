import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PwaRegister } from '../PwaRegister';
import manifest from '../../app/manifest';

describe('PWA Offline & Installation Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1 — Manifest configuration contains valid PWA specification', () => {
    const data = manifest();

    expect(data.name).toBe('WhatsApp Chat Archive & Viewer');
    expect(data.short_name).toBe('Chat Archive');
    expect(data.display).toBe('standalone');
    expect(data.start_url).toBe('/');
    expect(data.background_color).toBe('#0c1317');
    expect(data.theme_color).toBe('#00a884');
    expect(data.icons && data.icons.length > 0).toBe(true);
  });

  it('Test 2 — Shows install banner when beforeinstallprompt event fires', async () => {
    render(<PwaRegister />);

    // Initially install banner should be hidden
    expect(screen.queryByText(/Install Chat Archive/i)).not.toBeInTheDocument();

    // Trigger beforeinstallprompt event
    const promptEvent = new Event('beforeinstallprompt') as any;
    promptEvent.prompt = vi.fn().mockResolvedValue(undefined);
    promptEvent.userChoice = Promise.resolve({ outcome: 'accepted' });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    // Now install banner should be visible
    expect(screen.getByText(/Install Chat Archive/i)).toBeInTheDocument();
    expect(screen.getByText(/Use offline like a desktop app/i)).toBeInTheDocument();

    // Clicking Install triggers prompt
    const installBtn = screen.getByRole('button', { name: /^install$/i });
    await act(async () => {
      fireEvent.click(installBtn);
    });
    expect(promptEvent.prompt).toHaveBeenCalled();
  });

  it('Test 3 — Dismisses install banner when X button is clicked', () => {
    render(<PwaRegister />);

    const promptEvent = new Event('beforeinstallprompt') as any;
    promptEvent.prompt = vi.fn().mockResolvedValue(undefined);
    promptEvent.userChoice = Promise.resolve({ outcome: 'dismissed' });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    expect(screen.getByText(/Install Chat Archive/i)).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /dismiss install banner/i });
    act(() => {
      fireEvent.click(dismissBtn);
    });

    expect(screen.queryByText(/Install Chat Archive/i)).not.toBeInTheDocument();
  });
});
