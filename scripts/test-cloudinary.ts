/**
 * Test Cloudinary connection
 * Usage: npx tsx scripts/test-cloudinary.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { v2 as cloudinary } from 'cloudinary';

async function testCloudinary() {
  console.log('Testing Cloudinary connection...\n');

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log('Cloud Name:', cloudName);
  console.log('API Key:', apiKey);
  console.log('API Secret:', apiSecret ? '***' + apiSecret.slice(-4) : 'NOT SET');

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('\nError: Missing Cloudinary credentials');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  // Test by uploading a small test image
  console.log('\nUploading test image...');

  try {
    const result = await cloudinary.uploader.upload(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      {
        folder: 'telegram',
        public_id: 'test_image_' + Date.now(),
      }
    );

    console.log('\n✅ Upload successful!');
    console.log('Public ID:', result.public_id);
    console.log('URL:', result.secure_url);
    console.log('Format:', result.format);
    console.log('Size:', result.bytes, 'bytes');

    // Clean up test image
    console.log('\nCleaning up test image...');
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ Test image deleted');

  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

testCloudinary().catch(console.error);
