import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArchiveLibrary } from '../ArchiveLibrary';
import { YourArchivesSection } from '../YourArchivesSection';
import * as storage from '../../../lib/storage';
import { ChatArchiveMetadata } from '../../../types/storage';

describe('Archive Library & Landing UI Suite', () => {
  const dummyArchives: ChatArchiveMetadata[] = [
    {
      id: 'archive-1',
      title: 'Alex & Friends',
      fingerprint: 'fp_1',
      participants: [{ id: 'Alex', name: 'Alex', messageCount: 100 }],
      startDate: '2026-09-18T10:00:00Z',
      endDate: '2026-09-25T10:00:00Z',
      messageCount: 12481,
      mediaCount: 643,
      documentCount: 12,
      linkCount: 30,
      links: [],
      createdAt: '2026-09-25T10:00:00Z',
      importedAt: '2026-09-25T10:00:00Z',
      updatedAt: '2026-09-25T10:00:00Z',
      source: {
        type: 'whatsapp-export',
        originalFileName: 'WhatsApp Chat - Alex.zip',
      },
    },
    {
      id: 'archive-2',
      title: 'Family Group',
      fingerprint: 'fp_2',
      participants: [{ id: 'Mom', name: 'Mom', messageCount: 50 }],
      startDate: '2026-01-01T10:00:00Z',
      endDate: '2026-09-20T10:00:00Z',
      messageCount: 38291,
      mediaCount: 2184,
      documentCount: 45,
      linkCount: 110,
      links: [],
      createdAt: '2026-09-20T10:00:00Z',
      importedAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
      source: {
        type: 'whatsapp-export',
        originalFileName: 'Family.zip',
      },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1 — Renders empty state when no archives exist in local storage', async () => {
    vi.spyOn(storage, 'getArchiveList').mockResolvedValue([]);
    vi.spyOn(storage, 'getStorageEstimate').mockResolvedValue(null);

    render(<ArchiveLibrary onOpenArchive={vi.fn()} />);

    expect(await screen.findByText('No archives yet')).toBeInTheDocument();
    expect(screen.getByText(/Import a WhatsApp export/i)).toBeInTheDocument();
  });

  it('Test 2 — Displays saved archives with counts, date ranges, and open button', async () => {
    vi.spyOn(storage, 'getArchiveList').mockResolvedValue(dummyArchives);
    vi.spyOn(storage, 'getStorageEstimate').mockResolvedValue({
      usageBytes: 25000000,
      quotaBytes: 1000000000,
      usageFormatted: '25 MB',
      quotaFormatted: '1 GB',
      percentageUsed: 2.5,
    });

    const handleOpen = vi.fn();
    render(<ArchiveLibrary onOpenArchive={handleOpen} />);

    expect(await screen.findByText('Alex & Friends')).toBeInTheDocument();
    expect(screen.getByText('Family Group')).toBeInTheDocument();
    expect(screen.getByText('12,481 msgs')).toBeInTheDocument();
    expect(screen.getByText('643 media')).toBeInTheDocument();

    const openButtons = screen.getAllByRole('button', { name: 'Open' });
    fireEvent.click(openButtons[0]);
    expect(handleOpen).toHaveBeenCalledWith('archive-1');
  });

  it('Test 3 — Filters archives in library by search query', async () => {
    vi.spyOn(storage, 'getArchiveList').mockResolvedValue(dummyArchives);
    render(<ArchiveLibrary onOpenArchive={vi.fn()} />);

    await screen.findByText('Alex & Friends');
    const searchInput = screen.getByPlaceholderText(/Search archives/i);
    fireEvent.change(searchInput, { target: { value: 'Family' } });

    expect(screen.queryByText('Alex & Friends')).not.toBeInTheDocument();
    expect(screen.getByText('Family Group')).toBeInTheDocument();
  });

  it('Test 4 — Opens delete confirmation dialog with explicit warning', async () => {
    vi.spyOn(storage, 'getArchiveList').mockResolvedValue(dummyArchives);
    render(<ArchiveLibrary onOpenArchive={vi.fn()} />);

    await screen.findByText('Alex & Friends');
    const deleteButtons = screen.getAllByTitle('Delete archive from storage');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/Delete archive\?/i)).toBeInTheDocument();
    expect(screen.getByText(/This will permanently remove/i)).toBeInTheDocument();
    expect(screen.getByText('Delete Archive')).toBeInTheDocument();
  });

  it('Test 5 — Landing page YourArchivesSection displays archives or empty prompt', async () => {
    vi.spyOn(storage, 'getArchiveList').mockResolvedValue(dummyArchives);
    render(<YourArchivesSection />);

    expect(await screen.findByText('Your Archives')).toBeInTheDocument();
    expect(screen.getByText('Alex & Friends')).toBeInTheDocument();
  });
});
