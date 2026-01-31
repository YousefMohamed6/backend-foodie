import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { EnvKeys } from '../../common/constants/env-keys.constants';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { multerImageOptions, multerOptions } from './config/multer.config';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Constructs the base URL for file URLs.
   * In production, uses APP_BASE_URL from environment config.
   * Falls back to request-based URL construction for development.
   * The trust proxy setting in main.ts ensures correct protocol detection behind Nginx.
   */
  private getBaseUrl(req: Request): string {
    // Use APP_BASE_URL from config if available (recommended for production)
    const configuredBaseUrl = this.configService.get<string>(EnvKeys.APP_BASE_URL);
    if (configuredBaseUrl && configuredBaseUrl !== 'http://localhost:3000') {
      // Remove trailing slash if present
      return configuredBaseUrl.replace(/\/$/, '');
    }

    // Fallback to request-based URL (works with trust proxy enabled)
    return `${req.protocol}://${req.get('host')}`;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload file (generic)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const baseUrl = this.getBaseUrl(req);
    return this.uploadService.uploadFile(file, baseUrl);
  }

  @Post('user-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerImageOptions))
  uploadUserImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const baseUrl = this.getBaseUrl(req);
    return this.uploadService.uploadFile(file, baseUrl);
  }

  @Post('product-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerImageOptions))
  uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const baseUrl = this.getBaseUrl(req);
    return this.uploadService.uploadFile(file, baseUrl);
  }

  @Post('story')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload story media' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadStoryMedia(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const baseUrl = this.getBaseUrl(req);
    return this.uploadService.uploadFile(file, baseUrl);
  }

  @Post('chat-media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload chat media' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadChatMedia(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const baseUrl = this.getBaseUrl(req);
    return this.uploadService.uploadFile(file, baseUrl);
  }

  @Post('driver-document')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload driver document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadDriverDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Req() req: Request,
  ) {
    const baseUrl = this.getBaseUrl(req);
    const uploadResult = this.uploadService.uploadDriverDocument(file, baseUrl);
    return {
      ...uploadResult,
      documentType,
    };
  }
}
