/**
 * Test Google Sheets connection
 * Usage: npx tsx scripts/test-sheets.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { google } from 'googleapis';

async function testSheets() {
  console.log('Testing Google Sheets connection...\n');

  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!credentials) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY is not set');
    process.exit(1);
  }

  if (!spreadsheetId) {
    console.error('❌ GOOGLE_SPREADSHEET_ID is not set');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`   Spreadsheet ID: ${spreadsheetId}\n`);

  try {
    const parsedCredentials = JSON.parse(credentials);
    console.log(`✅ Service account: ${parsedCredentials.client_email}\n`);

    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get spreadsheet info
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    console.log(`✅ Connected to spreadsheet: "${spreadsheet.data.properties?.title}"`);
    console.log(`   Sheets: ${spreadsheet.data.sheets?.map(s => s.properties?.title).join(', ')}\n`);

    // Try to create TelegramPosts sheet if it doesn't exist
    const sheetExists = spreadsheet.data.sheets?.some(
      (sheet) => sheet.properties?.title === 'TelegramPosts'
    );

    if (!sheetExists) {
      console.log('Creating "TelegramPosts" sheet...');

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: 'TelegramPosts' },
              },
            },
          ],
        },
      });

      // Add header row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'TelegramPosts!A1:H1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              'Timestamp',
              'Channel',
              'Message ID',
              'Category',
              'Subcategory',
              'Text',
              'Media Type',
              'Link',
            ],
          ],
        },
      });

      console.log('✅ Created "TelegramPosts" sheet with headers\n');
    } else {
      console.log('✅ "TelegramPosts" sheet already exists\n');
    }

    // Write a test row
    const testRow = [
      new Date().toISOString(),
      'Test Channel',
      12345,
      'Tech',
      'AI',
      'This is a test message from the setup script',
      '',
      'https://t.me/test/12345',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'TelegramPosts!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [testRow] },
    });

    console.log('✅ Test row written successfully!');
    console.log('\n🎉 Google Sheets connection is working!\n');
    console.log(`Open your spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('not found')) {
      console.error('\n💡 Make sure the spreadsheet exists and the service account has access.');
      console.error('   Share the spreadsheet with: gqai-teletest@constant-abacus-480206-j3.iam.gserviceaccount.com');
    }

    process.exit(1);
  }
}

testSheets();
