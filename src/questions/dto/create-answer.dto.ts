import { IsDefined, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAnswerDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  questionId: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  answeredAlternativeIndex: number;
}
