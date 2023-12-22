import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class MockQuestionDto {
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  times: number;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  subjectId: string;
}
