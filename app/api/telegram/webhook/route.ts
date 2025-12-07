import { NextRequest, NextResponse } from 'next/server';
import { Update } from 'telegraf/types';
import { getTelegramBot, TelegramMessage } from '@/lib/telegram/bot';
import { getSupabaseDB } from '@/lib/supabase/client';
import { getCloudinaryClient } from '@/lib/cloudinary/client';
import { classifyContent } from '@/lib/classifier';

// Initialize bot
let initialized = false;

// Save messages matching these conditions:
// 1. Starting with specific keywords: [공유], [전달], [공지], [안내], [중요]
// 2. Contains links (URLs)
// 3. Has media/file attachments
const SAVE_KEYWORDS_PATTERN = /^\[(공유|전달|공지|안내|중요)\]/;
const URL_PATTERN = /https?:\/\/[^\s]+/;

async function initializeServices() {
  if (initialized) return;

  const bot = getTelegramBot();
  const db = getSupabaseDB();

  // Set up message handler (works for all message types)
  bot.onMessage(async (msg: TelegramMessage) => {
    console.log(`Received ${msg.chatType} message:`, msg.messageId, 'from:', msg.chatTitle);

    // Skip empty messages
    if (!msg.text && !msg.mediaType) {
      console.log('Skipping empty message');
      return;
    }

    const textToCheck = (msg.text || '').trim();
    const hasKeyword = SAVE_KEYWORDS_PATTERN.test(textToCheck);
    const hasLink = URL_PATTERN.test(textToCheck);
    const hasMedia = !!msg.mediaType;

    // Only save if: has keyword OR has link OR has media
    if (!hasKeyword && !hasLink && !hasMedia) {
      console.log('Skipping message - no keyword, link, or media');
      return;
    }

    console.log(`Saving message: keyword=${hasKeyword}, link=${hasLink}, media=${hasMedia}`);

    // Classify content
    const classification = classifyContent(msg.text || '');
    console.log('Classification:', classification);

    // Generate link based on chat type
    let link = '';
    if (msg.chatType === 'channel') {
      link = `https://t.me/c/${String(msg.chatId).replace('-100', '')}/${msg.messageId}`;
    } else if (msg.chatType === 'private') {
      link = `[Private: ${msg.senderUsername || msg.senderName}]`;
    } else {
      // Group or supergroup
      link = `https://t.me/c/${String(msg.chatId).replace('-100', '')}/${msg.messageId}`;
    }

    // Upload media to Cloudinary if present
    let mediaLink: string | undefined;
    if (msg.mediaFileId && msg.mediaFileName && msg.mediaMimeType) {
      try {
        console.log('Downloading file from Telegram:', msg.mediaFileName);
        const fileBuffer = await bot.downloadFile(msg.mediaFileId);

        console.log('Uploading to Cloudinary...');
        const cloudinary = getCloudinaryClient();
        const uploadResult = await cloudinary.uploadFile(
          fileBuffer,
          `${msg.chatTitle}_${msg.messageId}_${msg.mediaFileName}`,
          msg.mediaMimeType
        );
        mediaLink = uploadResult.secureUrl;
        console.log('Uploaded to Cloudinary:', mediaLink);
      } catch (error) {
        console.error('Failed to upload to Cloudinary:', error);
      }
    }

    // Create text content - include filename for documents without text
    let textContent = msg.text || '';
    if (!textContent && msg.mediaFileName) {
      textContent = `📎 ${msg.mediaFileName}`;
    } else if (!textContent) {
      textContent = '[Media only]';
    }

    // Save to Supabase
    try {
      await db.insertPost({
        timestamp: msg.date.toISOString(),
        channel: msg.chatTitle + (msg.senderName ? ` (${msg.senderName})` : ''),
        message_id: msg.messageId,
        category: classification.category,
        subcategory: classification.subcategory,
        text: textContent,
        media_type: msg.mediaType,
        link: link,
        media_link: mediaLink,
        reply_to_message_id: msg.replyToMessageId,
      });
      console.log('Saved to Supabase');
    } catch (error) {
      console.error('Failed to save to Supabase:', error);
    }
  });

  initialized = true;
  console.log('Services initialized');
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended)
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (expectedSecret && secretHeader !== expectedSecret) {
      console.warn('Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initializeServices();

    const update: Update = await request.json();
    console.log('Received update:', update.update_id);

    const bot = getTelegramBot();
    await bot.handleUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Telegram webhook endpoint is running'
  });
}
