// import {
//   ExceptionFilter,
//   Catch,
//   ArgumentsHost,
//   HttpException,
// } from '@nestjs/common';

// @Catch(HttpException)
// export class CustomExceptionFilter implements ExceptionFilter {
//   catch(exception: HttpException, host: ArgumentsHost) {
//     const response = host.switchToHttp().getResponse();
//     const status = exception.getStatus();

//     // Return custom error response format
//     response.status(status).json({
//       success: false,
//       // message: exception.message || 'An error occurred',
//       message: exception.getResponse(),
//     });
//   }
// }

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An error occurred';

    // Handle Multer file size errors
    if (exception instanceof MulterError) {
      if (exception.code === 'LIMIT_FILE_SIZE') {
        status = HttpStatus.BAD_REQUEST;
        message = 'File too large. Maximum allowed size is 5MB.';
      } else {
        message = `File upload error: ${exception.message}`;
      }
    }

    // Handle standard HTTP exceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any)?.message || message;
    }

    // console.log(exception);
    response.status(status).json({
      success: false,
      message,
    });
  }
}
