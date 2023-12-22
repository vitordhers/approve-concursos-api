import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { MockQuestionDto } from './mock-question.dto';

export class CreateMockExamDto {
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
  @IsArray()
  @ValidateNested()
  mockQuestions: MockQuestionDto[];
}
