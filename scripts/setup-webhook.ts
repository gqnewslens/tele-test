/**
 * Script to set up Telegram webhook
 * Usage: npx tsx scripts/setup-webhook.ts <webhook_url>
 * Example: npx tsx scripts/setup-webhook.ts https://your-domain.com/api/telegram/webhook
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

async function setupWebhook() {
  const webhookUrl = process.argv[2];

  if (!webhookUrl) {
    console.error('Usage: npx tsx scripts/setup-webhook.ts <webhook_url>');
    console.error('Example: npx tsx scripts/setup-webhook.ts https://your-domain.com/api/telegram/webhook');
    process.exit(1);
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
    process.exit(1);
  }

  console.log('Setting up Telegram webhook...');
  console.log('Webhook URL:', webhookUrl);

  const params = new URLSearchParams({
    url: webhookUrl,
  });

  if (webhookSecret) {
    params.append('secret_token', webhookSecret);
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook?${params.toString()}`
  );

  const result = await response.json();

  if (result.ok) {
    console.log('Webhook set successfully!');
    console.log('Result:', result);
  } else {
    console.error('Failed to set webhook:', result);
    process.exit(1);
  }

  // Get webhook info
  const infoResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/getWebhookInfo`
  );
  const info = await infoResponse.json();
  console.log('\nWebhook info:', JSON.stringify(info, null, 2));
}

setupWebhook().catch(console.error);
