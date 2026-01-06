import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';
import sharp from 'sharp';

/**
 * File Upload Security Service
 * 
 * Enterprise-grade file upload security following OWASP guidelines:
 * - MIME type validation (not just extension)
 * - File size limits (images: 5MB, videos: 30MB)
 * - EXIF data stripping for privacy
 * - File signature verification
 * - Virus scanning ready (extensible)
 * 
 * Inspired by WhatsApp, Instagram, and other media-heavy platforms.
 */
@Injectable()
export class FileSecurityService {
    // File size limits in bytes
    private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private readonly MAX_VIDEO_SIZE = 30 * 1024 * 1024; // 30MB
    private readonly MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

    // Allowed MIME types
    private readonly ALLOWED_IMAGE_MIMES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
    ];

    private readonly ALLOWED_VIDEO_MIMES = [
        'video/mp4',
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi
    ];

    private readonly ALLOWED_DOCUMENT_MIMES = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
    ];

    // File signature magic numbers for verification
    private readonly FILE_SIGNATURES = {
        'image/jpeg': [0xff, 0xd8, 0xff],
        'image/png': [0x89, 0x50, 0x4e, 0x47],
        'video/mp4': [0x00, 0x00, 0x00], // First 3 bytes of ftyp
        'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
    };

    /**
     * Validate uploaded image file
     */
    async validateImage(file: Express.Multer.File): Promise<void> {
        // Check MIME type
        if (!this.ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid image type. Allowed: ${this.ALLOWED_IMAGE_MIMES.join(', ')}`,
            );
        }

        // Check file size
        if (file.size > this.MAX_IMAGE_SIZE) {
            throw new BadRequestException(
                `Image too large. Maximum size: ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`,
            );
        }

        // Verify file signature (magic numbers)
        await this.verifyFileSignature(file);
    }

    /**
     * Validate uploaded video file
     */
    async validateVideo(file: Express.Multer.File): Promise<void> {
        // Check MIME type
        if (!this.ALLOWED_VIDEO_MIMES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid video type. Allowed: ${this.ALLOWED_VIDEO_MIMES.join(', ')}`,
            );
        }

        // Check file size
        if (file.size > this.MAX_VIDEO_SIZE) {
            throw new BadRequestException(
                `Video too large. Maximum size: ${this.MAX_VIDEO_SIZE / 1024 / 1024}MB`,
            );
        }
    }

    /**
     * Validate document file
     */
    async validateDocument(file: Express.Multer.File): Promise<void> {
        // Check MIME type
        if (!this.ALLOWED_DOCUMENT_MIMES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid document type. Allowed: ${this.ALLOWED_DOCUMENT_MIMES.join(', ')}`,
            );
        }

        // Check file size
        if (file.size > this.MAX_DOCUMENT_SIZE) {
            throw new BadRequestException(
                `Document too large. Maximum size: ${this.MAX_DOCUMENT_SIZE / 1024 / 1024}MB`,
            );
        }

        // Verify file signature
        await this.verifyFileSignature(file);
    }

    /**
     * Strip EXIF data from images for privacy protection
     */
    async stripExifData(fileBuffer: Buffer): Promise<Buffer> {
        try {
            // Use sharp to remove all metadata
            return await sharp(fileBuffer)
                .rotate() // Auto-rotate based on EXIF orientation
                .withMetadata({
                    // Remove all EXIF data
                    exif: {},
                })
                .toBuffer();
        } catch (error) {
            throw new BadRequestException('Failed to process image');
        }
    }

    /**
     * Resize and optimize image
     */
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

    /**
     * Verify file signature (magic numbers) to prevent disguised files
     */
    private async verifyFileSignature(file: Express.Multer.File): Promise<void> {
        if (!file.buffer || file.buffer.length === 0) {
            throw new BadRequestException('Empty file');
        }

        const signature = this.FILE_SIGNATURES[file.mimetype];
        if (!signature) {
            // No signature check for this type
            return;
        }

        // Check first few bytes match expected signature
        const fileHeader = Array.from(file.buffer.slice(0, signature.length));
        const signatureMatch = signature.every(
            (byte, index) => byte === fileHeader[index] || byte === 0x00, // 0x00 means any byte
        );

        if (!signatureMatch) {
            throw new BadRequestException(
                'File signature mismatch. File may be disguised or corrupted.',
            );
        }
    }

    /**
     * Sanitize filename to prevent directory traversal attacks
     */
    sanitizeFilename(filename: string): string {
        // Remove path separators and dangerous characters
        const sanitized = filename
            .replace(/\.\./g, '') // Remove ../
            .replace(/[\/\\]/g, '') // Remove slashes
            .replace(/[<>:"|?*]/g, '') // Remove special chars
            .trim();

        // Generate safe filename with timestamp
        const ext = extname(sanitized);
        const name = sanitized.replace(ext, '').substring(0, 50);
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);

        return `${name}-${timestamp}-${random}${ext}`;
    }
}
