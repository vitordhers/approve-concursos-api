import { Multer } from 'multer';

export class UploadImgDto {
  image: Multer.File[];
  thumbnail?: Multer.File[];
  subfolder: string;
}
