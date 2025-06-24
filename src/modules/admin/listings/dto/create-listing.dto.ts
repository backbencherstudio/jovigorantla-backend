import { Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsLatitude,
    IsLongitude,
  } from 'class-validator';
  
  export class CreateListingDto {
    @IsString()
    @IsNotEmpty()
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
  
    @Type(() => Number)
    @IsLatitude()
    lat: number;
  
    @Type(() => Number)
    @IsLongitude()
    lng: number;

    @IsOptional()
    @IsBoolean()
    is_usa: boolean;
  }
  
