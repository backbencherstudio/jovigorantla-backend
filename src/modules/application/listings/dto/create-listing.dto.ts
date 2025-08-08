// import { Transform, Type } from 'class-transformer';
// import {
//     IsString,
//     IsNotEmpty,
//     IsOptional,
//     IsBoolean,
//     IsLatitude,
//     IsLongitude,
//     IsEnum,
//   } from 'class-validator';
// import { DisplayPageType } from 'src/common/enum/display-page-type.enum';

//   export class CreateListingDto {
//     @IsOptional()
//     @IsString()
//     user_id: string;

//     @IsNotEmpty()
//     @IsEnum(DisplayPageType)
//     category: string;

//     @IsString()
//     @IsNotEmpty()
//     sub_category: string;

//     @IsString()
//     @IsNotEmpty()
//     title: string;

//     @IsOptional()
//     @IsString()
//     description?: string;

//     @IsNotEmpty()
//     @Type(() => Number)
//     @IsLatitude()
//     lat: number;

//     @IsNotEmpty()
//     @Type(() => Number)
//     @IsLongitude()
//     lng: number;

//     @IsNotEmpty()
//     @IsOptional()
//     @IsString()
//     address?: string;

//     @IsOptional()
//     @IsBoolean()
//     // @Type(() => Boolean)
//     @Transform(({ value }) => {
//         if (value === "true" || value === true) {
//         return true
//         }
//         return false
//     })
//     is_usa: boolean;
//   }



import { IsString, IsNotEmpty, IsBoolean, IsArray, MinLength, IsLatitude, IsLongitude, IsOptional, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';


class CityDto {
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @IsNumber()
  @IsLongitude()
  longitude: number;

  @IsString()
  address?: string;
}

export class CreateListingDto {
  @IsOptional()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsString()
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
  @IsNumber()
  radius: number;


  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) {
      return true;
    }
    return false;
  })
  @IsBoolean()
  post_to_usa: boolean;

  @IsNotEmpty()
  @IsString()
  address: string

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  latitude: number

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  longitude: number
  
  @IsArray()
  @MinLength(1, { message: 'Cities array must have at least one city' })
  @Type(() => CityDto)
  cities: CityDto[];

  
}
