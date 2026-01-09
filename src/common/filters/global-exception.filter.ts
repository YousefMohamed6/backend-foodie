import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messageKey = 'messages.GENERIC_ERROR';
    let errorCode = 'ERR_INTERNAL';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (
        status === HttpStatus.BAD_REQUEST &&
        Array.isArray(exceptionResponse.message)
      ) {
        // This is likely a validation error from ValidationPipe
        messageKey = 'messages.VALIDATION_ERROR';
        errorCode = 'ERR_VALIDATION';
        details = exceptionResponse.message; // Array of field validation messages
      } else {
        const rawMessage =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : Array.isArray(exceptionResponse.message)
              ? exceptionResponse.message[0]
              : exceptionResponse.message;

        messageKey = this.mapRawMessageToKey(rawMessage || exception.message);
        errorCode = this.mapStatusToErrorCode(status);
        details =
          typeof exceptionResponse === 'object'
            ? exceptionResponse.error
            : null;
      }
    } else if (exception.constructor.name.includes('PrismaClient')) {
      // Handle Prisma errors directly without instanceof check to avoid module mismatch issues
      status = HttpStatus.BAD_REQUEST;
      messageKey = 'messages.DATABASE_ERROR';
      errorCode = 'ERR_DATABASE';

      if (exception.code === 'P2002') {
        messageKey = 'messages.DUPLICATE_ENTRY';
        errorCode = 'ERR_DUPLICATE_ENTRY';
      }
    } else if (exception instanceof Error) {
      messageKey = 'messages.GENERIC_ERROR';
      details =
        process.env.NODE_ENV === 'development' ? exception.message : null;
    }

    const lang = request.headers['x-lang']?.toString() || 'ar';

    let translatedMessage = await this.i18n.translate(messageKey, {
      lang,
    });

    // Fallback if key not found
    if (translatedMessage === messageKey) {
      if (!messageKey.startsWith('messages.')) {
        translatedMessage = messageKey; // It's probably a hardcoded string
      } else {
        translatedMessage = await this.i18n.translate(
          'messages.GENERIC_ERROR',
          { lang },
        );
      }
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${translatedMessage}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      success: false,
      message: translatedMessage,
      code: errorCode,
      details: details,
    });
  }

  private mapRawMessageToKey(msg: string): string {
    if (!msg) return 'messages.GENERIC_ERROR';

    // Normalize string to uppercase snake case for mapping
    const normalized = msg
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');

    const mappings: Record<string, string> = {
      USER_NOT_FOUND: 'messages.USER_NOT_FOUND',
      ORDER_NOT_FOUND: 'messages.ORDER_NOT_FOUND',
      VENDOR_NOT_FOUND: 'messages.VENDOR_NOT_FOUND',
      PRODUCT_NOT_FOUND: 'messages.PRODUCT_NOT_FOUND',
      NOT_FOUND: 'messages.NOT_FOUND',
      UNAUTHORIZED: 'messages.UNAUTHORIZED',
      FORBIDDEN: 'messages.FORBIDDEN',
      ACCESS_DENIED: 'messages.FORBIDDEN',
      BAD_REQUEST: 'messages.BAD_REQUEST',
      INVALID_CREDENTIALS: 'messages.INVALID_CREDENTIALS',
      EMAIL_ALREADY_EXISTS: 'messages.EMAIL_ALREADY_EXISTS',
      USER_INACTIVE: 'messages.USER_INACTIVE',
      INVALID_OTP: 'messages.INVALID_OTP',
      PHONE_NOT_REGISTERED: 'messages.PHONE_NOT_REGISTERED',
      FAILED_TO_ADD_PRODUCT: 'messages.PRODUCT_ADD_FAILED',
      PRODUCT_ADD_FAILED: 'messages.PRODUCT_ADD_FAILED',
    };

    if (mappings[normalized]) return mappings[normalized];

    // Fuzzy matching for common patterns
    if (normalized.includes('NOT_FOUND')) {
      if (normalized.includes('USER')) return 'messages.USER_NOT_FOUND';
      if (normalized.includes('ORDER')) return 'messages.ORDER_NOT_FOUND';
      if (normalized.includes('PRODUCT')) return 'messages.PRODUCT_NOT_FOUND';
      return 'messages.NOT_FOUND';
    }

    // If it looks like a key already (e.g. USER_NOT_FOUND), return with prefix
    if (/^[A-Z0-9_]+$/.test(normalized) && normalized.length > 3) {
      return `messages.${normalized}`;
    }

    return msg;
  }

  private mapStatusToErrorCode(status: number): string {
    const codes: Record<number, string> = {
      [HttpStatus.UNAUTHORIZED]: 'ERR_UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'ERR_FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'ERR_NOT_FOUND',
      [HttpStatus.BAD_REQUEST]: 'ERR_BAD_REQUEST',
      [HttpStatus.TOO_MANY_REQUESTS]: 'ERR_TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'ERR_INTERNAL',
      [HttpStatus.CONFLICT]: 'ERR_CONFLICT',
    };

    return codes[status] || 'ERR_UNKNOWN';
  }
}
