import { ParsedChat, Message } from '../../types/chat';
import { getSenderColorClass } from '../chat-utils';

export interface ParticipantAnalytics {
  name: string;
  messageCount: number;
  wordCount: number;
  avgWordsPerMessage: number;
  mediaCount: number;
  emojiCount: number;
  conversationsStarted: number;
  percentage: number;
  colorClass: string;
}

export interface DayOfWeekActivity {
  dayName: string;
  count: number;
  percentage: number;
}

export interface HourlyActivity {
  hour: number;
  label: string;
  count: number;
  percentage: number;
}

export interface MonthlyActivity {
  monthKey: string;
  label: string;
  count: number;
}

export interface EmojiStat {
  emoji: string;
  count: number;
  percentage: number;
}

export interface WordStat {
  word: string;
  count: number;
}

export interface ChatAnalyticsData {
  totalMessages: number;
  totalWords: number;
  totalMedia: number;
  activeDaysCount: number;
  totalDaysSpan: number;
  avgMessagesPerActiveDay: number;
  longestStreakDays: number;
  longestStreakRange?: string;
  longestSilenceDays: number;
  longestSilenceRange?: string;
  participants: ParticipantAnalytics[];
  hourlyActivity: HourlyActivity[];
  busiestHour: { hour: number; label: string; count: number };
  dayOfWeekActivity: DayOfWeekActivity[];
  busiestDay: { dayName: string; count: number };
  monthlyActivity: MonthlyActivity[];
  topEmojis: EmojiStat[];
  topWords: WordStat[];
}

const COMMON_STOPWORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he',
  'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
  'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our',
  'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most',
  'us', 'are', 'was', 'were', 'been', 'has', 'had', 'is', 'am', 'did', 'done', 'yes', 'yeah', 'okay',
  'ok', 'omitted', 'attached', 'media', 'image', 'video', 'audio', 'document', 'sticker', 'message',
  'deleted', 'this', 'that', 'please', 'thanks', 'thank', 'sure', 'fine', 'hi', 'hello', 'hey', 'lol',
  'haha', 'hahaha', 'k', 'kk', 'alright', 'already', 'cant', 'cannot', 'dont', 'wont', 'didnt', 'isnt',
  'im', 'ive', 'ill', 'youre', 'weve', 'theyre', 'thats', 'whats', 'heres', 'theres'
]);

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

/**
 * Analyzes conversation messages to produce deep client-side analytics.
 */
export function analyzeChat(chat: ParsedChat): ChatAnalyticsData {
  const messages = chat.messages.filter((m) => !m.isSystemMessage && m.type !== 'system');
  const totalMessages = messages.length;

  if (totalMessages === 0) {
    return {
      totalMessages: 0,
      totalWords: 0,
      totalMedia: 0,
      activeDaysCount: 0,
      totalDaysSpan: 0,
      avgMessagesPerActiveDay: 0,
      longestStreakDays: 0,
      longestSilenceDays: 0,
      participants: [],
      hourlyActivity: Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        label: formatHourLabel(h),
        count: 0,
        percentage: 0,
      })),
      busiestHour: { hour: 0, label: '12 AM', count: 0 },
      dayOfWeekActivity: DAYS_OF_WEEK.map((dayName) => ({ dayName, count: 0, percentage: 0 })),
      busiestDay: { dayName: 'Sun', count: 0 },
      monthlyActivity: [],
      topEmojis: [],
      topWords: [],
    };
  }

  // 1. Participant metrics
  const participantMap = new Map<string, {
    messageCount: number;
    wordCount: number;
    mediaCount: number;
    emojiCount: number;
    conversationsStarted: number;
  }>();

  // 2. Activity metrics
  const hourlyCounts = new Array(24).fill(0);
  const dayOfWeekCounts = new Array(7).fill(0);
  const monthlyCounts = new Map<string, number>();
  const activeDatesSet = new Set<string>();

  // 3. Emojis and Words
  const emojiMap = new Map<string, number>();
  const wordMap = new Map<string, number>();
  const emojiRegex = /\p{Extended_Pictographic}/gu;

  let totalWords = 0;
  let totalMedia = 0;
  let lastTimestamp = 0;
  const SESSION_GAP_MS = 6 * 60 * 60 * 1000; // 6 hours

  for (const msg of messages) {
    const sender = msg.senderName || 'Unknown';
    if (!participantMap.has(sender)) {
      participantMap.set(sender, {
        messageCount: 0,
        wordCount: 0,
        mediaCount: 0,
        emojiCount: 0,
        conversationsStarted: 0,
      });
    }
    const pData = participantMap.get(sender)!;
    pData.messageCount++;

    // Media counting
    const hasMedia = msg.attachments && msg.attachments.length > 0;
    if (hasMedia) {
      const mediaCount = msg.attachments.length;
      pData.mediaCount += mediaCount;
      totalMedia += mediaCount;
    }

    // Text & Word counting
    if (msg.text) {
      const text = msg.text.trim();
      const words = text.toLowerCase().match(/\b[\p{L}\p{N}']+\b/gu) || [];
      const wordCount = words.length;
      pData.wordCount += wordCount;
      totalWords += wordCount;

      for (const w of words) {
        const clean = w.replace(/^'+|'+$/g, '');
        if (clean.length >= 3 && !COMMON_STOPWORDS.has(clean) && isNaN(Number(clean))) {
          wordMap.set(clean, (wordMap.get(clean) || 0) + 1);
        }
      }

      // Emojis
      const matchedEmojis = text.match(emojiRegex);
      if (matchedEmojis) {
        for (const emoji of matchedEmojis) {
          // Exclude numeric symbols, asterisks, hashes
          if (!/[0-9*#]/u.test(emoji)) {
            pData.emojiCount++;
            emojiMap.set(emoji, (emojiMap.get(emoji) || 0) + 1);
          }
        }
      }
    }

    // Timestamp & Date analysis
    const dateObj = new Date(msg.timestamp);
    if (!isNaN(dateObj.getTime())) {
      const timeMs = dateObj.getTime();
      const hour = dateObj.getHours();
      const day = dateObj.getDay();
      hourlyCounts[hour]++;
      dayOfWeekCounts[day]++;

      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      activeDatesSet.add(dateKey);

      const monthKey = `${yyyy}-${mm}`;
      monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) || 0) + 1);

      // Session start detection (if previous message was > 6 hours ago or first message)
      if (lastTimestamp === 0 || timeMs - lastTimestamp > SESSION_GAP_MS) {
        pData.conversationsStarted++;
      }
      lastTimestamp = timeMs;
    }
  }

  // Calculate streaks and silence
  const sortedDates = Array.from(activeDatesSet).sort();
  let longestStreakDays = sortedDates.length > 0 ? 1 : 0;
  let currentStreak = 1;
  let longestStreakStart = sortedDates[0];
  let longestStreakEnd = sortedDates[0];
  let currentStreakStart = sortedDates[0];

  let longestSilenceDays = 0;
  let longestSilenceStart: string | undefined;
  let longestSilenceEnd: string | undefined;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > longestStreakDays) {
        longestStreakDays = currentStreak;
        longestStreakStart = currentStreakStart;
        longestStreakEnd = sortedDates[i];
      }
    } else {
      currentStreak = 1;
      currentStreakStart = sortedDates[i];

      const silenceGap = diffDays - 1;
      if (silenceGap > longestSilenceDays) {
        longestSilenceDays = silenceGap;
        longestSilenceStart = sortedDates[i - 1];
        longestSilenceEnd = sortedDates[i];
      }
    }
  }

  // Days span calculation
  let totalDaysSpan = 1;
  if (sortedDates.length >= 2) {
    const first = new Date(sortedDates[0]);
    const last = new Date(sortedDates[sortedDates.length - 1]);
    totalDaysSpan = Math.max(1, Math.round((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }

  const activeDaysCount = sortedDates.length;
  const avgMessagesPerActiveDay = activeDaysCount > 0 ? Math.round(totalMessages / activeDaysCount) : 0;

  // Participant list formatting
  const participants: ParticipantAnalytics[] = Array.from(participantMap.entries())
    .map(([name, data]) => ({
      name,
      messageCount: data.messageCount,
      wordCount: data.wordCount,
      avgWordsPerMessage: data.messageCount > 0 ? Math.round(data.wordCount / data.messageCount) : 0,
      mediaCount: data.mediaCount,
      emojiCount: data.emojiCount,
      conversationsStarted: data.conversationsStarted,
      percentage: Math.round((data.messageCount / totalMessages) * 100),
      colorClass: getSenderColorClass(name),
    }))
    .sort((a, b) => b.messageCount - a.messageCount);

  // Hourly Activity
  let maxHourCount = 0;
  let busiestHourIdx = 0;
  const hourlyActivity: HourlyActivity[] = hourlyCounts.map((count, hour) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      busiestHourIdx = hour;
    }
    return {
      hour,
      label: formatHourLabel(hour),
      count,
      percentage: totalMessages > 0 ? Math.round((count / totalMessages) * 100) : 0,
    };
  });

  const busiestHour = {
    hour: busiestHourIdx,
    label: formatHourLabel(busiestHourIdx),
    count: maxHourCount,
  };

  // Day of Week Activity
  let maxDayCount = 0;
  let busiestDayIdx = 0;
  const dayOfWeekActivity: DayOfWeekActivity[] = DAYS_OF_WEEK.map((dayName, idx) => {
    const count = dayOfWeekCounts[idx];
    if (count > maxDayCount) {
      maxDayCount = count;
      busiestDayIdx = idx;
    }
    return {
      dayName,
      count,
      percentage: totalMessages > 0 ? Math.round((count / totalMessages) * 100) : 0,
    };
  });

  const busiestDay = {
    dayName: DAYS_OF_WEEK[busiestDayIdx],
    count: maxDayCount,
  };

  // Monthly Activity Timeline
  const monthlyActivity: MonthlyActivity[] = Array.from(monthlyCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, count]) => {
      const [y, m] = monthKey.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      const label = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      return { monthKey, label, count };
    });

  // Top Emojis
  const totalEmojiOccurrences = Array.from(emojiMap.values()).reduce((sum, c) => sum + c, 0);
  const topEmojis: EmojiStat[] = Array.from(emojiMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([emoji, count]) => ({
      emoji,
      count,
      percentage: totalEmojiOccurrences > 0 ? Math.round((count / totalEmojiOccurrences) * 100) : 0,
    }));

  // Top Words
  const topWords: WordStat[] = Array.from(wordMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));

  // Helper date format for ranges
  const formatDateRangeStr = (start?: string, end?: string) => {
    if (!start || !end) return undefined;
    if (start === end) return start;
    return `${start} to ${end}`;
  };

  return {
    totalMessages,
    totalWords,
    totalMedia,
    activeDaysCount,
    totalDaysSpan,
    avgMessagesPerActiveDay,
    longestStreakDays,
    longestStreakRange: formatDateRangeStr(longestStreakStart, longestStreakEnd),
    longestSilenceDays,
    longestSilenceRange: formatDateRangeStr(longestSilenceStart, longestSilenceEnd),
    participants,
    hourlyActivity,
    busiestHour,
    dayOfWeekActivity,
    busiestDay,
    monthlyActivity,
    topEmojis,
    topWords,
  };
}
