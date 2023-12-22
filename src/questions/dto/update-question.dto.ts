import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionDto } from './create-question.dto';
import { IsEmpty } from 'class-validator';

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {
  @IsEmpty()
  code?: string;
}
