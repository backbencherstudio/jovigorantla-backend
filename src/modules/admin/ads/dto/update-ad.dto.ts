import { PartialType } from '@nestjs/swagger';
import { CreateAdDto } from './create-ad.dto';
import { IsArray, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAdDto extends PartialType(CreateAdDto) {
  @IsOptional()
  @IsBoolean()
  // @Type(() => Boolean)
  @Transform(({ value }) => {
    if (value === "true" || value === true) {
      return true
    }
    return false
  })
  active: boolean;


  @Transform(({ value }) => JSON.parse(value))
  @IsOptional()
  @IsArray()
  cities?: {
    latitude: number;
    longitude: number;
    address: string;
  }[];

}
