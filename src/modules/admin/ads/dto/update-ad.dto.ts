import { PartialType } from '@nestjs/swagger';
import { CreateAdDto } from './create-ad.dto';
import { IsBoolean, IsOptional } from 'class-validator';
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
}
