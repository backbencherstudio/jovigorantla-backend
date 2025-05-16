import { PartialType } from '@nestjs/swagger';
import { CreateAdsGroupDto } from './create-ads-group.dto';

export class UpdateAdsGroupDto extends PartialType(CreateAdsGroupDto) {
}
