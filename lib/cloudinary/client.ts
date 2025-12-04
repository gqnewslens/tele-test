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

  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'raw'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result?.result === 'ok');
          }
        }
      );
    });
  }

  // Extract public ID from Cloudinary URL
  static extractPublicId(url: string): { publicId: string; resourceType: 'image' | 'video' | 'raw' } | null {
    try {
      // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{folder}/{public_id}.{extension}
      const urlParts = new URL(url);
      const pathParts = urlParts.pathname.split('/');

      // Find resource type (image, video, raw)
      const resourceTypeIndex = pathParts.indexOf('upload') - 1;
      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      if (resourceTypeIndex >= 0) {
        const rt = pathParts[resourceTypeIndex];
        if (rt === 'image' || rt === 'video' || rt === 'raw') {
          resourceType = rt;
        }
      }

      // Get the path after "upload" and version
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex === -1) return null;

      // Skip version (starts with v followed by numbers)
      let startIndex = uploadIndex + 1;
      if (pathParts[startIndex]?.match(/^v\d+$/)) {
        startIndex++;
      }

      // Join remaining parts and remove extension
      const publicIdWithExt = pathParts.slice(startIndex).join('/');
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

      return { publicId, resourceType };
    } catch {
      return null;
    }
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
