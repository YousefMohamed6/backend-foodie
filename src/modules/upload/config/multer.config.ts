import { HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

export const multerConfig = {
  dest: './uploads/images',
};

export const multerOptions = {
  // Enable file size limits
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  // Check the mimetypes to allow for upload
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|mov|avi|wmv)$/)) {
      // Allow storage of file
      cb(null, true);
    } else {
      // Reject file
      cb(
        new HttpException('UNSUPPORTED_FILE_TYPE', HttpStatus.BAD_REQUEST),
        false,
      );
    }
  },
  // Storage properties
  storage: diskStorage({
    // Destination storage path details
    destination: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) => {
      const isVideo = file.mimetype.match(/\/(mp4|mov|avi|wmv)$/);
      const uploadPath = isVideo ? './uploads/videos' : './uploads/images';
      // Create folder if doesn't exist
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    // File modification details
    filename: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      // Calling the callback passing the random name generated with the original extension name
      cb(null, `${uuid()}${extname(file.originalname)}`);
    },
  }),
};

export const multerImageOptions = {
  ...multerOptions,
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      cb(null, true);
    } else {
      cb(
        new HttpException('INVALID_IMAGE_TYPE', HttpStatus.BAD_REQUEST),
        false,
      );
    }
  },
};
