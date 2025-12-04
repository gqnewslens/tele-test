import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
}

class CloudinaryClient {
  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials are required');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<CloudinaryUploadResult> {
    // Determine resource type based on mime type
    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    if (mimeType.startsWith('image/')) {
      resourceType = 'image';
    } else if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
      resourceType = 'video';
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          public_id: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
          folder: 'telegram',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
            });
          } else {
            reject(new Error('Upload failed: no result'));
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  }
}

// Singleton
let cloudinaryInstance: CloudinaryClient | null = null;

export function getCloudinaryClient(): CloudinaryClient {
  if (!cloudinaryInstance) {
    cloudinaryInstance = new CloudinaryClient();
  }
  return cloudinaryInstance;
}

export { CloudinaryClient };
