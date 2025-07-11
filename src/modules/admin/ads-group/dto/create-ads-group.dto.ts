import { IsString, IsInt, IsOptional, IsDate, IsArray, IsNotEmpty, ArrayMinSize, IsEnum, IsUrl, MinLength, ValidateNested, IsBoolean, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DisplayPageType } from 'src/common/enum/display-page-type.enum';

export class CreateAdsGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // @IsEnum(RotationMode) // Uncomment if RotationMode enum is used
  // rotation_mode: RotationMode;
  @Type(() => Number)
  @IsInt()
  frequency: number;

  // @IsOptional()
  // @Type(() => Date)
  // @IsDate()
  // start_date?: Date;

  // @IsOptional()
  // @Type(() => Date)
  // @IsDate()
  // end_date?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    // try to convert into date
    if (value && typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return null; // Invalid date
      }
      return date.toISOString();
    }
  })
  start_date?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    // try to convert into date
    if (value && typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return null; // Invalid date
      }
      return date.toISOString();
    }
  })
  end_date?: string | null;

  @Transform(({ value }) => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return [];
    }
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one display page must be selected.' })
  // @ValidateNested({ each: true })
  // @Type(() => String)
  @IsEnum(DisplayPageType, { each: true })
  display_pages?: DisplayPageType[];

  // Optional: Create First Ad
  @IsOptional()
  @IsString()
  ad_name?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Target URL must be a valid URL' })
  target_url?: string;

  @Transform(({ value }) => JSON.parse(value))
  @IsArray()
  @IsOptional()
  cities?: {
    latitude: number;
    longitude: number;
    address: string;
  }[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

}
