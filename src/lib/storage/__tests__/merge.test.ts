import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveArchive,
  getArchiveList,
  loadFullChat,
  deleteAppDatabase,
  closeDb,
  mergeArchives,
  computeMergePreview,
  assessCompatibility,
  createArchiveBackupZip,
  restoreArchiveFromBackup,
} from '../index';
import { ParsedChat, Message } from '../../../types/chat';
import { ImportedMediaFile } from '../../../types';
import { searchChat } from '../../search/search';

describe('Multiple WhatsApp Export Merge Suite', () => {
  beforeEach(async () => {
    await deleteAppDatabase();
  });

  afterEach(async () => {
    closeDb();
    await deleteAppDatabase();
  });

  // Helper to create synthetic chat
  const createMockArchive = (
    chatId: string,
    title: string,
    messages: Message[],
    media: ImportedMediaFile[] = []
  ): { chat: ParsedChat; media: ImportedMediaFile[] } => {
    const participantsMap = new Map<string, number>();
    for (const msg of messages) {
      if (!msg.isSystemMessage && msg.senderName) {
        participantsMap.set(msg.senderName, (participantsMap.get(msg.senderName) || 0) + 1);
      }
    }

    const participants = Array.from(participantsMap.entries()).map(([name, count]) => ({
      id: name,
      name,
      messageCount: count,
    }));

    const chat: ParsedChat = {
      chatId,
      title,
      participants,
      messages,
      links: [],
      startDate: messages.length > 0 ? messages[0].timestamp : undefined,
      endDate: messages.length > 0 ? messages[messages.length - 1].timestamp : undefined,
      messageCount: messages.length,
      mediaCount: media.length,
      unrecognizedLines: 0,
    };

    return { chat, media };
  };

  it('Test 1 — Merges non-overlapping archives into unified chronological conversation', async () => {
    // Archive A: 01-05 June
    const msgsA: Message[] = [
      {
        id: 'msg-a1',
        chatId: 'arch-a',
        timestamp: '2026-06-01T10:00:00.000Z',
        senderName: 'Sarah',
        text: 'Hello from early June!',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
      {
        id: 'msg-a2',
        chatId: 'arch-a',
        timestamp: '2026-06-05T12:00:00.000Z',
        senderName: 'David',
        text: 'Plans for the weekend?',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
    ];

    // Archive B: 10-15 June
    const msgsB: Message[] = [
      {
        id: 'msg-b1',
        chatId: 'arch-b',
        timestamp: '2026-06-10T09:00:00.000Z',
        senderName: 'Sarah',
        text: 'The trip was great!',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
      {
        id: 'msg-b2',
        chatId: 'arch-b',
        timestamp: '2026-06-15T18:00:00.000Z',
        senderName: 'David',
        text: 'Let us meet next week.',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
    ];

    const { chat: chatA } = createMockArchive('arch-a', 'Sarah — Phone A', msgsA);
    const { chat: chatB } = createMockArchive('arch-b', 'Sarah — Phone B', msgsB);

    await saveArchive(chatA, 'sarah_a.zip');
    await saveArchive(chatB, 'sarah_b.zip');

    // Run merge
    const mergedMeta = await mergeArchives(['arch-a', 'arch-b']);

    expect(mergedMeta.messageCount).toBe(4);
    expect(mergedMeta.title).toContain('Sarah');
    expect(mergedMeta.source.type).toBe('merged-archive');
    expect(mergedMeta.source.sourceArchives).toEqual(['arch-a', 'arch-b']);

    // Verify chronological order and stable IDs
    const loaded = await loadFullChat(mergedMeta.id);
    expect(loaded).not.toBeNull();
    const loadedMsgs = loaded!.chat.messages;

    expect(loadedMsgs).toHaveLength(4);
    expect(loadedMsgs[0].text).toBe('Hello from early June!');
    expect(loadedMsgs[1].text).toBe('Plans for the weekend?');
    expect(loadedMsgs[2].text).toBe('The trip was great!');
    expect(loadedMsgs[3].text).toBe('Let us meet next week.');

    // Provenance tracked
    expect(loadedMsgs[0].sourceArchiveId).toBe('arch-a');
    expect(loadedMsgs[0].sourceMessageId).toBe('msg-a1');
    expect(loadedMsgs[2].sourceArchiveId).toBe('arch-b');
    expect(loadedMsgs[2].sourceMessageId).toBe('msg-b1');
  });

  it('Test 2 — Deduplicates high-confidence overlapping messages while preserving unique ones', async () => {
    // Both archives contain overlapping message at 12:00
    const sharedMsgTimestamp = '2026-06-10T12:00:00.000Z';

    const msgsA: Message[] = [
      {
        id: 'a1',
        chatId: 'arch-1',
        timestamp: '2026-06-10T11:00:00.000Z',
        senderName: 'Sarah',
        text: 'Message unique to A',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
      {
        id: 'a2',
        chatId: 'arch-1',
        timestamp: sharedMsgTimestamp,
        senderName: 'David',
        text: 'Duplicate overlapping message',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
    ];

    const msgsB: Message[] = [
      {
        id: 'b1',
        chatId: 'arch-2',
        timestamp: sharedMsgTimestamp,
        senderName: 'David',
        text: 'Duplicate overlapping message',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
      {
        id: 'b2',
        chatId: 'arch-2',
        timestamp: '2026-06-10T13:00:00.000Z',
        senderName: 'Sarah',
        text: 'Message unique to B',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
    ];

    const { chat: chatA } = createMockArchive('arch-1', 'Sarah A', msgsA);
    const { chat: chatB } = createMockArchive('arch-2', 'Sarah B', msgsB);

    await saveArchive(chatA, 'sarah_1.zip');
    await saveArchive(chatB, 'sarah_2.zip');

    // Test preview calculation
    const preview = await computeMergePreview(['arch-1', 'arch-2']);
    expect(preview.totalOriginalMessages).toBe(4);
    expect(preview.duplicateCount).toBe(1);
    expect(preview.totalUniqueMessages).toBe(3);

    // Merge
    const merged = await mergeArchives(['arch-1', 'arch-2']);
    expect(merged.messageCount).toBe(3);

    const loaded = await loadFullChat(merged.id);
    const texts = loaded!.chat.messages.map((m) => m.text);
    expect(texts).toEqual([
      'Message unique to A',
      'Duplicate overlapping message',
      'Message unique to B',
    ]);
  });

  it('Test 3 — Preserves different messages having the exact same timestamp (deterministic tie-breaking)', async () => {
    const sameTime = '2026-07-01T15:00:00.000Z';

    const msgsA: Message[] = [
      {
        id: 't-a',
        chatId: 'arch-time-a',
        timestamp: sameTime,
        senderName: 'Alice',
        text: 'Sent at 15:00 from phone 1',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
    ];

    const msgsB: Message[] = [
      {
        id: 't-b',
        chatId: 'arch-time-b',
        timestamp: sameTime,
        senderName: 'Bob',
        text: 'Sent at 15:00 from phone 2',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
    ];

    const { chat: cA } = createMockArchive('arch-time-a', 'Alice & Bob 1', msgsA);
    const { chat: cB } = createMockArchive('arch-time-b', 'Alice & Bob 2', msgsB);

    await saveArchive(cA, 'ab1.zip');
    await saveArchive(cB, 'ab2.zip');

    const merged = await mergeArchives(['arch-time-a', 'arch-time-b']);
    expect(merged.messageCount).toBe(2);

    const loaded = await loadFullChat(merged.id);
    expect(loaded!.chat.messages).toHaveLength(2);
    // Preserves both messages without discarding
    expect(loaded!.chat.messages[0].text).toBe('Sent at 15:00 from phone 1');
    expect(loaded!.chat.messages[1].text).toBe('Sent at 15:00 from phone 2');
  });

  it('Test 4 — Preserves multiline, edited, deleted, and system message states across merge', async () => {
    const msgs: Message[] = [
      {
        id: 'sys-1',
        chatId: 'arch-special',
        timestamp: '2026-08-01T10:00:00.000Z',
        text: 'Messages and calls are end-to-end encrypted.',
        type: 'system',
        attachments: [],
        isSystemMessage: true,
      },
      {
        id: 'multiline-1',
        chatId: 'arch-special',
        timestamp: '2026-08-01T10:01:00.000Z',
        senderName: 'Rahul',
        text: 'Line 1\nLine 2\nLine 3 with unicode: नमस्कार 😊',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
      {
        id: 'edited-1',
        chatId: 'arch-special',
        timestamp: '2026-08-01T10:02:00.000Z',
        senderName: 'Rahul',
        text: 'I updated this text',
        type: 'text',
        attachments: [],
        isEdited: true,
        isSystemMessage: false,
      },
      {
        id: 'del-1',
        chatId: 'arch-special',
        timestamp: '2026-08-01T10:03:00.000Z',
        senderName: 'Rahul',
        text: 'This message was deleted',
        type: 'text',
        attachments: [],
        isDeleted: true,
        isSystemMessage: false,
      },
    ];

    const { chat: c1 } = createMockArchive('arch-spec-1', 'Special Chat 1', msgs);
    const { chat: c2 } = createMockArchive('arch-spec-2', 'Special Chat 2', [
      {
        id: 'after-1',
        chatId: 'arch-spec-2',
        timestamp: '2026-08-01T10:04:00.000Z',
        senderName: 'Rahul',
        text: 'Normal message after',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
    ]);

    await saveArchive(c1, 'spec1.zip');
    await saveArchive(c2, 'spec2.zip');

    const merged = await mergeArchives(['arch-spec-1', 'arch-spec-2']);
    const loaded = await loadFullChat(merged.id);
    const mergedList = loaded!.chat.messages;

    expect(mergedList).toHaveLength(5);
    expect(mergedList[0].isSystemMessage).toBe(true);
    expect(mergedList[1].text).toContain('Line 1\nLine 2\nLine 3');
    expect(mergedList[1].text).toContain('नमस्कार 😊');
    expect(mergedList[2].isEdited).toBe(true);
    expect(mergedList[3].isDeleted).toBe(true);
  });

  it('Test 5 — Reconciles participants and deduplicates shared media attachments', async () => {
    const dummyBlob = new Blob(['sample photo content'], { type: 'image/jpeg' });
    const media: ImportedMediaFile[] = [
      {
        fileName: 'shared_trip.jpg',
        path: 'shared_trip.jpg',
        size: dummyBlob.size,
        mimeType: 'image/jpeg',
        type: 'image',
        blob: dummyBlob,
      },
    ];

    const msgsA: Message[] = [
      {
        id: 'm-att-a',
        chatId: 'media-a',
        timestamp: '2026-09-01T10:00:00.000Z',
        senderName: 'Alice',
        text: 'Check this photo',
        type: 'image',
        attachments: [{ type: 'image', fileName: 'shared_trip.jpg', mediaStatus: 'available' }],
        isSystemMessage: false,
      },
    ];

    const msgsB: Message[] = [
      {
        id: 'm-att-b',
        chatId: 'media-b',
        timestamp: '2026-09-01T11:00:00.000Z',
        senderName: 'Alice',
        text: 'Another message from Alice',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
    ];

    const { chat: cA, media: medA } = createMockArchive('media-a', 'Alice Vacation 1', msgsA, media);
    const { chat: cB } = createMockArchive('media-b', 'Alice Vacation 2', msgsB);

    await saveArchive(cA, 'media_a.zip', medA);
    await saveArchive(cB, 'media_b.zip');

    const merged = await mergeArchives(['media-a', 'media-b']);
    expect(merged.mediaCount).toBe(1);
    expect(merged.participants).toHaveLength(1);
    expect(merged.participants[0].name).toBe('Alice');
    expect(merged.participants[0].messageCount).toBe(2);

    const loaded = await loadFullChat(merged.id);
    expect(loaded!.chat.messages[0].attachments[0].mediaUrl).toBeDefined();
    expect(loaded!.chat.messages[0].attachments[0].mediaStatus).toBe('available');
  });

  it('Test 6 — Source archives are NEVER modified or deleted after merge (Requirement 35)', async () => {
    const msgsA = [
      {
        id: 'orig-a',
        chatId: 'source-a',
        timestamp: '2026-09-01T10:00:00.000Z',
        senderName: 'Alice',
        text: 'Original A',
        type: 'text' as const,
        attachments: [],
        isSystemMessage: false,
      },
    ];
    const msgsB = [
      {
        id: 'orig-b',
        chatId: 'source-b',
        timestamp: '2026-09-01T11:00:00.000Z',
        senderName: 'Bob',
        text: 'Original B',
        type: 'text' as const,
        attachments: [],
        isSystemMessage: false,
      },
    ];

    const { chat: cA } = createMockArchive('source-a', 'Source A', msgsA);
    const { chat: cB } = createMockArchive('source-b', 'Source B', msgsB);

    await saveArchive(cA, 'sourceA.zip');
    await saveArchive(cB, 'sourceB.zip');

    const listBefore = await getArchiveList();
    expect(listBefore).toHaveLength(2);

    // Merge
    const merged = await mergeArchives(['source-a', 'source-b']);

    // List now has 3 archives
    const listAfter = await getArchiveList();
    expect(listAfter).toHaveLength(3);

    // Verify source A is unchanged
    const sourceALoaded = await loadFullChat('source-a');
    expect(sourceALoaded).not.toBeNull();
    expect(sourceALoaded!.chat.messages).toHaveLength(1);
    expect(sourceALoaded!.chat.messages[0].id).toBe('orig-a');

    // Verify source B is unchanged
    const sourceBLoaded = await loadFullChat('source-b');
    expect(sourceBLoaded).not.toBeNull();
    expect(sourceBLoaded!.chat.messages).toHaveLength(1);
    expect(sourceBLoaded!.chat.messages[0].id).toBe('orig-b');
  });

  it('Test 7 — Compatibility assessment warns when archives appear completely unrelated', () => {
    const arch1: any = {
      id: '1',
      title: 'Family Group',
      participants: [{ id: 'Mom', name: 'Mom' }, { id: 'Dad', name: 'Dad' }],
      startDate: '2026-01-01',
      endDate: '2026-02-01',
    };

    const arch2: any = {
      id: '2',
      title: 'Work Project XYZ',
      participants: [{ id: 'Boss', name: 'Boss' }, { id: 'Colleague', name: 'Colleague' }],
      startDate: '2026-08-01',
      endDate: '2026-09-01',
    };

    const result = assessCompatibility([arch1, arch2]);
    expect(result.confidence).toBe('low');
    expect(result.isWarning).toBe(true);
    expect(result.reasons.some((r) => r.includes('No shared participant'))).toBe(true);
  });

  it('Test 8 — In-chat search and backup/restore work on the merged archive', async () => {
    const msgsA = [
      {
        id: 's1',
        chatId: 's-a',
        timestamp: '2026-09-10T10:00:00.000Z',
        senderName: 'Alice',
        text: 'The secret keyword is flamingo',
        type: 'text' as const,
        attachments: [],
        isSystemMessage: false,
      },
    ];
    const msgsB = [
      {
        id: 's2',
        chatId: 's-b',
        timestamp: '2026-09-10T11:00:00.000Z',
        senderName: 'Bob',
        text: 'Confirmed flamingo received',
        type: 'text' as const,
        attachments: [],
        isSystemMessage: false,
      },
    ];

    const { chat: cA } = createMockArchive('s-a', 'Search A', msgsA);
    const { chat: cB } = createMockArchive('s-b', 'Search B', msgsB);

    await saveArchive(cA, 'sa.zip');
    await saveArchive(cB, 'sb.zip');

    const merged = await mergeArchives(['s-a', 's-b']);
    const fullChat = await loadFullChat(merged.id);

    // Verify search works on merged conversation
    const searchResults = searchChat(fullChat!.chat, 'flamingo');
    expect(searchResults).toHaveLength(2);
    expect(searchResults[0].messageId).toBe(`${merged.id}_m1`);
    expect(searchResults[1].messageId).toBe(`${merged.id}_m2`);

    // Verify backup export & restore works on merged conversation
    const backupBlob = await createArchiveBackupZip(merged.id);
    expect(backupBlob.size).toBeGreaterThan(0);

    const restoreResult = await restoreArchiveFromBackup(backupBlob, { mode: 'copy' });
    expect(restoreResult.actionTaken).toBe('copied');
    expect(restoreResult.restoredArchive.messageCount).toBe(2);
  });
});
