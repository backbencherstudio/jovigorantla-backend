import { Module } from '@nestjs/common';
import { AdsGroupService } from './ads-group.service';
import { AdsGroupController } from './ads-group.controller';

@Module({
  controllers: [AdsGroupController],
  providers: [AdsGroupService],
})
export class AdsGroupModule {}
