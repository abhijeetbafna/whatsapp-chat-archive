import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveArchive,
  getArchiveList,
  getArchiveMetadata,
  getArchiveAttachments,
  loadFullChat,
  renameArchive,
  deleteArchive,
  checkDuplicateArchive,
  createArchiveBackupZip,
  restoreArchiveFromBackup,
  deleteAppDatabase,
  closeDb,
} from '../index';
import { ParsedChat, Message } from '../../../types/chat';
import { ImportedMediaFile } from '../../../types';

describe('Local Archive Storage Suite', () => {
  beforeEach(async () => {
    await deleteAppDatabase();
  });

  afterEach(async () => {
    closeDb();
    await deleteAppDatabase();
  });

  const createSyntheticChat = (chatId: string = 'chat_test_1'): { chat: ParsedChat; media: ImportedMediaFile[] } => {
    const messages: Message[] = [
      {
        id: `${chatId}-1`,
        chatId,
        timestamp: '2026-09-18T10:00:00Z',
        senderName: 'Alice',
        text: 'Hey Bob, how are you?',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
      {
        id: `${chatId}-2`,
        chatId,
        timestamp: '2026-09-18T10:01:00Z',
        senderName: 'Bob',
        text: 'I am good Alice! Check this photo out.',
        type: 'image',
        attachments: [
          {
            type: 'image',
            fileName: 'vacation.jpg',
            mediaStatus: 'available',
          },
        ],
        isSystemMessage: false,
      },
      {
        id: `${chatId}-3`,
        chatId,
        timestamp: '2026-09-18T10:05:00Z',
        senderName: 'Alice',
        text: 'Awesome picture! Here is the schedule: https://example.com/plan',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
    ];

    const chat: ParsedChat = {
      chatId,
      title: 'Alice & Bob Chat',
      participants: [
        { id: 'Alice', name: 'Alice', messageCount: 2 },
        { id: 'Bob', name: 'Bob', messageCount: 1 },
      ],
      messages,
      links: [
        {
          url: 'https://example.com/plan',
          messageId: `${chatId}-3`,
          timestamp: '2026-09-18T10:05:00Z',
          senderName: 'Alice',
        },
      ],
      startDate: '2026-09-18T10:00:00Z',
      endDate: '2026-09-18T10:05:00Z',
      messageCount: 3,
      mediaCount: 1,
      unrecognizedLines: 0,
    };

    const dummyBlob = new Blob(['fake image binary content'], { type: 'image/jpeg' });
    const media: ImportedMediaFile[] = [
      {
        fileName: 'vacation.jpg',
        path: 'vacation.jpg',
        size: dummyBlob.size,
        mimeType: 'image/jpeg',
        type: 'image',
        blob: dummyBlob,
      },
    ];

    return { chat, media };
  };

  it('Test 1 — Saves an archive locally and retrieves lightweight metadata list', async () => {
    const { chat, media } = createSyntheticChat('chat_alpha');
    const savedMeta = await saveArchive(chat, 'WhatsApp Chat - Alice.zip', media, 'Alice & Bob');

    expect(savedMeta.id).toBe('chat_alpha');
    expect(savedMeta.title).toBe('Alice & Bob');
    expect(savedMeta.messageCount).toBe(3);
    expect(savedMeta.mediaCount).toBe(1);
    expect(savedMeta.linkCount).toBe(1);

    const list = await getArchiveList();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('chat_alpha');
    expect(list[0].title).toBe('Alice & Bob');
  });

  it('Test 2 — Loads full conversation with stable message IDs and hydrated media URLs', async () => {
    const { chat, media } = createSyntheticChat('chat_beta');
    await saveArchive(chat, 'export.zip', media);

    const loaded = await loadFullChat('chat_beta');
    expect(loaded).not.toBeNull();
    if (!loaded) return;

    expect(loaded.chat.messages).toHaveLength(3);
    // Preserves stable message IDs
    expect(loaded.chat.messages[0].id).toBe('chat_beta-1');
    expect(loaded.chat.messages[1].id).toBe('chat_beta-2');
    expect(loaded.chat.messages[2].id).toBe('chat_beta-3');

    // Media hydration
    const mediaMsg = loaded.chat.messages[1];
    expect(mediaMsg.attachments[0].fileName).toBe('vacation.jpg');
    expect(mediaMsg.attachments[0].mediaUrl).toBeDefined();
    expect(mediaMsg.attachments[0].mediaStatus).toBe('available');

    // Cleanup URLs works
    expect(() => loaded.cleanupUrls()).not.toThrow();
  });

  it('Test 3 — Renames archive metadata without altering messages or attachments', async () => {
    const { chat, media } = createSyntheticChat('chat_gamma');
    await saveArchive(chat, 'export.zip', media, 'Initial Title');

    const renamed = await renameArchive('chat_gamma', 'Renamed Conversation 2026');
    expect(renamed.title).toBe('Renamed Conversation 2026');

    const loaded = await loadFullChat('chat_gamma');
    expect(loaded?.metadata.title).toBe('Renamed Conversation 2026');
    expect(loaded?.chat.messages).toHaveLength(3);
    expect(loaded?.chat.messages[0].senderName).toBe('Alice');
  });

  it('Test 4 — Deletes archive completely with all messages and attachments (no orphans)', async () => {
    const { chat, media } = createSyntheticChat('chat_delta');
    await saveArchive(chat, 'export.zip', media);

    let list = await getArchiveList();
    expect(list).toHaveLength(1);

    await deleteArchive('chat_delta');

    list = await getArchiveList();
    expect(list).toHaveLength(0);

    const loaded = await loadFullChat('chat_delta');
    expect(loaded).toBeNull();
  });

  it('Test 5 — Detects probable duplicate imports via fingerprint', async () => {
    const { chat, media } = createSyntheticChat('chat_epsilon');
    await saveArchive(chat, 'WhatsApp Chat with Alice.txt', media);

    const duplicateMatch = await checkDuplicateArchive(chat, 'WhatsApp Chat with Alice.txt');
    expect(duplicateMatch).not.toBeNull();
    expect(duplicateMatch?.id).toBe('chat_epsilon');
  });

  it('Test 6 — Creates portable backup ZIP and restores into clean storage', async () => {
    const { chat, media } = createSyntheticChat('chat_zeta');
    await saveArchive(chat, 'export.zip', media, 'Zeta Conversation');

    const backupBlob = await createArchiveBackupZip('chat_zeta');
    expect(backupBlob.size).toBeGreaterThan(0);

    // Delete existing archive
    await deleteArchive('chat_zeta');
    expect(await getArchiveList()).toHaveLength(0);

    // Restore from backup
    const result = await restoreArchiveFromBackup(backupBlob);
    expect(result.actionTaken).toBe('created');
    expect(result.restoredArchive.id).toBe('chat_zeta');
    expect(result.restoredArchive.title).toBe('Zeta Conversation');

    // Check restored content
    const restored = await loadFullChat('chat_zeta');
    expect(restored).not.toBeNull();
    expect(restored?.chat.messages).toHaveLength(3);
    expect(restored?.chat.messages[1].attachments[0].mediaUrl).toBeDefined();
  });

  it('Test 7 — Handles backup collisions safely with copy or replace mode', async () => {
    const { chat, media } = createSyntheticChat('chat_eta');
    await saveArchive(chat, 'export.zip', media, 'Original Archive');
    const backupBlob = await createArchiveBackupZip('chat_eta');

    // Default error-if-exists throws error with collision detail
    await expect(restoreArchiveFromBackup(backupBlob, { mode: 'error-if-exists' })).rejects.toThrow(
      'COLLISION:chat_eta:Original Archive'
    );

    // Restore as copy
    const copyResult = await restoreArchiveFromBackup(backupBlob, { mode: 'copy' });
    expect(copyResult.actionTaken).toBe('copied');
    expect(copyResult.restoredArchive.id).not.toBe('chat_eta');
    expect(copyResult.restoredArchive.title).toContain('(Restored Copy)');

    const list = await getArchiveList();
    expect(list).toHaveLength(2); // Original and copy coexist safely!
  });

  it('Test 8 — Rejects invalid or corrupt backup files without modifying database', async () => {
    const corruptBlob = new Blob(['not a valid zip file'], { type: 'application/zip' });
    await expect(restoreArchiveFromBackup(corruptBlob)).rejects.toThrow();

    const emptyZip = new Blob([], { type: 'application/zip' });
    await expect(restoreArchiveFromBackup(emptyZip)).rejects.toThrow();
  });
});
