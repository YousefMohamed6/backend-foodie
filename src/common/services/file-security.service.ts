import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';
import sharp from 'sharp';

@Injectable()
export class FileSecurityService {
  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  private readonly MAX_VIDEO_SIZE = 30 * 1024 * 1024;
  private readonly MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

  private readonly ALLOWED_IMAGE_MIMES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  private readonly ALLOWED_VIDEO_MIMES = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
  ];

  private readonly ALLOWED_DOCUMENT_MIMES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  private readonly FILE_SIGNATURES = {
    'image/jpeg': [0xff, 0xd8, 0xff],
    'image/png': [0x89, 0x50, 0x4e, 0x47],
    'video/mp4': [0x00, 0x00, 0x00],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
  };

  async validateImage(file: Express.Multer.File): Promise<void> {
    if (!this.ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('INVALID_IMAGE_TYPE');
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      throw new BadRequestException('IMAGE_TOO_LARGE');
    }

    await this.verifyFileSignature(file);
  }

  async validateVideo(file: Express.Multer.File): Promise<void> {
    if (!this.ALLOWED_VIDEO_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('INVALID_VIDEO_TYPE');
    }

    if (file.size > this.MAX_VIDEO_SIZE) {
      throw new BadRequestException('VIDEO_TOO_LARGE');
    }
  }

  async validateDocument(file: Express.Multer.File): Promise<void> {
    if (!this.ALLOWED_DOCUMENT_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('INVALID_DOCUMENT_TYPE');
    }

    if (file.size > this.MAX_DOCUMENT_SIZE) {
      throw new BadRequestException('DOCUMENT_TOO_LARGE');
    }

    await this.verifyFileSignature(file);
  }

  async stripExifData(fileBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(fileBuffer)
        .rotate()
        .withMetadata({
          exif: {},
        })
        .toBuffer();
    } catch (error) {
      throw new BadRequestException('IMAGE_PROCESSING_FAILED');
    }
  }

  async optimizeImage(
    fileBuffer: Buffer,
    options: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
  ): Promise<Buffer> {
    const { maxWidth = 2048, maxHeight = 2048, quality = 85 } = options;

    try {
      return await sharp(fileBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality, progressive: true })
        .toBuffer();
    } catch (error) {
      throw new BadRequestException('IMAGE_OPTIMIZATION_FAILED');
    }
  }

  private async verifyFileSignature(file: Express.Multer.File): Promise<void> {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('FILE_EMPTY');
    }

    const signature = this.FILE_SIGNATURES[file.mimetype];
    if (!signature) {
      return;
    }

    const fileHeader = Array.from(file.buffer.slice(0, signature.length));
    const signatureMatch = signature.every(
      (byte, index) => byte === fileHeader[index] || byte === 0x00,
    );

    if (!signatureMatch) {
      throw new BadRequestException('FILE_SIGNATURE_MISMATCH');
    }
  }

  sanitizeFilename(filename: string): string {
    const sanitized = filename
      .replace(/\.\./g, '')
      .replace(/[\/\\]/g, '')
      .replace(/[<>:"|?*]/g, '')
      .trim();

    const ext = extname(sanitized);
    const name = sanitized.replace(ext, '').substring(0, 50);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);

    return `${name}-${timestamp}-${random}${ext}`;
  }
}
