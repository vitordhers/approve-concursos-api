import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { UploadImgDto } from './dto/upload-img.dto';
import { UploadService } from './upload.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import fileFilter from './functions/file-filter.function';
import { Multer } from 'multer';
import { MAX_UPLOAD_BYTES } from './config/max-upload-bytes.const';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/enums/user-role.enum';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 } as Multer.File,
        { name: 'thumbnail', maxCount: 1 } as Multer.File,
      ],
      {
        limits: { fieldSize: MAX_UPLOAD_BYTES },
        fileFilter,
      },
    ),
  )
  async uploadImg(@UploadedFiles() uploadImgDto: UploadImgDto) {
    return await this.uploadService.uploadImg(uploadImgDto);
  }
}
