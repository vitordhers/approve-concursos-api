import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UploadImgDto } from './dto/upload-img.dto';
import { Multer } from 'multer';
import { v4 as uid } from 'uuid';

import * as fs from 'fs';
import { inspect } from 'util';

@Injectable()
export class UploadService {
  private logger = new Logger('UploadService');
  constructor() {}
  async uploadImg({ image, thumbnail }: UploadImgDto) {
    const img = await this.handleFileUpload(image[0]);
    let thumb: string | undefined;
    if (thumbnail && thumbnail.length) {
      thumb = await this.handleFileUpload(thumbnail[0]);
    }
    return { img, thumb };
  }

  handleFileUpload(file: Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Customize the filename logic as needed
      const id = uid();
      let extension: 'jpg' | 'jpeg' | 'png' | 'webp';
      switch (file.mimetype) {
        case 'image/jpg':
          extension = 'jpg';
          break;
        case 'image/jpeg':
          extension = 'jpeg';
          break;
        case 'image/png':
          extension = 'png';
        case 'image/webp':
          extension = 'webp';
          break;
        default:
          throw new BadRequestException(`unsupported format ${file.mimetype}`);
      }
      const filename = `${id}.${extension}`;
      const resourceDirectory = `client/assets/uploads/`;
      const resourcePath = `assets/uploads/${filename}`;
      const fullPath = `client/${resourcePath}`;

      console.log({ filename, resourceDirectory, resourcePath, fullPath });

      if (!fs.existsSync(resourceDirectory)) {
        fs.mkdirSync(resourceDirectory, { recursive: true });
      }

      const writableStream = fs.createWriteStream(fullPath);

      writableStream.write(file.buffer);

      writableStream.on('finish', () => {
        resolve(resourcePath);
      });

      writableStream.on('error', (error) => {
        this.logger.error(
          `handleFileUpload error: ${inspect({ error }, { depth: null })}`,
        );
        reject(error);
      });

      writableStream.end();
    });
  }

  deleteFile(filePath: string): Promise<void> {
    const clientsFilePath = `clients/assets/${filePath}`;
    try {
      return new Promise((resolve, reject) => {
        fs.access(clientsFilePath, fs.constants.F_OK, (err) => {
          if (err) {
            console.error(`File ${filePath} does not exist`);
            resolve();
          } else {
            fs.unlink(clientsFilePath, (error) => {
              if (error) {
                this.logger.error(
                  `deleteFile error: ${inspect({ error }, { depth: null })}`,
                );
                reject(error);
              }
              resolve();
            });
          }
        });
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
