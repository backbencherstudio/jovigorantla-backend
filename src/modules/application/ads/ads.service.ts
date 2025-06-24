import { Injectable } from '@nestjs/common';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService){}
  async findAll() {
    try {
    const sidebarAds = await this.prisma.sideBarAd.findMany({
        where: {
          active: true,
        },
        orderBy: {
          add_type: "asc",
        },
      })

      // update views count
      sidebarAds.forEach(async (ads) => {
        await this.prisma.sideBarAd.update({
          where: { id: ads.id },
          data: { views: { increment: 1 } }
        });
      })

      // check ads length and if there are ads then add image url
      sidebarAds.forEach((ads) => {
        if (ads.image) {
          ads['image_url'] = SojebStorage.url(
            appConfig().storageUrl.ads + ads.image,
          )
        }
        
        // increase views count
        ads.views = ads.views + 1;

      })

      return {
        success: true,
        message: "ads group with ads retrieved successfully",
        data: sidebarAds
      }

    
    } catch (error) {
     return {
       success: false,
       message: "ads group retrieve failed",
     }
    }
   }

  
  // async getSidebarTop() {
  //   try {
  //     const sidebarTop = await this.prisma.sideBarAd.findFirst({
  //       where: {
  //         add_type: "TOP",
  //       },
  //     });

  //     if (!sidebarTop) {
  //       return {
  //         success: false,
  //         message: "sidebar top ad not found",
  //     }
  //   }

  //   if (sidebarTop.image) {
  //     sidebarTop['image_url'] = SojebStorage.url(
  //       appConfig().storageUrl.ads + sidebarTop.image,
  //     )
  //   }

  //   return {
  //     success: true,
  //     message: "sidebar top ad retrieve successfully",
  //     data: sidebarTop,
  //   }
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: "sidebar top ad retrieve failed",
  //     }
  //   }
  // }


  // async getSidebarBottom() {
  //   try {
  //     const sidebarBottom = await this.prisma.sideBarAd.findFirst({
  //       where: {
  //         add_type: "BOTTOM",
  //       },
  //     });

  //     if (!sidebarBottom) {
  //       return {
  //         success: false,
  //         message: "sidebar bottom ad not found",
  //       }
  //     }

  //     if (sidebarBottom.image) {
  //       sidebarBottom['image_url'] = SojebStorage.url(
  //         appConfig().storageUrl.ads + sidebarBottom.image,
  //       )
  //     }

  //     return {
  //       success: true,
  //       message: "sidebar bottom ad retrieve successfully",
  //       data: sidebarBottom,
  //     }
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: "sidebar bottom ad retrieve failed",
  //     }
  //   }
  // }

  async trackAdsClick(id: string){
    try {
      let ad = await this.prisma.ad.findUnique({
        where: {
          id: id,
        },
      });

      if (!ad) {
        return {
          success: false,
          message: "ads not found",
        }
      }
      
      await this.prisma.ad.update({
        where: { id },
        data: { clicks: { increment: 1 } }
      });

      return {
        success: true,
        message: "Click tracked",
      }
    } catch (error) {
      return {
        success: false,
        message: "ads click count update failed",
      }
    }
  }

  async trackSidebarAdClick(id: string){
    try {
      let ad = await this.prisma.sideBarAd.findUnique({
        where: {
          id: id,
        },
      });

      if (!ad) {
        return {
          success: false,
          message: "ads not found",
        }
      }
      await this.prisma.sideBarAd.update({
        where: { id },
        data: { clicks: { increment: 1 } }
      });

      return {
        success: true,
        message: "Click tracked",
      }
    } catch (error) {
      return {
        success: false,
        message: "ads click count update failed",
      }
    }
  }
}
