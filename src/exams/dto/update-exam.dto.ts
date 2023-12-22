import { PartialType } from '@nestjs/mapped-types';
import { CreateAssessmentExamDto } from './create-assessnent-exam.dto';
import { IsEmpty } from 'class-validator';

export class UpdateExamDto extends PartialType(CreateAssessmentExamDto) {
  @IsEmpty()
  code: string;
}
