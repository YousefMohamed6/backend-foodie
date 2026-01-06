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
            throw new BadRequestException(
                `Invalid image type. Allowed: ${this.ALLOWED_IMAGE_MIMES.join(', ')}`,
            );
        }

        if (file.size > this.MAX_IMAGE_SIZE) {
            throw new BadRequestException(
                `Image too large. Maximum size: ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`,
            );
        }

        await this.verifyFileSignature(file);
    }

    async validateVideo(file: Express.Multer.File): Promise<void> {
        if (!this.ALLOWED_VIDEO_MIMES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid video type. Allowed: ${this.ALLOWED_VIDEO_MIMES.join(', ')}`,
            );
        }

        if (file.size > this.MAX_VIDEO_SIZE) {
            throw new BadRequestException(
                `Video too large. Maximum size: ${this.MAX_VIDEO_SIZE / 1024 / 1024}MB`,
            );
        }
    }

    async validateDocument(file: Express.Multer.File): Promise<void> {
        if (!this.ALLOWED_DOCUMENT_MIMES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid document type. Allowed: ${this.ALLOWED_DOCUMENT_MIMES.join(', ')}`,
            );
        }

        if (file.size > this.MAX_DOCUMENT_SIZE) {
            throw new BadRequestException(
                `Document too large. Maximum size: ${this.MAX_DOCUMENT_SIZE / 1024 / 1024}MB`,
            );
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
            throw new BadRequestException('Failed to process image');
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
            throw new BadRequestException('Failed to optimize image');
        }
    }

    private async verifyFileSignature(file: Express.Multer.File): Promise<void> {
        if (!file.buffer || file.buffer.length === 0) {
            throw new BadRequestException('Empty file');
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
            throw new BadRequestException(
                'File signature mismatch. File may be disguised or corrupted.',
            );
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
