import { describe, it, expect } from 'vitest';
import { parseWhatsAppChat } from '../whatsapp-parser';
import { ImportedMediaFile } from '../../../types';

describe('parseWhatsAppChat', () => {
  it('should parse basic messages', () => {
    const text = `12/06/2026, 10:32 - John: Hello\n12/06/2026, 10:33 - Jane: Hi`;
    const result = parseWhatsAppChat(text);
    
    expect(result.messageCount).toBe(2);
    expect(result.participants.length).toBe(2);
    expect(result.messages[0].senderName).toBe('John');
    expect(result.messages[0].text).toBe('Hello');
    expect(result.messages[1].senderName).toBe('Jane');
    expect(result.messages[1].text).toBe('Hi');
  });

  it('should handle multiline messages', () => {
    const text = `12/06/2026, 10:32 - John: Hello\n\nThis is a longer message\nthat continues over several lines.\n12/06/2026, 10:33 - Jane: Hi`;
    const result = parseWhatsAppChat(text);
    
    expect(result.messageCount).toBe(2);
    expect(result.messages[0].text).toContain('This is a longer message');
    expect(result.messages[0].text).toContain('continues over several lines.');
    expect(result.messages[1].text).toBe('Hi');
  });

  it('should parse system messages correctly and ignore empty/punctuation lines', () => {
    const text = `12/06/2026, 10:32 - Messages and calls are end-to-end encrypted.\n12/06/2026, 10:33 - John added Jane\n12/06/2026, 10:34 - _`;
    const result = parseWhatsAppChat(text);
    
    // The '_' line with no content should be filtered out
    expect(result.messageCount).toBe(2);
    expect(result.messages[0].isSystemMessage).toBe(true);
    expect(result.messages[0].type).toBe('system');
    expect(result.messages[0].senderName).toBeUndefined();
    expect(result.messages[1].isSystemMessage).toBe(true);
  });

  it('should support different timestamp formats and strip invisible LRM markers', () => {
    const text1 = `\u200E[12/06/26, 10:32:00 AM] Jane Doe: Hi`;
    const result1 = parseWhatsAppChat(text1);
    expect(result1.messageCount).toBe(1);
    expect(result1.messages[0].senderName).toBe('Jane Doe');
    
    const text2 = `12/06/2026, 10:32 - John: Hello`;
    const result2 = parseWhatsAppChat(text2);
    expect(result2.messageCount).toBe(1);
    expect(result2.messages[0].senderName).toBe('John');
  });

  it('should handle Unicode and emojis in names and messages', () => {
    const text = `12/06/2026, 10:35 - राहुल 😊: नमस्ते 🙏`;
    const result = parseWhatsAppChat(text);
    
    expect(result.messageCount).toBe(1);
    expect(result.messages[0].senderName).toBe('राहुल 😊');
    expect(result.messages[0].text).toBe('नमस्ते 🙏');
  });

  it('should preserve URLs in messages', () => {
    const text = `12/06/2026, 10:32 - John: Check this out https://example.com/test?q=1`;
    const result = parseWhatsAppChat(text);
    
    expect(result.messages[0].text).toBe('Check this out https://example.com/test?q=1');
  });

  it('should identify media attachments and link with media files from ZIP', () => {
    const text = `12/06/2026, 10:32 - John: \u200EIMG-20260612-WA0001.jpg (file attached)\n12/06/2026, 10:33 - Jane: <attached: 00000002-AUDIO.opus>\n12/06/2026, 10:34 - John: <Media omitted>`;
    
    const mediaFiles: ImportedMediaFile[] = [
      {
        fileName: 'IMG-20260612-WA0001.jpg',
        path: 'IMG-20260612-WA0001.jpg',
        size: 2048,
        mimeType: 'image/jpeg',
        type: 'image',
      },
      {
        fileName: '00000002-AUDIO.opus',
        path: '00000002-AUDIO.opus',
        size: 5120,
        mimeType: 'audio/opus',
        type: 'audio',
      },
    ];

    const result = parseWhatsAppChat(text, 'chat-1', mediaFiles);
    
    expect(result.messageCount).toBe(3);
    expect(result.messages[0].type).toBe('image');
    expect(result.messages[0].attachments[0].fileName).toBe('IMG-20260612-WA0001.jpg');
    expect(result.messages[0].attachments[0].mediaSize).toBe(2048);
    expect(result.messages[0].attachments[0].mediaStatus).toBe('available');

    expect(result.messages[1].type).toBe('audio');
    expect(result.messages[1].attachments[0].fileName).toBe('00000002-AUDIO.opus');
    expect(result.messages[1].attachments[0].mediaStatus).toBe('available');

    expect(result.messages[2].type).toBe('unknown');
    expect(result.messages[2].attachments[0].mediaStatus).toBe('missing');
  });

  it('should extract media captions', () => {
    const text = `12/06/2026, 10:32 - John: IMG-20260612-WA0001.jpg (file attached) Look at this sunset!`;
    const result = parseWhatsAppChat(text);
    
    expect(result.messages[0].type).toBe('mixed');
    expect(result.messages[0].attachments[0].fileName).toBe('IMG-20260612-WA0001.jpg');
    expect(result.messages[0].text).toBe('Look at this sunset!');
  });

  it('should handle empty files gracefully', () => {
    const text = `   \n\n  `;
    const result = parseWhatsAppChat(text);
    
    expect(result.messageCount).toBe(0);
    expect(result.participants.length).toBe(0);
  });

  it('should gracefully handle unrecognised lines at the start', () => {
    const text = `Some random text\nthat is not a message\n12/06/2026, 10:32 - John: Hello`;
    const result = parseWhatsAppChat(text);
    
    expect(result.messageCount).toBe(1);
    expect(result.unrecognizedLines).toBe(2);
  });

  it('should sort messages chronologically if dates are parsable', () => {
    const text = `2026-06-12, 10:35 - John: Second\n2026-06-12, 10:32 - John: First`;
    const result = parseWhatsAppChat(text);
    
    expect(result.messages[0].text).toBe('First');
    expect(result.messages[1].text).toBe('Second');
  });

  it('should not drop text when multiple media files share the same timestamp', () => {
    const text = `18/09/2026, 07:22 - Alice: IMG-20260917-WA0003.jpg (file attached)
Good morning! Here are the design files and screenshots from yesterday's review.

Please take a look when you get a chance and let me know your thoughts.

Have a great weekend ahead!
18/09/2026, 07:22 - Alice: IMG-20260918-WA0001.jpg (file attached)
18/09/2026, 07:22 - Alice: IMG-20260918-WA0000.jpg (file attached)
18/09/2026, 07:22 - Alice: VID-20260918-WA0003.mp4 (file attached)
18/09/2026, 07:22 - Alice: IMG-20260918-WA0002.jpg (file attached)`;

    const result = parseWhatsAppChat(text);

    // It should merge them all into a single message
    expect(result.messageCount).toBe(1);
    const msg = result.messages[0];
    
    expect(msg.type).toBe('mixed');
    expect(msg.attachments.length).toBe(5);
    expect(msg.text).toContain("Good morning! Here are the design files");
    expect(msg.text).toContain("Have a great weekend ahead!");
  });
});
