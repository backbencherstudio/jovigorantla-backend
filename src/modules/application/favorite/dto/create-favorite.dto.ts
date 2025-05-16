import { IsOptional, IsString } from 'class-validator';

export class CreateFavoriteDto {
  @IsOptional()
  @IsString()
  user_id: string;

  
  @IsString()
  listing_id: string;
}
