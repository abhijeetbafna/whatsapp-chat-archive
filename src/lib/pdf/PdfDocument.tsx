import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image, Svg, Path, Rect, Circle, Polyline, Line } from '@react-pdf/renderer';
import { ParsedChat, Message } from '../../types/chat';
import { ExportOptions } from '../../components/export/ExportModal';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

// Emoji setup
Font.register({
  family: 'Noto Sans Devanagari',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-devanagari@latest/latin-400-normal.ttf' },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-devanagari@latest/devanagari-400-normal.ttf' }
  ]
});

Font.registerEmojiSource({
  format: 'png',
  url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/',
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Roboto',
    fontSize: 10,
    backgroundColor: '#efeae2',
    color: '#333333',
    lineHeight: 1.4,
  },
  coverPage: {
    padding: 40,
    fontFamily: 'Roboto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 20,
  },
  coverSection: {
    marginTop: 20,
    marginBottom: 5,
  },
  coverLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  coverValue: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  dateSeparatorContainer: {
    marginTop: 15,
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dateSeparatorText: {
    fontSize: 10,
    fontWeight: 500,
    color: '#475569',
    backgroundColor: '#ffffff',
    padding: '4 8',
    borderRadius: 6,
  },
  messageRow: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 4,
    width: '100%',
  },
  messageRowIncoming: {
    justifyContent: 'flex-start',
  },
  messageRowOutgoing: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '6 8',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  bubbleIncoming: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 2,
  },
  bubbleOutgoing: {
    backgroundColor: '#d9fdd3',
    borderTopRightRadius: 2,
  },
  senderName: {
    fontWeight: 700,
    fontSize: 10,
    marginBottom: 2,
    color: '#0f172a',
  },
  messageText: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Noto Sans Devanagari',
  },
  messageTextDeleted: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Roboto',
    fontStyle: 'italic',
    color: '#667781',
  },
  footerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    color: '#667781',
    fontSize: 8,
  },
  editedTag: {
    fontSize: 8,
    color: '#8696a0',
    fontStyle: 'italic',
    marginRight: 4,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    color: '#475569',
    fontSize: 9,
    marginBottom: 8,
    textAlign: 'center',
  },
  attachmentCard: {
    marginTop: 4,
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  attachmentTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#334155',
  },
  attachmentSubtitle: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 1,
  },
  imageAttachment: {
    maxWidth: 240,
    maxHeight: 300,
    borderRadius: 8,
    marginVertical: 4,
    objectFit: 'contain',
  },
});

interface PdfDocumentProps {
  chat: ParsedChat;
  options: ExportOptions;
  filteredMessages: Message[];
}

const PdfMediaCard = ({ type, fileName, isMissing }: { type: string; fileName: string; isMissing: boolean }) => {
  let bgColor = '#f1f5f9';
  let iconColor = '#64748b';
  let icon = null;
  let label = 'File';
  let title = fileName || 'Unknown File';

  if (type === 'video') {
    bgColor = '#eef2ff';
    iconColor = '#6366f1';
    label = 'Video';
    icon = (
      <Svg viewBox="0 0 24 24" width={14} height={14}>
        <Path d="M23 7l-7 5 7 5V7z" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="1" y="5" width="15" height="14" rx="2" ry="2" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  } else if (type === 'audio') {
    bgColor = '#fffbeb';
    iconColor = '#d97706';
    label = 'Voice Note';
    title = fileName || 'Voice Note';
    icon = (
      <Svg viewBox="0 0 24 24" width={14} height={14}>
        <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Line x1="12" y1="19" x2="12" y2="22" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Line x1="8" y1="22" x2="16" y2="22" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  } else if (type === 'document') {
    bgColor = '#eff6ff';
    iconColor = '#2563eb';
    label = 'Document';
    title = fileName || 'Document';
    icon = (
      <Svg viewBox="0 0 24 24" width={14} height={14}>
        <Path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Polyline points="14 2 14 8 20 8" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Line x1="16" y1="13" x2="8" y2="13" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Line x1="16" y1="17" x2="8" y2="17" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Line x1="10" y1="9" x2="8" y2="9" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  } else {
    bgColor = '#f1f5f9';
    iconColor = '#475569';
    label = type ? type.toUpperCase() : 'FILE';
    icon = (
      <Svg viewBox="0 0 24 24" width={14} height={14}>
        <Path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  return (
    <View style={{
      marginTop: 4,
      marginBottom: 2,
      padding: 6,
      backgroundColor: bgColor,
      borderRadius: 6,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <View style={{
        width: 22,
        height: 22,
        borderRadius: 4,
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
      }}>
        {icon}
      </View>
      <View style={{ display: 'flex', flexDirection: 'column' }}>
        <Text style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>{title}</Text>
        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>
          {isMissing ? 'Media omitted in export' : label}
        </Text>
      </View>
    </View>
  );
};

export function PdfDocument({ chat, options, filteredMessages }: PdfDocumentProps) {
  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  
  filteredMessages.forEach((msg) => {
    const d = new Date(msg.timestamp);
    // Use local date string
    const dateStr = d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!groupedMessages[dateStr]) {
      groupedMessages[dateStr] = [];
    }
    groupedMessages[dateStr].push(msg);
  });

  const title = chat.title || 'WhatsApp Conversation';
  const mySenderName = chat.participants.length === 2 ? chat.participants[1]?.name : null;
  const showSenderName = chat.participants.length > 2;

  return (
    <Document title={`Archive - ${title}`}>
      {options.includeConversationInfo && (
        <Page size="A4" style={styles.coverPage}>
          <Text style={styles.coverTitle}>Conversation Archive</Text>
          
          <View style={styles.coverSection}>
            <Text style={styles.coverLabel}>Conversation</Text>
            <Text style={styles.coverValue}>{title}</Text>
          </View>
          
          <View style={styles.coverSection}>
            <Text style={styles.coverLabel}>Participants</Text>
            <Text style={styles.coverValue}>
              {chat.participants.map(p => p.name).join(', ')}
            </Text>
          </View>
          
          <View style={styles.coverSection}>
            <Text style={styles.coverLabel}>Date Range</Text>
            <Text style={styles.coverValue}>
              {options.dateRange === 'all' 
                ? 'Entire Conversation' 
                : `${options.fromDate} to ${options.toDate}`}
            </Text>
          </View>
          
          <View style={styles.coverSection}>
            <Text style={styles.coverLabel}>Exported Messages</Text>
            <Text style={styles.coverValue}>{filteredMessages.length.toLocaleString()}</Text>
          </View>

          <View style={styles.coverSection}>
            <Text style={styles.coverLabel}>Debug Attachments (Dev Only)</Text>
            <Text style={styles.coverValue}>{filteredMessages.reduce((sum, msg) => sum + (msg.attachments?.length || 0), 0)}</Text>
          </View>
          
          <View style={[styles.coverSection, { marginTop: 40 }]}>
            <Text style={styles.coverLabel}>Export Date</Text>
            <Text style={styles.coverValue}>{new Date().toLocaleDateString()}</Text>
          </View>
        </Page>
      )}

      <Page size="A4" style={styles.page}>
        {Object.entries(groupedMessages).map(([date, messages]) => (
          <View key={date}>
            <View style={styles.dateSeparatorContainer} wrap={false}>
              <Text style={styles.dateSeparatorText}>{date}</Text>
            </View>
            
            {messages.map((msg, idx) => {
              if (msg.isSystemMessage || msg.type === 'system') {
                return (
                  <Text key={msg.id || idx} style={styles.systemMessage} wrap={false}>
                    {msg.text}
                  </Text>
                );
              }

              const timeStr = new Date(msg.timestamp).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
              });

              const isOutgoing = Boolean(mySenderName && msg.senderName && msg.senderName === mySenderName);

              return (
                <View key={msg.id || idx} style={[styles.messageRow, isOutgoing ? styles.messageRowOutgoing : styles.messageRowIncoming]} wrap={false}>
                  <View style={[styles.messageBubble, isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming]}>
                    {showSenderName && !isOutgoing && msg.senderName && (
                      <Text style={styles.senderName}>{msg.senderName}</Text>
                    )}
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <View style={{ marginTop: 4, marginBottom: 4 }}>
                        {msg.attachments.map((att, aIdx) => {
                          const typeLabel = att.type ? att.type.toUpperCase() : 'ATTACHMENT';
                          const isValidBase64Image = att.mediaUrl && 
                                                     (att.mediaUrl.startsWith('data:image/jpeg') || 
                                                      att.mediaUrl.startsWith('data:image/png'));
                          
                          if (att.type === 'image' && options.includeImages && isValidBase64Image) {
                            return (
                              <View key={aIdx}>
                                <Image src={att.mediaUrl} style={styles.imageAttachment} />
                              </View>
                            );
                          }

                          return (
                            <View key={aIdx}>
                               <PdfMediaCard 
                                 type={att.type || 'file'} 
                                 fileName={att.fileName || ''} 
                                 isMissing={att.mediaStatus === 'missing'} 
                               />
                            </View>
                          );
                        })}
                      </View>
                    )}
                    
                    {msg.text && (
                      <Text style={msg.isDeleted ? styles.messageTextDeleted : styles.messageText}>
                        {msg.isDeleted ? `🚫 ${msg.text}` : msg.text}
                      </Text>
                    )}
                    
                    <View style={styles.footerContainer}>
                      {msg.isEdited && (
                        <Text style={styles.editedTag}>Edited</Text>
                      )}
                      <Text style={styles.timestamp}>{timeStr}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </Page>
    </Document>
  );
}
