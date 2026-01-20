import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) { }

  /**
   * Uploads a file and returns its metadata with URL.
   * @param file - The uploaded file
   * @param baseUrl - The base URL derived from the request (protocol + host)
   * @returns File metadata including URL and path
   */
  uploadFile(file: Express.Multer.File, baseUrl: string) {
    if (!file) {
      throw new BadRequestException('FILE_EMPTY');
    }

    const isVideo = file.mimetype.match(/\/(mp4|mov|avi|wmv)$/);
    const folder = isVideo ? 'videos' : 'images';
    const filePath = `/uploads/${folder}/${file.filename}`;

    return {
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: `${baseUrl}${filePath}`,
      path: filePath,
    };
  }

  /**
   * Uploads a driver document and returns its metadata with URL.
   * @param file - The uploaded file
   * @param baseUrl - The base URL derived from the request (protocol + host)
   * @returns File metadata including URL and path
   */
  uploadDriverDocument(file: Express.Multer.File, baseUrl: string) {
    if (!file) {
      throw new BadRequestException('FILE_EMPTY');
    }

    const filePath = `/uploads/documents/${file.filename}`;

    return {
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: `${baseUrl}${filePath}`,
      path: filePath,
    };
  }
}
