import { google, sheets_v4 } from 'googleapis';

export interface SheetRow {
  timestamp: string;
  channelTitle: string;
  messageId: number;
  category: string;
  subcategory?: string;
  text: string;
  mediaType?: string;
  link: string;
  driveLink?: string;
}

class GoogleSheetsClient {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  constructor() {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!credentials) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is required');
    }
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID is required');
    }

    this.spreadsheetId = spreadsheetId;

    // Parse service account credentials
    const parsedCredentials = JSON.parse(credentials);

    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async appendRow(sheetName: string, row: SheetRow): Promise<void> {
    const values = [
      [
        row.timestamp,
        row.channelTitle,
        row.messageId,
        row.category,
        row.subcategory || '',
        row.text,
        row.mediaType || '',
        row.link,
        row.driveLink || '',
      ],
    ];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:I`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  }

  async appendRows(sheetName: string, rows: SheetRow[]): Promise<void> {
    const values = rows.map((row) => [
      row.timestamp,
      row.channelTitle,
      row.messageId,
      row.category,
      row.subcategory || '',
      row.text,
      row.mediaType || '',
      row.link,
      row.driveLink || '',
    ]);

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:I`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  }

  async ensureSheetExists(sheetName: string): Promise<void> {
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });

    const sheetExists = spreadsheet.data.sheets?.some(
      (sheet) => sheet.properties?.title === sheetName
    );

    if (!sheetExists) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: sheetName },
              },
            },
          ],
        },
      });

      // Add header row
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:I1`,
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
              'Drive Link',
            ],
          ],
        },
      });
    }
  }

  async getSheetData(sheetName: string): Promise<string[][]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:I`,
    });

    return (response.data.values as string[][]) || [];
  }
}

// Singleton
let sheetsInstance: GoogleSheetsClient | null = null;

export function getGoogleSheetsClient(): GoogleSheetsClient {
  if (!sheetsInstance) {
    sheetsInstance = new GoogleSheetsClient();
  }
  return sheetsInstance;
}

export { GoogleSheetsClient };
