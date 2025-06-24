import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { AdsService } from 'src/modules/admin/ads/ads.service';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}
