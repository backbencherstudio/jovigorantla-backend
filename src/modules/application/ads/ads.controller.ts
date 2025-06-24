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

  // test ads
  @Get('test')
  async getTestAds() {
    try {
      return {
        success: true,
        data: [
          {
            id: '1',
            title: 'Test Ad 1',
            description: 'This is a test ad description.',
            imageUrl: 'https://via.placeholder.com/150',
            link: 'https://example.com/test-ad-1',
          },
          {
            id: '2',
            title: 'Test Ad 2',
            description: 'This is another test ad description.',
            imageUrl: 'https://via.placeholder.com/150',
            link: 'https://example.com/test-ad-2',
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch test ads',
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
