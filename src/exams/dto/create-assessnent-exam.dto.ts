import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateAssessmentExamDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  code: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  name: string;

  @IsDefined()
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  questionsIds: string[];

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsString()
  boardId?: string;
}
