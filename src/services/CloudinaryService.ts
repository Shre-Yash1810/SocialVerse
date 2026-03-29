import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
  async uploadFile(filePath: string, folder: string) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `socialverse/${folder}`,
        resource_type: 'auto',
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('File upload failed');
    }
  }

  async deleteFile(publicUrl: string) {
    try {
      // Extract public ID from URL
      // Example URL: https://res.cloudinary.com/demo/image/upload/v1570974100/sample.jpg
      const parts = publicUrl.split('/');
      const fileNameWithExt = parts[parts.length - 1];
      const publicId = fileNameWithExt.split('.')[0];
      const folderPath = parts.slice(parts.indexOf('socialverse'), -1).join('/');
      const fullPublicId = `${folderPath}/${publicId}`;

      await cloudinary.uploader.destroy(fullPublicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      // Don't throw here to avoid failing the report resolution if deletion fails
    }
  }
}

export default new CloudinaryService();
