
// // import { IsArray, IsNotEmpty, IsOptional, IsString, IsUrl,  } from "class-validator";

// // export class CreateAdDto {
// //     @IsNotEmpty()
// //     @IsString()
// //     name: string;

// //     @IsNotEmpty()
// //     @IsUrl()
// //     target_url: string;

// //     @IsNotEmpty()
// //     @IsString()
// //     ad_group_id: string;

// //     @IsOptional()
// //     @IsArray()
// //     @IsString({ each: true })
// //     cities: string[];

// // }

// // create-ad.dto.ts
// import { IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
// import { Type } from 'class-transformer';

// class CityBoundaryDto {
//   @IsString()
//   type: string;

//   @IsArray()
//   coordinates: number[][][];
// }

// class CityDto {
//   @IsString()
//   name: string;

//   @IsString()
//   slug: string;

//   @IsString()
//   country: string;

//   @IsOptional()
//   @IsString()
//   state?: string;

//   @IsNumber()
//   latitude: number;

//   @IsNumber()
//   longitude: number;

//   @ValidateNested()
//   @Type(() => CityBoundaryDto)
//   boundary: CityBoundaryDto;
// }

// export class CreateAdDto {
//   @IsString()
//   name: string;

//   @IsString()
//   target_url: string;

//   @IsString()
//   ad_group_id: string;

//   @IsOptional()
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CityDto)
//   cities?: CityDto[];
// }


import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateAdDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  target_url: string;

  @IsString()
  ad_group_id: string;

  @IsArray()
  @IsOptional()
  cities?: {
    latitude: number;
    longitude: number;
    address: string;
  }[];
}
