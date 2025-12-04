/**
 * Check Google Sheets data
 * Usage: npx tsx scripts/check-data.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getGoogleSheetsClient } from '../lib/sheets/client';

async function checkData() {
  console.log('Fetching data from Google Sheets...\n');

  const sheets = getGoogleSheetsClient();
  const data = await sheets.getSheetData('TelegramPosts');

  console.log('Total rows:', data.length);
  console.log('\nHeaders:', data[0]);

  console.log('\n--- Sample Data ---\n');

  // Show last 5 entries
  const entries = data.slice(-6).slice(1); // Skip header, get last 5

  entries.forEach((row, i) => {
    console.log(`Entry ${i + 1}:`);
    console.log('  Timestamp:', row[0]);
    console.log('  Channel:', row[1]);
    console.log('  Category:', row[3]);
    console.log('  Text:', row[5]?.substring(0, 100) + (row[5]?.length > 100 ? '...' : ''));
    console.log('  MediaType:', row[6] || '(none)');
    console.log('  Link:', row[7]);
    console.log('  MediaLink:', row[8] || '(none)');
    console.log('');
  });

  // Statistics
  console.log('--- Statistics ---\n');
  const mediaTypes: Record<string, number> = {};
  const hasLinks: number = data.slice(1).filter(row => /https?:\/\/[^\s]+/.test(row[5] || '')).length;
  const notices: number = data.slice(1).filter(row => /^\[(공유|전달|공지|안내|중요)\]/.test((row[5] || '').trim())).length;

  data.slice(1).forEach(row => {
    const mt = row[6] || 'text';
    mediaTypes[mt] = (mediaTypes[mt] || 0) + 1;
  });

  console.log('Media Types:', mediaTypes);
  console.log('Posts with URLs:', hasLinks);
  console.log('Notice posts:', notices);
}

checkData().catch(console.error);
