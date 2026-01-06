import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';
    let errorCode = 'ERR_INTERNAL';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        error = responseObj.error || exception.name;
        // Map some common errors to codes
        if (status === 401) errorCode = 'ERR_UNAUTHORIZED';
        if (status === 403) errorCode = 'ERR_FORBIDDEN';
        if (status === 404) errorCode = 'ERR_NOT_FOUND';
        if (status === 429) errorCode = 'ERR_TOO_MANY_REQUESTS';
        if (status === 400) errorCode = 'ERR_BAD_REQUEST';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;

      // Handle Prisma specific errors
      if (error.includes('PrismaClient')) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'ERR_DATABASE';
        if (error.includes('P2002')) {
          message = 'A unique constraint failed on the database.';
          errorCode = 'ERR_DUPLICATE_ENTRY';
        }
      }
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      message: Array.isArray(message) ? message[0] : message,
      errors: Array.isArray(message) ? message : undefined,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
