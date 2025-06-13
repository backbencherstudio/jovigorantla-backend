import { Injectable } from '@nestjs/common';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { CreateSidebarAdDto } from './dto/create-sidebar-ad.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import * as cuid from 'cuid';

@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService) { }
  // async create(createAdDto: CreateAdDto, image: Express.Multer.File) {
  //   try {
  //     if (!image) {
  //       return {
  //         success: false,
  //         message: "image is required",
  //       }
  //     }

  //     if (!createAdDto.target_url) {
  //       return {
  //         success: false,
  //         message: "target url is required",
  //       }
  //     }

  //     if (!createAdDto.name) {
  //       return {
  //         success: false,
  //         message: "name is required",
  //       }
  //     }

  //     if (!createAdDto.ad_group_id) {
  //       return {
  //         success: false,
  //         message: "group id is required",
  //       }
  //     }

  //   // find add group
  //   const adGroup = await this.prisma.adGroup.findUnique({
  //     where: {
  //       id: createAdDto.ad_group_id,
  //     },
  //   })

  //   if (!adGroup) {
  //     return {
  //       success: false,
  //       message: "ad group not found",
  //   }}

  //   const data: any = {};
  //   data.image = image.filename;
  //   data.target_url = createAdDto.target_url;
  //   data.name = createAdDto.name;
  //   data.ad_group_id = createAdDto.ad_group_id;

  //   if(createAdDto.cities) {
  //     // data.cities = createAdDto.cities;
  //     createAdDto.cities.forEach(city => {
  //       console.log(city)
  //     })
  //     // Array.from(createAdDto.cities).forEach(city => {
  //     //   console.log(city)
  //     // })
  //   }



  //   // create ad
  //   const ad = await this.prisma.ad.create({
  //     data,
  //   })

  //   if (ad.image) {
  //     ad['image_url'] = SojebStorage.url(
  //       appConfig().storageUrl.ads + ad.image,
  //     )
  //   }

  //   return {
  //     success: true,
  //     message: "ad create successfully",
  //     data: ad,
  //   }
  //   } catch (error) {
  //     console.log(error)
  //     return {
  //       success: false,
  //       message: "ad create failed",
  //     }
  //   }
  // }

  // async create(createAdDto: CreateAdDto, image: Express.Multer.File) {
  //   try {
  //     if (!image) return { success: false, message: "image is required" };
  //     if (!createAdDto.target_url) return { success: false, message: "target url is required" };
  //     if (!createAdDto.name) return { success: false, message: "name is required" };
  //     if (!createAdDto.ad_group_id) return { success: false, message: "group id is required" };

  //     const adGroup = await this.prisma.adGroup.findUnique({
  //       where: { id: createAdDto.ad_group_id },
  //     });
  //     if (!adGroup) return { success: false, message: "ad group not found" };

  //     const ad = await this.prisma.ad.create({
  //       data: {
  //         name: createAdDto.name,
  //         target_url: createAdDto.target_url,
  //         image: image.filename,
  //         ad_group_id: createAdDto.ad_group_id,
  //       },
  //     });

  //     console.log(createAdDto.cities)

  //     if (createAdDto.cities && Array.isArray(createAdDto.cities)) {
  //       for (const city of createAdDto.cities) {
  //         const existing = await this.prisma.city.findUnique({ where: { slug: city.slug } });

  //         let cityId: string;

  //         if (!existing) {
  //           const result = await this.prisma.$queryRawUnsafe<any>(`
  //             INSERT INTO cities (
  //               id, name, slug, country, state, latitude, longitude,
  //               location, boundary, created_at, updated_at
  //             ) VALUES (
  //               $7, $1, $2, $3, $4, $5, $6,
  //               ST_SetSRID(ST_MakePoint($6, $5), 4326),
  //               ST_SetSRID(ST_GeomFromGeoJSON($7), 4326),
  //               NOW(), NOW()
  //             )
  //             RETURNING id
  //           `, city.name, city.slug, city.country, city.state, city.latitude, city.longitude, JSON.stringify(city.boundary), cuid());

  //           cityId = result?.[0]?.id;
  //         } else {
  //           cityId = existing.id;
  //         }

  //         await this.prisma.adCity.create({
  //           data: {
  //             ad_id: ad.id,
  //             city_id: cityId,
  //           },
  //         });
  //       }
  //     }

  //     ad['image_url'] = SojebStorage.url(appConfig().storageUrl.ads + ad.image);

  //     return {
  //       success: true,
  //       message: "Ad created successfully",
  //       data: ad,
  //     };
  //   } catch (error) {
  //     console.error("Ad creation failed:", error);
  //     return {
  //       success: false,
  //       message: "Ad creation failed",
  //     };
  //   }
  // }



  // async create(createAdDto: CreateAdDto, image: Express.Multer.File) {
  //   try {
  //     if (!image) return { success: false, message: "image is required" };
  //     if (!createAdDto.target_url) return { success: false, message: "target url is required" };
  //     if (!createAdDto.name) return { success: false, message: "name is required" };
  //     if (!createAdDto.ad_group_id) return { success: false, message: "group id is required" };

  //     const adGroup = await this.prisma.adGroup.findUnique({
  //       where: { id: createAdDto.ad_group_id },
  //     });
  //     if (!adGroup) return { success: false, message: "ad group not found" };

  //     const ad = await this.prisma.ad.create({
  //       data: {
  //         name: createAdDto.name,
  //         target_url: createAdDto.target_url,
  //         image: image.filename,
  //         ad_group_id: createAdDto.ad_group_id,
  //       },
  //     });

  //     if (createAdDto.cities && Array.isArray(createAdDto.cities)) {
  //       for (const city of createAdDto.cities) {
  //         const existingCity = await this.prisma.city.findFirst({
  //           where: { address: city.address },
  //         });

  //         let cityId: string;

  //         if (!existingCity) {
  //           const newCityId = cuid();
  //           const boundaryGeoJson = city.boundary
  //             ? JSON.stringify({
  //                 type: 'Polygon',
  //                 coordinates: city.boundary.coordinates,
  //               })
  //             : null;

  //           const query = `
  //             INSERT INTO cities (
  //               id, name, slug, country, state, latitude, longitude,
  //               location, boundary, created_at, updated_at
  //             )
  //             VALUES (
  //               $1, $2, $3, $4, $5, $6, $7,
  //               ST_SetSRID(ST_MakePoint($7, $6), 4326),
  //               ${boundaryGeoJson ? `ST_SetSRID(ST_GeomFromGeoJSON($8), 4326)` : 'NULL'},
  //               NOW(), NOW()
  //             )
  //             RETURNING id
  //           `;

  //           const params = boundaryGeoJson
  //             ? [newCityId, city.name, city.slug, city.country, city.state, city.latitude, city.longitude, boundaryGeoJson]
  //             : [newCityId, city.name, city.slug, city.country, city.state, city.latitude, city.longitude];

  //           const result = await this.prisma.$queryRawUnsafe<any>(query, ...params);

  //           cityId = result?.[0]?.id;
  //         } else {
  //           cityId = existingCity.id;
  //         }

  //         await this.prisma.adCity.create({
  //           data: {
  //             ad_id: ad.id,
  //             city_id: cityId,
  //           },
  //         });
  //       }
  //     }

  //     ad['image_url'] = SojebStorage.url(appConfig().storageUrl.ads + ad.image);

  //     return {
  //       success: true,
  //       message: "Ad created successfully",
  //       data: ad,
  //     };
  //   } catch (error) {
  //     console.error("Ad creation failed:", error);
  //     return {
  //       success: false,
  //       message: "Ad creation failed",
  //     };
  //   }
  // }

  async create(createAdDto: CreateAdDto, image: Express.Multer.File) {
    try {
      // Validate required fields
      if (!image) throw new Error("Image is required");
      if (!createAdDto.target_url) throw new Error("Target URL is required");
      if (!createAdDto.name) throw new Error("Name is required");
      if (!createAdDto.ad_group_id) throw new Error("Ad group ID is required");

      // Verify ad group exists
      const adGroupExists = await this.prisma.adGroup.findUnique({
        where: { id: createAdDto.ad_group_id },
        select: { id: true }
      });
      if (!adGroupExists) throw new Error("Ad group not found");

      // Create transaction for atomic operations
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create the ad
        const ad = await prisma.ad.create({
          data: {
            name: createAdDto.name,
            target_url: createAdDto.target_url,
            image: image.filename,
            ad_group_id: createAdDto.ad_group_id,
            active: true,
            views: 0,
            clicks: 0
          }
        });

        // Process cities if provided
        if (createAdDto.cities?.length) {
          const cityOperations = createAdDto.cities.map(async (city) => {
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
      });

      // Generate image URL
      const adWithImageUrl = {
        ...result,
        image_url: SojebStorage.url(appConfig().storageUrl.ads + result.image)
      };

      // fetch associted cities
      const adCities = await this.prisma.adCity.findMany({
        where: { ad_id: result.id },
        include: { city: true }
      });

      adWithImageUrl['cities'] = adCities.map(adCity => adCity.city);

      return {
        success: true,
        message: "Ad created successfully",
        data: adWithImageUrl
      };

    } catch (error) {
      console.error("Ad creation failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Ad creation failed",
      };
    }
  }



  // async createOrUpdateCity(city: {
  //   name: string;
  //   slug: string;
  //   country: string;
  //   state?: string;
  //   latitude: number;
  //   longitude: number;
  //   boundary: {
  //     type: 'Polygon';
  //     coordinates: number[][][];
  //   };
  // }) {
  //   try {
  //     const { name, slug, country, state, latitude, longitude, boundary } = city;

  //     const boundaryGeoJSON = JSON.stringify(boundary); // Valid GeoJSON string for ST_GeomFromGeoJSON

  //     const result = await this.prisma.$executeRawUnsafe(`
  //       INSERT INTO cities (
  //         id, name, slug, country, state, latitude, longitude,
  //         location, boundary, created_at, updated_at
  //       )
  //       VALUES (
  //         gen_random_uuid(), $1, $2, $3, $4, $5, $6,
  //         ST_SetSRID(ST_MakePoint($6, $5), 4326),
  //         ST_SetSRID(ST_GeomFromGeoJSON($7), 4326),
  //         NOW(), NOW()
  //       )
  //       ON CONFLICT (slug) DO UPDATE SET
  //         name = EXCLUDED.name,
  //         country = EXCLUDED.country,
  //         state = EXCLUDED.state,
  //         latitude = EXCLUDED.latitude,
  //         longitude = EXCLUDED.longitude,
  //         location = EXCLUDED.location,
  //         boundary = EXCLUDED.boundary,
  //         updated_at = NOW();
  //     `, name, slug, country, state, latitude, longitude, boundaryGeoJSON);

  //     return {
  //       success: true,
  //       message: 'City saved successfully',
  //       data: result,
  //     };
  //   } catch (error) {
  //     console.error('Error saving city:', error);
  //     return {
  //       success: false,
  //       message: 'Failed to save city',
  //     };
  //   }
  // }




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

  // async findOne(id: string) {
  //   try {
  //     const ad = await this.prisma.ad.findUnique({
  //       where: {
  //         id: id,
  //       },
  //     });

  //     if (!ad) {
  //       return {
  //         success: false,
  //         message: "ad not found",
  //       }
  //     }

  //   if(ad.image) {
  //     ad['image_url'] = SojebStorage.url(
  //       appConfig().storageUrl.ads + ad.image,
  //     )

  //   }
  //     return {
  //       success: true,
  //       message: "ad retrieve successfully", 
  //       data: ad,
  //     }
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: "ad retrieve failed",
  //     }
  //   }
  // }

  async findOne(id: string) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id },
        include: {
          adCities: {
            include: {
              city: true,
            },
          },
          ad_group: true, // Optional: Include this if you want ad group metadata too
        },
      });

      if (!ad) {
        return {
          success: false,
          message: "Ad not found",
        };
      }

      // Attach image URL
      const imageUrl = ad.image
        ? SojebStorage.url(appConfig().storageUrl.ads + ad.image)
        : null;

      if (ad.image) {
        ad['image_url'] = imageUrl;
      }

      // Extract city list
      const cities = ad.adCities.map((adCity) => adCity.city);
      delete ad.adCities; // Clean up to avoid circular references
      return {
        success: true,
        message: "Ad retrieved successfully",
        data: {
          ...ad,
          image_url: imageUrl,
          cities, // Send full city metadata separately
        },
      };
    } catch (error) {
      console.error("Ad fetch failed:", error);
      return {
        success: false,
        message: "Ad retrieve failed",
      };
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
      if (updateAdDto.active == true || updateAdDto.active == false) data.active = updateAdDto.active;
      if (updateAdDto.ad_group_id) data.ad_group_id = updateAdDto.ad_group_id;

      const updated_ad = await this.prisma.ad.update({
        where: {
          id: id,
        },
        data,
      });

      if (updateAdDto.cities && Array.isArray(updateAdDto.cities)) {
        // Clear existing cities for this ad
        await this.prisma.adCity.deleteMany({
          where: { ad_id: updated_ad.id },
        });

        // Add new cities
        const cityOperations = updateAdDto.cities.map(async (city) => {
          const existingCity = await this.prisma.city.findFirst({
            where: { address: city.address },
          });

          let cityId: string;

          if (!existingCity) {
            const newCityId = cuid();
            const result = await this.prisma.$queryRawUnsafe<any>(`
              INSERT INTO cities (
                id, address, latitude, longitude, location, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4,
                ST_SetSRID(ST_MakePoint($4, $3), 4326),
                NOW(), NOW()
              )
              RETURNING id
            `, newCityId, city.address, city.latitude, city.longitude);
            cityId = result?.[0]?.id;
          } else {
            cityId = existingCity.id;
          }

          await this.prisma.adCity.create({
            data: {
              ad_id: updated_ad.id,
              city_id: cityId,
            },
          });
        });

        await Promise.all(cityOperations);
      }

      if (updated_ad.image) {
        updated_ad['image_url'] = SojebStorage.url(
          appConfig().storageUrl.ads + updated_ad.image,
        )
      }

      updated_ad['cities'] = await this.prisma.adCity.findMany({
        where: { ad_id: updated_ad.id },
        include: { city: true },
      }).then(adCities => adCities.map(adCity => adCity.city));


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
        if (createSidebarAdDto.active == true || createSidebarAdDto.active == false) data.active = createSidebarAdDto.active;

        if (createSidebarAdDto?.target_url && (sidebarTop?.target_url !== createSidebarAdDto.target_url)) {
          data.views = 0;
          data.clicks = 0;
        }


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
        if (createSidebarAdDto.active == true || createSidebarAdDto.active == false) data.active = createSidebarAdDto.active;

        if (createSidebarAdDto?.target_url && (sidebarBottom?.target_url !== createSidebarAdDto.target_url)) {
          data.views = 0;
          data.clicks = 0;
        }

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


  // async createBulkAds(ads: any[]) {
  //   try {
  //     for (const ad of ads) {
  //       const adId = cuid();

  //       // Insert the ad
  //       await this.prisma.ad.create({
  //         data: {
  //           id: adId,
  //           name: ad.name,
  //           target_url: ad.target_url,
  //           image: ad.image,
  //           active: ad.active ?? true,
  //           ad_group_id: ad.ad_group_id,
  //           views: ad.views ?? 0,
  //           clicks: ad.clicks ?? 0,
  //           created_at: new Date(ad.created_at || Date.now()),
  //           updated_at: new Date(ad.updated_at || Date.now()),
  //         },
  //       });

  //       // Ensure city exists before linking
  //       for (const city of ad.cities) {
  //         let existingCity = await this.prisma.city.findUnique({
  //           where: { id: city.id },
  //         });

  //         if (!existingCity) {
  //           existingCity = await this.prisma.city.create({
  //             data: {
  //               id: city.id,
  //               name: city.name,
  //               // slug: city.name.toLowerCase().replace(/\s+/g, '-'),
  //               country: city.country || 'USA',
  //               latitude: city.latitude,
  //               longitude: city.longitude,
  //             },
  //           });
  //         }

  //         // Link ad to city
  //         await this.prisma.adCity.create({
  //           data: {
  //             ad_id: adId,
  //             city_id: existingCity.id,
  //           },
  //         });
  //       }
  //     }

  //     return { success: true, count: ads.length };
  //   } catch (error) {
  //     console.error('🚨 Bulk Ad Insert Error:', error);
  //     return {
  //       success: false,
  //       message: 'Failed to insert ads',
  //       error: error.message,
  //     };
  //   }
  // }


  async createBulkAds(ads: any[]) {
    try {
      for (const ad of ads) {
        const adId = cuid();

        // ✅ Insert the ad
        await this.prisma.ad.create({
          data: {
            id: adId,
            name: ad.name,
            target_url: ad.target_url,
            image: ad.image,
            active: ad.active ?? true,
            ad_group_id: ad.ad_group_id,
            views: ad.views ?? 0,
            clicks: ad.clicks ?? 0,
            created_at: new Date(ad.created_at || Date.now()),
            updated_at: new Date(ad.updated_at || Date.now()),
          },
        });

        // ✅ Ensure city exists before linking
        for (const city of ad.cities) {
          const existingCity = await this.prisma.city.findUnique({
            where: { id: city.id },
          });

          if (!existingCity) {
            // Use raw SQL to insert city with PostGIS location
            await this.prisma.$executeRawUnsafe(`
              INSERT INTO "cities" (
                id, name, slug, country, latitude, longitude, location,
                created_at, updated_at
              )
              VALUES (
                '${city.id}',
                '${city.name.replace(/'/g, "''")}',
                '${city.name.toLowerCase().replace(/\s+/g, '-')}',
                '${city.country || 'USA'}',
                ${city.latitude},
                ${city.longitude},
                ST_SetSRID(ST_MakePoint(${city.longitude}, ${city.latitude}), 4326),
                NOW(), NOW()
              )
            `);
          }

          // ✅ Link ad to city
          await this.prisma.adCity.create({
            data: {
              ad_id: adId,
              city_id: city.id,
            },
          });
        }
      }

      return { success: true, count: ads.length };
    } catch (error) {
      console.error('🚨 Bulk Ad Insert Error:', error);
      return {
        success: false,
        message: 'Failed to insert ads',
        error: error.message,
      };
    }
  }






}
