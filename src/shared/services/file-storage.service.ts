import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private s3Client: S3Client | null = null;
  private useLocalStorage: boolean;
  private bucketName: string;
  private uploadDir: string;
  private appUrl: string;

  constructor(private configService: ConfigService) {
    const storageConfig = this.configService.get('storage');
    this.useLocalStorage = storageConfig?.useLocalStorage ?? true;
    this.bucketName = storageConfig?.awsS3Bucket || '';
    this.uploadDir = storageConfig?.uploadDir || 'uploads';
    this.appUrl = storageConfig?.appUrl || 'http://localhost:3000';

    if (!this.useLocalStorage && storageConfig?.awsAccessKeyId) {
      this.s3Client = new S3Client({
        region: storageConfig.awsRegion,
        credentials: {
          accessKeyId: storageConfig.awsAccessKeyId,
          secretAccessKey: storageConfig.awsSecretAccessKey,
        },
      });
      this.logger.log('AWS S3 client initialized');
    } else {
      this.logger.log('Using local file storage');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    if (this.useLocalStorage) {
      return this.uploadToLocal(file, fileName);
    } else {
      return this.uploadToS3(file, fileName);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'images',
    options?: { width?: number; height?: number; quality?: number },
  ): Promise<string> {
    let imageBuffer = file.buffer;

    if (options) {
      const sharpInstance = sharp(file.buffer);

      if (options.width || options.height) {
        sharpInstance.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      imageBuffer = await sharpInstance
        .jpeg({ quality: options.quality || 85 })
        .toBuffer();
    }

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const processedFile = { ...file, buffer: imageBuffer };

    if (this.useLocalStorage) {
      return this.uploadToLocal(processedFile, fileName);
    } else {
      return this.uploadToS3(processedFile, fileName);
    }
  }

  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'videos',
  ): Promise<{ videoUrl: string; thumbnailUrl: string }> {
    const videoFileName = `${folder}/${Date.now()}-${file.originalname}`;
    const thumbnailFileName = `${folder}/thumbnails/${Date.now()}-thumb.jpg`;

    // Upload video
    const videoUrl = this.useLocalStorage
      ? await this.uploadToLocal(file, videoFileName)
      : await this.uploadToS3(file, videoFileName);

    // Generate thumbnail using FFmpeg
    try {
      const thumbnailBuffer = await this.generateVideoThumbnail(file.buffer);
      const thumbnailFile = {
        ...file,
        buffer: thumbnailBuffer,
        originalname: 'thumbnail.jpg',
        mimetype: 'image/jpeg',
      };

      const thumbnailUrl = this.useLocalStorage
        ? await this.uploadToLocal(thumbnailFile, thumbnailFileName)
        : await this.uploadToS3(thumbnailFile, thumbnailFileName);

      return { videoUrl, thumbnailUrl };
    } catch (error) {
      this.logger.warn('Failed to generate video thumbnail:', error);
      return { videoUrl, thumbnailUrl: videoUrl }; // Fallback to video URL
    }
  }

  private async uploadToS3(file: Express.Multer.File, fileName: string): Promise<string> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error('S3 not configured');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);
      return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
    } catch (error) {
      this.logger.error('Failed to upload to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  private async uploadToLocal(file: Express.Multer.File, fileName: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), this.uploadDir);
    const filePath = path.join(uploadDir, fileName);

    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, file.buffer);

    return `${this.appUrl}/${this.uploadDir}/${fileName}`;
  }

  private async generateVideoThumbnail(videoBuffer: Buffer): Promise<Buffer> {
    // Save video buffer to temp file
    const tempVideoPath = path.join(process.cwd(), `temp-${Date.now()}.mp4`);
    const tempThumbPath = path.join(process.cwd(), `temp-thumb-${Date.now()}.jpg`);

    try {
      fs.writeFileSync(tempVideoPath, videoBuffer);

      // Generate thumbnail using FFmpeg
      await execAsync(
        `ffmpeg -i ${tempVideoPath} -ss 00:00:01 -vframes 1 ${tempThumbPath}`,
      );

      // Read thumbnail buffer
      const thumbnailBuffer = fs.readFileSync(tempThumbPath);

      // Cleanup temp files
      fs.unlinkSync(tempVideoPath);
      fs.unlinkSync(tempThumbPath);

      return thumbnailBuffer;
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      if (fs.existsSync(tempThumbPath)) fs.unlinkSync(tempThumbPath);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (this.useLocalStorage) {
      const fileName = fileUrl.split(`/${this.uploadDir}/`)[1];
      if (fileName) {
        const filePath = path.join(process.cwd(), this.uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } else {
      if (!this.s3Client || !this.bucketName) {
        throw new Error('S3 not configured');
      }

      const fileName = fileUrl.split('.com/')[1];
      if (fileName) {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
        });

        await this.s3Client.send(command);
      }
    }
  }
}

