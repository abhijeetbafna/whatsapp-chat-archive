# WhatsApp ChatBook

A fast, private, client-side web application that transforms exported WhatsApp chats (`.zip` or `.txt`) into structured, readable, and searchable conversations in a familiar messaging interface.

---

## Key Features

- **100% Client-Side & Private**: All extraction, parsing, media decoding, search, and storage occur strictly within your browser via standard Web APIs and IndexedDB. No backend servers, no cloud storage, and zero telemetry.
- **Robust Export Parser**: Supports both Android (`DD/MM/YYYY, HH:MM - ...`) and iOS (`[DD/MM/YYYY, HH:MM:SS] ...`) export formats, multiline messages, emojis, URLs, and system events.
- **WhatsApp-Style Chat Viewer**:
  - Distinct message bubbles with customizable "Me" orientation selector.
  - Group participant attribution badges.
  - Human-friendly calendar date dividers (`Today`, `Yesterday`, `15 July 2026`).
  - Safe, clickable external hyperlinks.
  - Virtualized message rendering for responsive performance on large conversations (50,000+ messages).
- **Starred Messages & Bookmarks**: Star important messages and filter them instantly.
- **Voice Note Player**: Interactive Web Audio API waveform visualization with 1x, 1.5x, 2x playback speed controls.
- **Analytics & Insights**: Interactive dashboard displaying activity heatmaps, conversation streaks, monthly volume timelines, top emojis, and word frequencies.
- **Standalone Offline HTML Export**: Export full chats to single-file `.html` documents with embedded base64 media for standalone offline reading.
- **Progressive Web App (PWA)**: Install directly on desktop or mobile for instant 100% offline access.
- **Rich Media & Lightbox**:
  - In-browser image lightbox with keyboard shortcuts.
  - Native video and audio playback.
  - Document attachments with format and size details.
  - Album grouping with captions.
- **Full-Text Search & Jump Navigation**:
  - Instant client-side search across message text, senders, and attachment filenames.
  - Date-grouped search results with exact message jumping and highlight flashes.
- **Multi-Export Archive Merge**:
  - Select two or more exports to combine into a unified chronological conversation.
  - Compatibility analyzer with participant overlap and date range checking.
  - Deterministic duplicate detection ensuring unique messages are never lost.
  - Non-destructive: source archives remain intact.
- **Archive Library & Persistence**:
  - IndexedDB storage for offline access without re-uploading.
  - Storage quota monitor.
  - In-place archive renaming and safe deletion.
- **Portable Backup & Restore**:
  - Export archives to portable `.zip` backup bundles containing metadata, message databases, and media assets.
  - Safe restoration with collision detection (`Restore as Copy`, `Replace Existing`).
- **PDF Export**:
  - Generate formatted PDF documents with conversation timestamps, media, captions, and full Unicode/Devanagari script support.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19, Lucide React, Framer Motion
- **Styling**: Tailwind CSS
- **ZIP Engine**: JSZip
- **PDF Compilation**: `@react-pdf/renderer`
- **Persistence**: IndexedDB (Native Web API)
- **Testing**: Vitest, React Testing Library, JSDOM

---

## Getting Started

### Prerequisites

- Node.js 18.17+ or 20+
- npm, pnpm, or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/abhijeetbafna/whatsapp-chatbook.git

# Navigate into directory
cd whatsapp-chatbook

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Running Tests

```bash
npm test
```

### Production Build

```bash
npm run build
npm start
```

---

## Usage Guide

1. **Export Chat from WhatsApp**: In WhatsApp, open any chat $\rightarrow$ tap Menu (`⋮`) $\rightarrow$ **More** $\rightarrow$ **Export chat** (with or without media).
2. **Import**: On the app's Import page, upload the `.zip` or `.txt` file.
3. **Explore**:
   - Open the **Chat Viewer** to read the conversation.
   - Use the **Search** icon to find messages instantly.
   - Check **Conversation Info** for participant metrics and shared media.
   - Click **Export PDF** to create a printable PDF transcript.
4. **Library & Merging**:
   - Access saved chats under the **Library** tab.
   - Select multiple archives to merge them into a consolidated chronological record.

---

## License

MIT License.
