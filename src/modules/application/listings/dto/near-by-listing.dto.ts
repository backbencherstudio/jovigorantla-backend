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
  @Type(() => Number)
  @IsNumber()
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
  @Type(() => Number)
  @IsNumber()
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

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  numberOfShownListings?: number = 0; // This will be set by the service after fetching listings

  @IsOptional()
  @IsString()
  listing_cutoff_time?: string; // This will be set by the service to filter listings based on cutoff time
}

