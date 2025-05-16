
import { IsNotEmpty, IsString, IsUrl,  } from "class-validator";

export class CreateAdDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsUrl()
    target_url: string;

    @IsNotEmpty()
    @IsString()
    ad_group_id: string;
    
}
