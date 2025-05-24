import { Injectable } from '@nestjs/common';
import { CreateAdsGroupDto } from './dto/create-ads-group.dto';
import { UpdateAdsGroupDto } from './dto/update-ads-group.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class AdsGroupService {
  constructor(private prisma: PrismaService) { }
  async create(createAdsGroupDto: CreateAdsGroupDto, image: Express.Multer.File) {
    try {

      const data: any = {}
      if(createAdsGroupDto.name) data.name = createAdsGroupDto.name;
      if(createAdsGroupDto.frequency) data.frequency = createAdsGroupDto.frequency;
      if(createAdsGroupDto.start_date) data.start_date = createAdsGroupDto.start_date;
      if(createAdsGroupDto.display_pages) data.display_pages = createAdsGroupDto.display_pages;

      const adGroup = await this.prisma.adGroup.create({
        data
      })

      if(createAdsGroupDto.ad_name && createAdsGroupDto.target_url && image){
        await this.prisma.ad.create({
          data: {
            ad_group_id: adGroup.id,
            name: createAdsGroupDto.ad_name,
            target_url: createAdsGroupDto.target_url,
            image: image.filename
          }
        })
      }

      return {
        success: true,
        message: "ads group created successfully",
      }
      
    } catch (error) {
      return {
        success: false,
        message: "ads group create failed",
      }
    }
  }

  async findAll() {
   try {
    const add_groups = await this.prisma.adGroup.findMany({
      include: {
        ads: true
      }
    })

    // check ads length and if there are ads then add image url
    add_groups.forEach((ad_group) => {
      ad_group.ads.forEach((ads) => {
        ads['image_url'] = SojebStorage.url(
          appConfig().storageUrl.ads + ads.image,
        )
      })
    })

    return {
      success: true,
      message: "ads group retrieved successfully",
      data: add_groups
    }
   } catch (error) {
    return {
      success: false,
      message: "ads group retrieve failed",
    }
   }
  }

 async findOne(id: string) {
    try {
      const ad_group =  await this.prisma.adGroup.findUnique({
        where: {
          id
        },
        include: {
          ads: true
        }
      })

      if(!ad_group){
        return {
          success: false,
          message: "ads group not found",
        }
      }
      ad_group.ads.forEach((ads) => {
        ads['image_url'] = SojebStorage.url(
          appConfig().storageUrl.ads + ads.image,
        )
      })
      return {
        success: true,
        message: "ads group retrieved successfully",
        data: ad_group
      }
    } catch (error) {
      return {
        success: false,
        message: "ads group retrieve failed",
      }
    }
  }

  async update(id: string, updateAdsGroupDto: UpdateAdsGroupDto) {
    try {
      const ad_group = await this.prisma.adGroup.findUnique({
        where: {
          id
        }
      })

      if(!ad_group){
        return {
          success: false,
          message: "ads group not found",
        }
      }
      const data: any = {}
      if(updateAdsGroupDto?.name) data.name = updateAdsGroupDto.name;
      if(updateAdsGroupDto?.frequency) data.frequency = updateAdsGroupDto.frequency;
      if(updateAdsGroupDto?.start_date || updateAdsGroupDto?.start_date == null) data.start_date = updateAdsGroupDto.start_date;
      if(updateAdsGroupDto?.end_date || updateAdsGroupDto?.end_date == null) data.end_date = updateAdsGroupDto.end_date;
      if(updateAdsGroupDto?.display_pages) data.display_pages = updateAdsGroupDto.display_pages;
      if(updateAdsGroupDto?.active == true || updateAdsGroupDto.active == false) data.active = updateAdsGroupDto.active;

      console.log(data);

      const updated_ad_group = await this.prisma.adGroup.update({
        where: {
          id
        },
        data,
      })

      console.log("updated_ad_group => ", updated_ad_group)
      return {
        success: true,
        message: "ads group updated successfully",
        data: updated_ad_group
      }
      
    } catch (error) {;
      console.log(error);
      return {
        success: false,
        message: "ads group update failed",
      }
    }
  }

  async remove(id: string) {
    try {
      // find ad group with id
      const ad_group = await this.prisma.adGroup.findUnique({
        where: {
          id
        },
        include: {
          ads: true
        }
      })

      if(!ad_group){
        return {
          success: false,
          message: "ads group not found",
        }
      }

      // delete ads images from storage
      ad_group.ads.forEach(async (ads) => {
        await SojebStorage.delete(appConfig().storageUrl.ads + ads.image)
      })

      // delete ads group
      await this.prisma.adGroup.delete({
        where: {
          id
        }
      })

      return {
        success: true,
        message: "ads group deleted successfully",
      }
    } catch (error) {
      return {
        success: false,
        message: "ads group delete failed",
      }
    }
  }
}
