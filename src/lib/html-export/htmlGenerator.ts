import { ParsedChat, Message } from '../../types/chat';
import { ExportOptions } from '../../components/export/ExportModal';
import { filterMessagesByDate } from '../pdf/pdfGenerator';
import { formatMessageTime } from '../chat-utils';

function escapeHtml(str: string = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSafeHtmlFilename(title?: string | null): string {
  if (!title) return 'whatsapp-chat-archive.html';
  const sanitized = title.replace(/[<>:"/\\|?*]/g, '').trim();
  if (sanitized.length === 0) return 'whatsapp-chat-archive.html';
  return `${sanitized.toLowerCase().replace(/\s+/g, '-')}-offline-archive.html`;
}

const blobToBase64 = async (blobUrl: string): Promise<string> => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
};

/**
 * Generates an interactive, standalone single-file HTML document.
 */
export async function generateHtmlArchive(chat: ParsedChat, options: ExportOptions): Promise<void> {
  const filteredMessages = filterMessagesByDate(chat.messages, options);

  if (filteredMessages.length === 0) {
    throw new Error(
      options.starredOnly
        ? 'No starred messages found in the selected range to export.'
        : 'No messages found in the selected date range.'
    );
  }

  // Pre-process image attachments to base64 data URLs for offline portability
  const processedMessages: Message[] = await Promise.all(
    filteredMessages.map(async (msg) => {
      if (!options.includeImages || !msg.attachments || msg.attachments.length === 0) {
        return msg;
      }
      const newAttachments = await Promise.all(
        msg.attachments.map(async (att) => {
          if (att.mediaUrl && att.mediaUrl.startsWith('blob:') && (att.type === 'image' || att.type === 'sticker')) {
            const base64 = await blobToBase64(att.mediaUrl);
            return {
              ...att,
              mediaUrl: base64 || undefined,
            };
          }
          return att;
        })
      );
      return { ...msg, attachments: newAttachments };
    })
  );

  const title = chat.title || 'WhatsApp Conversation Archive';
  const participantsList = chat.participants.map((p) => p.name).join(', ');
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Group messages by date
  const dateGroups: { [dateStr: string]: Message[] } = {};
  for (const msg of processedMessages) {
    const dateObj = new Date(msg.timestamp);
    const dateStr = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Unknown Date';
    if (!dateGroups[dateStr]) {
      dateGroups[dateStr] = [];
    }
    dateGroups[dateStr].push(msg);
  }

  // Determine second participant as 'outgoing' if 2 participants
  const defaultMe = chat.participants.length === 2 ? chat.participants[1]?.name : null;

  // Build HTML document string
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Offline Archive</title>
  <style>
    :root {
      --bg-page: #efeae2;
      --bg-header: #f0f2f5;
      --bg-bubble-in: #ffffff;
      --bg-bubble-out: #d9fdd3;
      --text-primary: #111b21;
      --text-secondary: #667781;
      --border-color: #e9edef;
      --accent-color: #00a884;
      --system-bg: #ffeecd;
      --system-text: #54656f;
      --star-color: #f59e0b;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    html.dark {
      --bg-page: #0b141a;
      --bg-header: #202c33;
      --bg-bubble-in: #202c33;
      --bg-bubble-out: #005c4b;
      --text-primary: #e9edef;
      --text-secondary: #8696a0;
      --border-color: #222e35;
      --accent-color: #00a884;
      --system-bg: #182229;
      --system-text: #ffd279;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family);
      background-color: var(--bg-page);
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    header {
      background-color: var(--bg-header);
      border-bottom: 1px solid var(--border-color);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      z-index: 10;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .header-info { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .header-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #00a884, #005c4b);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 18px; shrink: 0;
    }
    .header-text h1 { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .header-text p { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .header-actions { display: flex; align-items: center; gap: 8px; shrink: 0; }
    .search-input {
      padding: 6px 12px; border-radius: 20px; border: 1px solid var(--border-color);
      background: var(--bg-bubble-in); color: var(--text-primary); font-size: 13px; outline: none;
      width: 140px; transition: width 0.2s;
    }
    .search-input:focus { width: 220px; border-color: var(--accent-color); }
    .btn {
      padding: 6px 12px; border-radius: 20px; border: 1px solid var(--border-color);
      background: var(--bg-bubble-in); color: var(--text-primary); font-size: 12px; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s;
    }
    .btn:hover { opacity: 0.9; }

    #chat-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background-image: radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px);
      background-size: 16px 16px;
    }
    html.dark #chat-container {
      background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
    }

    .date-separator {
      align-self: center;
      margin: 12px 0 6px 0;
      background: var(--bg-bubble-in);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 11.5px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 8px;
      box-shadow: 0 1px 1px rgba(0,0,0,0.05);
    }

    .system-msg {
      align-self: center;
      margin: 4px 0;
      background: var(--system-bg);
      color: var(--system-text);
      font-size: 12px;
      padding: 5px 14px;
      border-radius: 8px;
      max-width: 80%;
      text-align: center;
      box-shadow: 0 1px 1px rgba(0,0,0,0.05);
    }

    .msg-row { display: flex; width: 100%; margin: 2px 0; }
    .msg-row.out { justify-content: flex-end; }
    .msg-row.in { justify-content: flex-start; }

    .bubble {
      max-width: 72%;
      padding: 6px 10px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
      position: relative;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .msg-row.out .bubble {
      background-color: var(--bg-bubble-out);
      border-top-right-radius: 2px;
    }
    .msg-row.in .bubble {
      background-color: var(--bg-bubble-in);
      border-top-left-radius: 2px;
    }

    .sender-name { font-size: 12px; font-weight: 700; color: #1f6feb; margin-bottom: 2px; }
    .meta-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 4px;
      font-size: 10.5px;
      color: var(--text-secondary);
      user-select: none;
    }
    .star-icon { color: var(--star-color); font-size: 11px; }

    .attachment-img {
      max-width: 100%;
      max-height: 320px;
      border-radius: 8px;
      margin-bottom: 4px;
      cursor: pointer;
      display: block;
    }
    .attachment-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0,0,0,0.05);
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 4px;
    }
    html.dark .attachment-badge { background: rgba(255,255,255,0.08); }

    /* Lightbox */
    #lightbox {
      position: fixed; inset: 0; background: rgba(0,0,0,0.9);
      display: none; align-items: center; justify-content: center; z-index: 100;
    }
    #lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 8px; }
  </style>
</head>
<body>
  <header>
    <div class="header-info">
      <div class="header-avatar">${escapeHtml(title.charAt(0).toUpperCase())}</div>
      <div class="header-text">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(participantsList)} • ${processedMessages.length.toLocaleString()} messages</p>
      </div>
    </div>
    <div class="header-actions">
      <input type="text" id="search" class="search-input" placeholder="Search in chat..." oninput="handleSearch(this.value)">
      <button class="btn" onclick="toggleTheme()" id="theme-btn">🌓 Dark Mode</button>
    </div>
  </header>

  <div id="chat-container">
    ${options.includeConversationInfo ? `
      <div class="system-msg" style="margin-bottom: 12px;">
        <strong>Conversation Archive</strong><br>
        Exported on ${escapeHtml(generatedDate)} • ${processedMessages.length.toLocaleString()} messages preserved
      </div>
    ` : ''}

    ${Object.entries(dateGroups)
      .map(([dateStr, msgs]) => {
        return `
          <div class="date-separator">${escapeHtml(dateStr)}</div>
          ${msgs
            .map((msg) => {
              if (msg.isSystemMessage || msg.type === 'system') {
                return `<div class="system-msg">${escapeHtml(msg.text || msg.rawText || '')}</div>`;
              }

              const isOut = Boolean(defaultMe && msg.senderName === defaultMe);
              const attachments = msg.attachments || [];

              let attachmentHtml = '';
              for (const att of attachments) {
                if (att.mediaUrl && (att.type === 'image' || att.type === 'sticker')) {
                  attachmentHtml += `<img src="${att.mediaUrl}" class="attachment-img" onclick="openLightbox(this.src)" alt="${escapeHtml(att.fileName || 'Photo')}" loading="lazy">`;
                } else {
                  attachmentHtml += `
                    <div class="attachment-badge">
                      <span>📁</span>
                      <span>${escapeHtml(att.fileName || att.type.toUpperCase())}</span>
                    </div>
                  `;
                }
              }

              return `
                <div class="msg-row ${isOut ? 'out' : 'in'}" data-text="${escapeHtml((msg.text || '').toLowerCase())}">
                  <div class="bubble">
                    ${!isOut && msg.senderName ? `<div class="sender-name">${escapeHtml(msg.senderName)}</div>` : ''}
                    ${attachmentHtml}
                    ${msg.text ? `<div>${escapeHtml(msg.text)}</div>` : ''}
                    <div class="meta-row">
                      ${msg.isStarred ? '<span class="star-icon">★</span>' : ''}
                      ${msg.isEdited ? '<span style="font-style:italic;">edited</span>' : ''}
                      <span>${escapeHtml(formatMessageTime(msg.timestamp))}</span>
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')}
        `;
      })
      .join('')}
  </div>

  <div id="lightbox" onclick="closeLightbox()">
    <img id="lightbox-img" src="" alt="Full view">
  </div>

  <script>
    function toggleTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      document.getElementById('theme-btn').textContent = isDark ? '☀️ Light Mode' : '🌓 Dark Mode';
    }

    function handleSearch(query) {
      const q = query.trim().toLowerCase();
      const rows = document.querySelectorAll('.msg-row');
      rows.forEach(row => {
        if (!q) {
          row.style.display = '';
        } else {
          const text = row.getAttribute('data-text') || '';
          row.style.display = text.includes(q) ? '' : 'none';
        }
      });
    }

    function openLightbox(src) {
      const lb = document.getElementById('lightbox');
      const img = document.getElementById('lightbox-img');
      img.src = src;
      lb.style.display = 'flex';
    }

    function closeLightbox() {
      document.getElementById('lightbox').style.display = 'none';
    }
  </script>
</body>
</html>`;

  // Trigger browser download of the standalone HTML file
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = getSafeHtmlFilename(chat.title);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
