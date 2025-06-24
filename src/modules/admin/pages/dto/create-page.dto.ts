// dto/create-page.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class CreatePageDto {

  @IsOptional()
  @IsString()
  title: string;

  @IsString()
  content: string;
}

