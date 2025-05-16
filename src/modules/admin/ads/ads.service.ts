import { Injectable } from '@nestjs/common';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { CreateSidebarAdDto } from './dto/create-sidebar-ad.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService){}
  async create(createAdDto: CreateAdDto, image: Express.Multer.File) {
    try {
      if (!image) {
        return {
          success: false,
          message: "image is required",
        }
      }

      if (!createAdDto.target_url) {
        return {
          success: false,
          message: "target url is required",
        }
      }

      if (!createAdDto.name) {
        return {
          success: false,
          message: "name is required",
        }
      }

      if (!createAdDto.ad_group_id) {
        return {
          success: false,
          message: "group id is required",
        }
      }

    // find add group
    const adGroup = await this.prisma.adGroup.findUnique({
      where: {
        id: createAdDto.ad_group_id,
      },
    })

    if (!adGroup) {
      return {
        success: false,
        message: "ad group not found",
    }}

    const data: any = {};
    data.image = image.filename;
    data.target_url = createAdDto.target_url;
    data.name = createAdDto.name;
    data.ad_group_id = createAdDto.ad_group_id;

    // create ad
    const ad = await this.prisma.ad.create({
      data,
    })

    if (ad.image) {
      ad['image_url'] = SojebStorage.url(
        appConfig().storageUrl.ads + ad.image,
      )
    }

    return {
      success: true,
      message: "ad create successfully",
      data: ad,
    }
    } catch (error) {
      return {
        success: false,
        message: "ad create failed",
      }
    }
  }

  

  async findAll() {
    try {
      const ads = await this.prisma.ad.findMany();

      ads.forEach((ad) => {
        ad['image_url'] = SojebStorage.url(
          appConfig().storageUrl.ads + ad.image,
        )
      })
      return {
        success: true,
        message: "ads retrieve successfully",
        data: ads,
      }
    } catch (error) {
      return {
        success: false,
        message: "ads retrieve failed",
      }
    }
  }

  async findOne(id: string) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: {
          id: id,
        },
      });

      if (!ad) {
        return {
          success: false,
          message: "ad not found",
        }
      }

    if(ad.image) {
      ad['image_url'] = SojebStorage.url(
        appConfig().storageUrl.ads + ad.image,
      )
    
    }
      return {
        success: true,
        message: "ad retrieve successfully", 
        data: ad,
      }
    } catch (error) {
      return {
        success: false,
        message: "ad retrieve failed",
      }
    }
  }

  async update(id: string, updateAdDto: UpdateAdDto, image: Express.Multer.File) {
    try {
      // find the ad 
      const ad = await this.prisma.ad.findUnique({
        where: {
          id: id,
        },
      });

      if (!ad) {
        return {
          success: false,
          message: "ad not found",
        }
      }

      // if image exist delete it
      if (image) {
        if (ad.image) {
          SojebStorage.delete(
            appConfig().storageUrl.ads + ad.image,
          )
        }
      }

      const data: any = {};
      if (updateAdDto.target_url) data.target_url = updateAdDto.target_url;
      if (updateAdDto.name) data.name = updateAdDto.name;
      if (image) data.image = image.filename;
      if(updateAdDto.active == true || updateAdDto.active == false) data.active = updateAdDto.active;
      if(updateAdDto.ad_group_id) data.ad_group_id = updateAdDto.ad_group_id;

      const updated_ad = await this.prisma.ad.update({
        where: {
          id: id,
        },
        data,
      });

      if (updated_ad.image) {
        updated_ad['image_url'] = SojebStorage.url(
          appConfig().storageUrl.ads + updated_ad.image,
        )
      }
      
      return {
        success: true,
        message: "ad update successfully",
        data: updated_ad,
      }
    } catch (error) {
      return {
        success: false,
        message: "ad update failed",
      }
    }
  }

 async remove(id: string) {
    try {
      // find the ad
      const ad = await this.prisma.ad.findUnique({
        where: {
          id: id,
        },
      });

      if (!ad) {
        return {
          success: false,
          message: "ad not found",
        }
      }

      if (ad.image) {
        SojebStorage.delete(
          appConfig().storageUrl.ads + ad.image,
        )
      }

      await this.prisma.ad.delete({
        where: {
          id: id,
        },
      });

      return {
        success: true,
        message: "ad delete successfully",
      }
    } catch (error) {
      return {
        success: false,
        message: "ad delete failed",
      }
    }
  }





  async createOrUpdateSidebarTop(createSidebarAdDto: CreateSidebarAdDto, image: Express.Multer.File) {
    try {
      const sidebarTop = await this.prisma.sideBarAd.findFirst({
        where: {
          add_type: "TOP",
        },
      });

      if (sidebarTop) {

        if (image) {
          SojebStorage.delete(
            appConfig().storageUrl.ads + sidebarTop.image,
          )
        }

        const data: any = {}
        if (image) data.image = image.filename;
        if (createSidebarAdDto.target_url) data.target_url = createSidebarAdDto.target_url;
        if(createSidebarAdDto.active == true || createSidebarAdDto.active == false) data.active = createSidebarAdDto.active;
        
        const updateSidebarTop = await this.prisma.sideBarAd.update({
          where: {
            id: sidebarTop.id,
          },
          data,
        });

        if (updateSidebarTop.image) {
          updateSidebarTop['image_url'] = SojebStorage.url(
            appConfig().storageUrl.ads + updateSidebarTop.image,
          )
        }

        return {
          success: true,
          message: "sidebar top ad update successfully",
          data: updateSidebarTop,
        }
      }

      if (!image) {
        return {
          success: false,
          message: "image is required",
        }
      }

      if (!createSidebarAdDto.target_url) {
        return {
          success: false,
          message: "target url is required",
        }
      }
      
      const createSidebarTop = await this.prisma.sideBarAd.create({
        data: {
          image: image.filename,
          target_url: createSidebarAdDto.target_url,
          add_type: "TOP",
        },
      });

      if (createSidebarTop.image) {
        createSidebarTop['image_url'] = SojebStorage.url(
          appConfig().storageUrl.ads + createSidebarTop.image,
        )
      }

      return {
        success: true,
        message: "sidebar top ad create successfully",
        data: createSidebarTop,
      }

      
    } catch (error) {
      return {
        success: false,
        message: "sidebar top ad create failed",
      }
    }
  }

  async getSidebarTop() {
    try {
      const sidebarTop = await this.prisma.sideBarAd.findFirst({
        where: {
          add_type: "TOP",
        },
      });

      if (!sidebarTop) {
        return {
          success: false,
          message: "sidebar top ad not found",
      }
    }

    if (sidebarTop.image) {
      sidebarTop['image_url'] = SojebStorage.url(
        appConfig().storageUrl.ads + sidebarTop.image,
      )
    }

    return {
      success: true,
      message: "sidebar top ad retrieve successfully",
      data: sidebarTop,
    }



    } catch (error) {
      return {
        success: false,
        message: "sidebar top ad retrieve failed",
      }
    }
  }

  

  async createOrUpdateSidebarBottom(createSidebarAdDto: CreateSidebarAdDto, image: Express.Multer.File) {
    try {
      const sidebarBottom = await this.prisma.sideBarAd.findFirst({
        where: {
          add_type: "BOTTOM",
        },
      });

      if (sidebarBottom) {
        if (image) {
          SojebStorage.delete(
            appConfig().storageUrl.ads + sidebarBottom.image,
          )
        }

        const data: any = {}
        if (image) data.image = image.filename;
        if (createSidebarAdDto.target_url) data.target_url = createSidebarAdDto.target_url;
        if(createSidebarAdDto.active == true || createSidebarAdDto.active == false) data.active = createSidebarAdDto.active;
        
        const updateSidebarBottom = await this.prisma.sideBarAd.update({
          where: {
            id: sidebarBottom.id,
          },
          data,
        });

        if (updateSidebarBottom.image) {
          updateSidebarBottom['image_url'] = SojebStorage.url(
            appConfig().storageUrl.ads + updateSidebarBottom.image,
          )
        }

        return {
          success: true,
          message: "sidebar bottom ad update successfully",
          data: updateSidebarBottom,
        }
      }

      if (!image) {
        return {
          success: false,
          message: "image is required",
        }
      }

      if (!createSidebarAdDto.target_url) {
        return {
          success: false,
          message: "target url is required",
        }
      }
      
      const createSidebarBottom = await this.prisma.sideBarAd.create({
        data: {
          image: image.filename,
          target_url: createSidebarAdDto.target_url,
          add_type: "BOTTOM",
        },
      });

      if (createSidebarBottom.image) {
        createSidebarBottom['image_url'] = SojebStorage.url(
          appConfig().storageUrl.ads + createSidebarBottom.image,
        )
      }

      return {
        success: true,
        message: "sidebar bottom ad create successfully",
        data: createSidebarBottom,
      }

      
    } catch (error) {
      return {
        success: false,
        message: "sidebar bottom ad create failed",
      }
    }
  }

  async getSidebarBottom() {
    try {
      const sidebarBottom = await this.prisma.sideBarAd.findFirst({
        where: {
          add_type: "BOTTOM",
        },
      });

      if (!sidebarBottom) {
        return {
          success: false,
          message: "sidebar bottom ad not found",
        }
      }

      if (sidebarBottom.image) {
        sidebarBottom['image_url'] = SojebStorage.url(
          appConfig().storageUrl.ads + sidebarBottom.image,
        )
      }

      return {
        success: true,
        message: "sidebar bottom ad retrieve successfully",
        data: sidebarBottom,
      }
    } catch (error) {
      return {
        success: false,
        message: "sidebar bottom ad retrieve failed",
      }
    }
  }

}
