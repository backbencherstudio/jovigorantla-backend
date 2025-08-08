import { PartialType } from '@nestjs/swagger';
import { CreateListingDto } from './create-listing.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateListingDto extends PartialType(CreateListingDto) {
    @Transform(({ value }) => JSON.parse(value))
    @IsOptional()
    @IsArray()
    cities?: {
        latitude: number;
        longitude: number;
        address: string;
    }[];

    @IsOptional()
    @IsString()
    image_url?: string;
}
