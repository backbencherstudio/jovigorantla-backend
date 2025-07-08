
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUrl,  } from "class-validator";



export class CreateSidebarAdDto {
  @IsOptional()
  @IsString()
  target_url: string;

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
