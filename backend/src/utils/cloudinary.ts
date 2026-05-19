import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder',
  api_key: process.env.CLOUDINARY_API_KEY || 'placeholder',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder',
});

/**
 * Uploads a buffer to Cloudinary and returns the secure URL
 * @param fileBuffer The file buffer
 * @param folder Cloudinary folder name
 * @param resourceType 'image' | 'raw' | 'video' | 'auto'
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If credentials are not set, return a mock URL or throw error
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.warn('Cloudinary environment variables are missing! Using mock upload.');
      // Return a data URI or a placeholder URL to prevent breaking demo
      const base64Data = fileBuffer.toString('base64');
      const mimeType = folder === 'aadhar' ? 'image/jpeg' : 'application/pdf';
      resolve(`data:${mimeType};base64,${base64Data}`);
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `bk_media_crm/${folder}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};
