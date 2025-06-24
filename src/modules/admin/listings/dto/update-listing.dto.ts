import { PartialType } from '@nestjs/swagger';
import { CreateListingDto } from './create-listing.dto';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ListingStatus } from 'src/common/enum/listing-status.enum';

// export class UpdateListingDto extends PartialType(CreateListingDto) {}
export class UpdateListingDto {
    @IsOptional()
    @IsEnum(ListingStatus)
    flagged_listing_status?: ListingStatus;
  
    @IsOptional()
    @IsEnum(ListingStatus)
    usa_listing_status?: ListingStatus;
}
