import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioVoiceNotePlayer } from '../AudioVoiceNotePlayer';

describe('AudioVoiceNotePlayer Suite', () => {
  beforeEach(() => {
    // Mock HTMLMediaElement methods in jsdom
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('Test 1 — Renders voice note player controls and waveform', () => {
    render(
      <AudioVoiceNotePlayer
        mediaUrl="blob:http://localhost:3000/audio-123"
        fileName="PTT-20260401-WA0002.opus"
        mediaSize={65400}
      />
    );

    // Filename should be displayed
    expect(screen.getByText('PTT-20260401-WA0002.opus')).toBeInTheDocument();
    // Play button should be present
    expect(screen.getByRole('button', { name: /play voice note/i })).toBeInTheDocument();
    // Initial 1x speed pill
    expect(screen.getByRole('button', { name: /playback speed: 1x/i })).toBeInTheDocument();
    // Waveform container
    expect(screen.getByTitle(/click or drag to seek/i)).toBeInTheDocument();
  });

  it('Test 2 — Toggles play and pause on user click', () => {
    render(
      <AudioVoiceNotePlayer
        mediaUrl="blob:http://localhost:3000/audio-123"
        fileName="Voice Note"
      />
    );

    const playBtn = screen.getByRole('button', { name: /play voice note/i });
    fireEvent.click(playBtn);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('Test 3 — Cycles playback rate across 1x, 1.5x, and 2x', () => {
    render(
      <AudioVoiceNotePlayer
        mediaUrl="blob:http://localhost:3000/audio-123"
        fileName="Voice Note"
      />
    );

    const speedBtn = screen.getByRole('button', { name: /playback speed: 1x/i });
    expect(speedBtn).toHaveTextContent('1x');

    // Click to switch to 1.5x
    fireEvent.click(speedBtn);
    expect(screen.getByRole('button', { name: /playback speed: 1.5x/i })).toHaveTextContent('1.5x');

    // Click to switch to 2x
    fireEvent.click(speedBtn);
    expect(screen.getByRole('button', { name: /playback speed: 2x/i })).toHaveTextContent('2x');

    // Click to loop back to 1x
    fireEvent.click(speedBtn);
    expect(screen.getByRole('button', { name: /playback speed: 1x/i })).toHaveTextContent('1x');
  });

  it('Test 4 — Displays caption when provided', () => {
    render(
      <AudioVoiceNotePlayer
        mediaUrl="blob:http://localhost:3000/audio-123"
        fileName="Voice Note"
        caption="Please listen to the customer briefing"
      />
    );

    expect(screen.getByText('Please listen to the customer briefing')).toBeInTheDocument();
  });
});
