import { Transform, Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsLatitude,
    IsLongitude,
    IsEnum,
  } from 'class-validator';
import { DisplayPageType } from 'src/common/enum/display-page-type.enum';
  
  export class CreateListingDto {
    @IsOptional()
    @IsString()
    user_id: string;

    @IsNotEmpty()
    @IsEnum(DisplayPageType)
    category: string;
  
    @IsString()
    @IsNotEmpty()
    sub_category: string;
  
    @IsString()
    @IsNotEmpty()
    title: string;
  
    @IsOptional()
    @IsString()
    description?: string;
  
    @IsNotEmpty()
    @Type(() => Number)
    @IsLatitude()
    lat: number;
  
    @IsNotEmpty()
    @Type(() => Number)
    @IsLongitude()
    lng: number;

    @IsOptional()
    @IsBoolean()
    // @Type(() => Boolean)
    @Transform(({ value }) => {
        if (value === "true" || value === true) {
        return true
        }
        return false
    })
    is_usa: boolean;
  }