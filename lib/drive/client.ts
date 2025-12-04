import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

export interface UploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink?: string;
}

class GoogleDriveClient {
  private drive: drive_v3.Drive;
  private folderId?: string;

  constructor() {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!credentials) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is required');
    }

    this.folderId = folderId;

    const parsedCredentials = JSON.parse(credentials);

    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<UploadResult> {
    const fileMetadata: drive_v3.Schema$File = {
      name: fileName,
    };

    // If folder ID is specified, upload to that folder
    if (this.folderId) {
      fileMetadata.parents = [this.folderId];
    }

    const media = {
      mimeType,
      body: Readable.from(fileBuffer),
    };

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink, webContentLink',
      supportsAllDrives: true,
    });

    const file = response.data;

    // Make the file publicly viewable (optional)
    await this.drive.permissions.create({
      fileId: file.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });

    return {
      fileId: file.id!,
      fileName: file.name!,
      webViewLink: file.webViewLink!,
      webContentLink: file.webContentLink || undefined,
    };
  }

  async createFolder(folderName: string): Promise<string> {
    const fileMetadata: drive_v3.Schema$File = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (this.folderId) {
      fileMetadata.parents = [this.folderId];
    }

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return response.data.id!;
  }

  async ensureFolder(folderName: string): Promise<string> {
    // Search for existing folder
    const query = this.folderId
      ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${this.folderId}' in parents and trashed=false`
      : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    return this.createFolder(folderName);
  }
}

// Singleton
let driveInstance: GoogleDriveClient | null = null;

export function getGoogleDriveClient(): GoogleDriveClient {
  if (!driveInstance) {
    driveInstance = new GoogleDriveClient();
  }
  return driveInstance;
}

export { GoogleDriveClient };
