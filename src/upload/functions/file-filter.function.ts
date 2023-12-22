import { BadRequestException } from '@nestjs/common';
import { IMG_ALLOWED_MIME_TYPES } from '../config/img-allowed-mimes-types.const';

const fileFilter = (
  _: any,
  file:
    | {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    | undefined,
  callback: (error: Error, acceptFile: boolean) => void,
) => {
  if (!file) return callback(null, true);
  const supportedFormat = IMG_ALLOWED_MIME_TYPES.includes(file.mimetype);
  if (!supportedFormat) {
    return callback(new BadRequestException('Extension not allowed'), false);
  }
  return callback(null, true);
};

export default fileFilter;
