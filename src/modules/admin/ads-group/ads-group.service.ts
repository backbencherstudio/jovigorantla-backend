import { Injectable } from '@nestjs/common';
import { CreateAdsGroupDto } from './dto/create-ads-group.dto';
import { UpdateAdsGroupDto } from './dto/update-ads-group.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import * as cuid from 'cuid';


@Injectable()
export class AdsGroupService {
  constructor(private prisma: PrismaService) { }
  async create(createAdsGroupDto: CreateAdsGroupDto, image: Express.Multer.File) {
    try {

      const data: any = {}
      if (createAdsGroupDto.name) data.name = createAdsGroupDto.name;
      if (createAdsGroupDto.frequency) data.frequency = createAdsGroupDto.frequency;
      if (createAdsGroupDto.start_date) data.start_date = createAdsGroupDto.start_date;
      if (createAdsGroupDto.display_pages) data.display_pages = createAdsGroupDto.display_pages;

      const adGroup = await this.prisma.adGroup.create({
        data
      })

      if (createAdsGroupDto.ad_name && createAdsGroupDto.target_url && image) {
        await this.prisma.$transaction(async (prisma) => {

          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}${image.originalname.replace(/\s+/g, '-')}`;

          await SojebStorage.put("ads/" + fileName, image.buffer);

          // Create the ad
          const ad = await prisma.ad.create({
            data: {
              name: createAdsGroupDto.ad_name,
              target_url: createAdsGroupDto.target_url,
              image: fileName,
              ad_group_id: adGroup.id,
              active: true,
              views: 0,
              clicks: 0
            }
          });

          // Process cities if provided
          if (createAdsGroupDto.cities?.length) {
            const cityOperations = createAdsGroupDto.cities.map(async (city) => {
              // Find or create city
              let cityRecord: any = await prisma.city.findFirst({
                where: { address: city.address }
              });

              if (!cityRecord) {
                const cityResult = await prisma.$queryRaw`
                                INSERT INTO cities (
                                  id, address, latitude, longitude, location, created_at, updated_at
                                ) VALUES (
                                  ${cuid()}, ${city.address}, ${city.latitude}, ${city.longitude},
                                  ST_SetSRID(ST_MakePoint(${city.longitude}, ${city.latitude}), 4326),
                                  NOW(), NOW()
                                )
                                RETURNING id, address, latitude, longitude, created_at, updated_at
                              `;

                cityRecord = cityResult[0];
              }

              // Create AdCity relationship
              await prisma.adCity.create({
                data: {
                  ad_id: ad.id,
                  city_id: cityRecord.id
                }
              });
            });

            await Promise.all(cityOperations);
          }

          return ad;
        }, {
          timeout: 1000000,
        });

        // 
        // // Generate image URL
        // const adWithImageUrl = {
        //   ...result,
        //   image_url: SojebStorage.url(appConfig().storageUrl.ads + result.image)
        // };

        // // fetch associted cities
        // const adCities = await this.prisma.adCity.findMany({
        //   where: { ad_id: result.id },
        //   include: { city: true }
        // });

        // adWithImageUrl['cities'] = adCities.map(adCity => adCity.city);

      }

      return {
        success: true,
        message: "ads group created successfully",
      }

    } catch (error) {
      console.log(error);
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
        },
        orderBy: {
          created_at: 'asc',
        },
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
      const ad_group = await this.prisma.adGroup.findUnique({
        where: {
          id
        },
        include: {
          ads: true
        }
      })

      if (!ad_group) {
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

      if (!ad_group) {
        return {
          success: false,
          message: "ads group not found",
        }
      }
      const data: any = {}
      if (updateAdsGroupDto?.name) data.name = updateAdsGroupDto.name;
      if (updateAdsGroupDto?.frequency) data.frequency = updateAdsGroupDto.frequency;
      if (updateAdsGroupDto?.start_date || updateAdsGroupDto?.start_date == null) data.start_date = updateAdsGroupDto.start_date;
      if (updateAdsGroupDto?.end_date || updateAdsGroupDto?.end_date == null) data.end_date = updateAdsGroupDto.end_date;
      if (updateAdsGroupDto?.display_pages) data.display_pages = updateAdsGroupDto.display_pages;
      if (updateAdsGroupDto?.active == true || updateAdsGroupDto.active == false) data.active = updateAdsGroupDto.active;

      // console.log(data);

      const updated_ad_group = await this.prisma.adGroup.update({
        where: {
          id
        },
        data,
      })

      // console.log("updated_ad_group => ", updated_ad_group)
      return {
        success: true,
        message: "ads group updated successfully",
        data: updated_ad_group
      }

    } catch (error) {
      ;
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

      if (!ad_group) {
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
