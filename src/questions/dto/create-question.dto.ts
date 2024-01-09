import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EducationStage } from '../../shared/enums/education-stage.enum';
import { Alternative } from '../../shared/interfaces/alternative.interface';

export class CreateQuestionDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  code: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  prompt: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  correctIndex: number;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @IsArray()
  @ArrayNotEmpty()
  alternatives: Alternative[];

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  answerExplanation?: string;

  @IsOptional()
  @IsString()
  illustration?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsString()
  boardId?: string;

  @IsOptional()
  @IsString()
  examId?: string;

  @IsEnum(EducationStage)
  educationStage?: EducationStage;
}
