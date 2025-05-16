
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsUrl,  } from "class-validator";



export class CreateSidebarAdDto {
  @IsOptional()
  @IsUrl()
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
