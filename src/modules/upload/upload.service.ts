import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('FILE_EMPTY');
    }

    const host =
      process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const isVideo = file.mimetype.match(/\/(mp4|mov|avi|wmv)$/);
    const folder = isVideo ? 'videos' : 'images';
    const filePath = `/uploads/${folder}/${file.filename}`;

    return {
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: `${host}${filePath}`,
      path: filePath,
    };
  }

  uploadDriverDocument(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('FILE_EMPTY');
    }

    const host =
      process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const filePath = `/uploads/documents/${file.filename}`;

    return {
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: `${host}${filePath}`,
      path: filePath,
    };
  }
}
