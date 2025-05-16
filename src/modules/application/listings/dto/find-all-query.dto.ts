import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FindAllQueryDto {
  // @IsOptional()
  // @IsNumber()
  // @Type(() => Number)
  // lat: number;

  // @IsOptional()
  // @IsNumber()
  // @Type(() => Number)
  // lng: number;

  // @IsOptional()
  // @IsNumber()
  // @Type(() => Number)
  // radius: number = 30; // default to 30 miles

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  sub_category?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit: number = 20; // default page size

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  // @Type(() => Boolean)
  @Transform(({ value }) => {
      if (value === "true" || value === true) {
      return true
      }
      return false
  })
  is_usa?: boolean;

}

