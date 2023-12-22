import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { UploadImgDto } from './dto/upload-img.dto';
import { UploadService } from './upload.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AdminToken } from 'src/auth/guards/admin-role.guard';
import fileFilter from './functions/file-filter.function';
import { Multer } from 'multer';
import { UploadImgFolderDto } from './dto/upload-img-folder.dto';
import { MAX_UPLOAD_BYTES } from './config/max-upload-bytes.const';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(AdminToken)
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
  async uploadImg(
    @UploadedFiles() uploadImgDto: UploadImgDto,
    @Body() { subfolder }: UploadImgFolderDto,
  ) {
    return await this.uploadService.uploadImg(uploadImgDto);
  }
}
