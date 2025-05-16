import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class NearbyListingsQueryDto {
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @Type(() => Number)
  lng: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius: number = 30; // default to 30 miles

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  sub_category?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cursor_distance?: number;

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

  // Add this to NearbyListingsQueryDto
  @IsOptional()
  @Type(() => Number)
  listing_offset?: number;

}

