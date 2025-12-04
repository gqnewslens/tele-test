import { Telegraf } from 'telegraf';
import { Message, Update } from 'telegraf/types';

export interface TelegramMessage {
  messageId: number;
  chatId: number;
  chatTitle: string;
  chatType: 'private' | 'group' | 'supergroup' | 'channel';
  text: string;
  date: Date;
  mediaType?: 'photo' | 'video' | 'document' | 'audio' | 'voice' | 'sticker';
  mediaFileId?: string;
  mediaFileName?: string;
  mediaMimeType?: string;
  forwardFrom?: string;
  replyToMessageId?: number;
  senderName?: string;
  senderUsername?: string;
}

export type MessageHandler = (message: TelegramMessage) => Promise<void>;

class TelegramBot {
  private bot: Telegraf;
  private messageHandlers: MessageHandler[] = [];

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
    this.bot = new Telegraf(token);
    this.setupListeners();
  }

  private setupListeners() {
    // Handle channel posts
    this.bot.on('channel_post', async (ctx) => {
      const msg = this.parseMessage(ctx.channelPost);
      if (msg) {
        await this.notifyHandlers(msg);
      }
    });

    // Handle private messages, group messages
    this.bot.on('message', async (ctx) => {
      const msg = this.parseMessage(ctx.message);
      if (msg) {
        await this.notifyHandlers(msg);
      }
    });
  }

  private async notifyHandlers(message: TelegramMessage) {
    for (const handler of this.messageHandlers) {
      try {
        await handler(message);
      } catch (error) {
        console.error('Handler error:', error);
      }
    }
  }

  private parseMessage(message: Message): TelegramMessage | null {
    const chat = message.chat;

    const msg: TelegramMessage = {
      messageId: message.message_id,
      chatId: chat.id,
      chatTitle: this.getChatTitle(chat),
      chatType: chat.type,
      text: '',
      date: new Date(message.date * 1000),
    };

    // Sender info (for non-channel messages)
    if ('from' in message && message.from) {
      msg.senderName = message.from.first_name + (message.from.last_name ? ` ${message.from.last_name}` : '');
      msg.senderUsername = message.from.username;
    }

    // Extract text content
    if ('text' in message && message.text) {
      msg.text = message.text;
    } else if ('caption' in message && message.caption) {
      msg.text = message.caption;
    }

    // Detect media type
    if ('photo' in message && message.photo) {
      msg.mediaType = 'photo';
      msg.mediaFileId = message.photo[message.photo.length - 1].file_id;
      msg.mediaFileName = `photo_${message.message_id}.jpg`;
      msg.mediaMimeType = 'image/jpeg';
    } else if ('video' in message && message.video) {
      msg.mediaType = 'video';
      msg.mediaFileId = message.video.file_id;
      msg.mediaFileName = message.video.file_name || `video_${message.message_id}.mp4`;
      msg.mediaMimeType = message.video.mime_type || 'video/mp4';
    } else if ('document' in message && message.document) {
      msg.mediaType = 'document';
      msg.mediaFileId = message.document.file_id;
      msg.mediaFileName = message.document.file_name || `document_${message.message_id}`;
      msg.mediaMimeType = message.document.mime_type || 'application/octet-stream';
    } else if ('audio' in message && message.audio) {
      msg.mediaType = 'audio';
      msg.mediaFileId = message.audio.file_id;
      msg.mediaFileName = message.audio.file_name || `audio_${message.message_id}.mp3`;
      msg.mediaMimeType = message.audio.mime_type || 'audio/mpeg';
    } else if ('voice' in message && message.voice) {
      msg.mediaType = 'voice';
      msg.mediaFileId = message.voice.file_id;
      msg.mediaFileName = `voice_${message.message_id}.ogg`;
      msg.mediaMimeType = message.voice.mime_type || 'audio/ogg';
    } else if ('sticker' in message && message.sticker) {
      msg.mediaType = 'sticker';
      msg.mediaFileId = message.sticker.file_id;
      msg.mediaFileName = `sticker_${message.message_id}.webp`;
      msg.mediaMimeType = 'image/webp';
    }

    // Forward info
    if ('forward_origin' in message && message.forward_origin) {
      const origin = message.forward_origin;
      if (origin.type === 'channel' && 'chat' in origin) {
        const forwardChat = origin.chat as { title?: string };
        msg.forwardFrom = forwardChat.title;
      } else if (origin.type === 'user' && 'sender_user' in origin) {
        msg.forwardFrom = origin.sender_user.first_name;
      }
    }

    // Reply info
    if ('reply_to_message' in message && message.reply_to_message) {
      msg.replyToMessageId = message.reply_to_message.message_id;
    }

    return msg;
  }

  private getChatTitle(chat: Message['chat']): string {
    if (chat.type === 'private') {
      const privateChat = chat as { first_name?: string; last_name?: string; username?: string };
      return privateChat.first_name || privateChat.username || 'Private Chat';
    }
    const groupChat = chat as { title?: string };
    return groupChat.title || 'Unknown';
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  async launch() {
    await this.bot.launch();
    console.log('Telegram bot started');
  }

  async stop() {
    this.bot.stop();
  }

  // For webhook mode (production)
  getWebhookCallback() {
    return this.bot.webhookCallback('/api/telegram/webhook');
  }

  async setWebhook(url: string) {
    await this.bot.telegram.setWebhook(url);
  }

  async deleteWebhook() {
    await this.bot.telegram.deleteWebhook();
  }

  // Process webhook update manually
  async handleUpdate(update: Update) {
    await this.bot.handleUpdate(update);
  }

  // Download file from Telegram
  async downloadFile(fileId: string): Promise<Buffer> {
    const file = await this.bot.telegram.getFile(fileId);
    const filePath = file.file_path;

    if (!filePath) {
      throw new Error('File path not available');
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// Singleton instance
let botInstance: TelegramBot | null = null;

export function getTelegramBot(): TelegramBot {
  if (!botInstance) {
    botInstance = new TelegramBot();
  }
  return botInstance;
}

export { TelegramBot };
