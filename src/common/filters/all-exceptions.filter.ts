import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `HTTP Status: ${status} Error Message: ${
          (exception as Error).message
        } Stack: ${(exception as Error).stack}`,
        {
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
        },
      );
    } else {
      this.logger.warn(
        `HTTP Status: ${status} Message: ${JSON.stringify(message)}`,
        {
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
        },
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof message === 'object'
          ? (message as any).message || message
          : message,
    });
  }
}