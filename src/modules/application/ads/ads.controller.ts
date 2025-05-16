import { Controller, Get, Param, Post } from '@nestjs/common';
import { AdsService } from './ads.service';


@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get("sidebar")
  async findAll() {
    try {
      return await this.adsService.findAll();
    } catch (error) {
      return { 
        success: false,
        message: 'Failed to fetch ads',
       };
    }
  }

  // track-ads-click
  @Post(':id/track-click')
  async trackAdsClick(@Param('id') id: string) {
    try {
      return await this.adsService.trackAdsClick(id);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to track ads click',
       };
    }
  }

  @Post('sidebar/:id/track-click')
  async trackSidebarAdClick(@Param('id') id: string) {
    try {
      return await this.adsService.trackSidebarAdClick(id);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to track ads click',
       };
    }
  }


  

  // @Get('sidebar-top')
  // async getSidebarTop() {
  //   try {
  //     return await this.adsService.getSidebarTop();
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: "sidebar top ad retrieve failed",
  //     }
  //   }
  // }

  // @Get('sidebar-bottom')
  // async getSidebarBottom() {
  //   try {
  //     return await this.adsService.getSidebarBottom();
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: "sidebar bottom ad retrieve failed",
  //     }
  //   }
  // }

  // i need click and view ads
  
}
