import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { DisplayPageType } from 'src/common/enum/display-page-type.enum';
import { ListingStatus } from 'src/common/enum/listing-status.enum';
import generateSlug from 'src/common/helper/slug.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import * as cuid from 'cuid';
import { NearbyListingsQueryDto } from './dto/near-by-listing.dto';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';




interface AdGroupWithAds {
  group_id: string;
  group_name: string;
  display_pages: string[];
  frequency: number;
  ads: {
    id: string;
    name: string;
    target_url: string;
    image_url: string;
    views: number;
    clicks: number;
  }[];
}

interface CityResult {
  id: string;
}



@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) { }
  async create(createListingDto: CreateListingDto, image: Express.Multer.File) {
    try {
      // Validate image requirement
      // if ((createListingDto.category === DisplayPageType.MARKETPLACE ||
      //   createListingDto.category === DisplayPageType.ACCOMMODATIONS) && !image) {
      //   return {
      //     success: false,
      //     message: 'Image is required',
      //   };
      // }

      const { cities, ...otherData } = createListingDto;

      // Process within a transaction
      return await this.prisma.$transaction(async (prisma) => {
        // Process all cities - find or create
        const cityIds = await Promise.all(
          cities.map(async (city) => {
            // Try to find existing city first
            const existingCity = await prisma.city.findFirst({
              where: {
                address: city.address,
                latitude: city.latitude,
                longitude: city.longitude
              },
            });

            if (existingCity) return existingCity.id;

            // Create new city with proper geometry
            const newCity = await prisma.$queryRaw`
              INSERT INTO "cities" (
                id, 
                address, 
                latitude, 
                longitude, 
                location, 
                created_at, 
                updated_at
              )
              VALUES (
                ${cuid()},
                ${city.address}, 
                ${city.latitude}, 
                ${city.longitude}, 
                ST_SetSRID(ST_Point(${city.longitude}, ${city.latitude}), 4326),
                NOW(),
                NOW()
              )
              RETURNING id;
            `;

            return newCity[0].id;
          })
        );

        // Prepare listing data
        const data: any = {
          category: otherData.category,
          sub_category: otherData.sub_category,
          title: otherData.title,
          description: otherData.description,
          post_to_usa: otherData.post_to_usa ?? false,
          user_id: otherData.user_id,
          status: 'APPROVED', // Make sure this is set
        };

        // Generate unique slug
        if (otherData.title) {
          const baseSlug = generateSlug(otherData.title);
          let slug = baseSlug;
          let counter = 1;

          while (await prisma.listing.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter++}`;
          }
          data.slug = slug;
        }

        if (image) data.image = image.filename;

        // Create listing with city connections
        const newListing = await prisma.listing.create({
          data: {
            ...data,
            cities: {
              connect: cityIds.map(id => ({ id })),
            },
          },
          include: {
            cities: true,
          },
        });

        return {
          success: true,
          message: 'Listing created successfully',
          data: newListing,
        };
      });
    } catch (error) {
      console.error("Listing creation error:", error);
      return {
        success: false,
        message: 'Failed to create listing',
      };
    }
  }

  async bulkCreate(createListingsDto: CreateListingDto[]) {
    try {
      const results = [];

      for (const dto of createListingsDto) {
        // Skip image for bulk inserts
        const result = await this.create(dto, null);
        results.push(result);
      }

      return {
        success: true,
        message: 'Bulk listings creation attempted',
        data: results,
      };
    } catch (error) {
      console.error('Error creating listings (service):', error);
      return {
        success: false,
        message: 'Failed to create listings',
      };
    }
  }

  async findNearbyListings(
    lat: number,
    lng: number,
    radius: number,
    limit = 10,
    numberOfShownListings = 0,
    listing_cutoff_time?: string,
    category?: string,
    sub_category?: string,
    search?: string,
    is_usa?: boolean
  ) {
    try {
      const radiusInMeters = radius * 1609.34;
      const now = new Date();
      const cutoff = listing_cutoff_time ? new Date(listing_cutoff_time) : now;
      const cutoffISO = cutoff.toISOString();
      const proximityWeight = .5;
      const freshnessWeight = .5;

      // Start building the WHERE conditions
      let whereConditions = `
            WHERE ST_DWithin(
                c.location::geography,
                ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography,
                ${radiusInMeters}
            )
            AND l.status = 'APPROVED'
            AND l.created_at <= '${cutoffISO}'::timestamp
        `;

      // Add filters conditionally
      if (category) {
        whereConditions += ` AND l.category = '${category.replace(/'/g, "''")}'`;
      }
      if (sub_category) {
        whereConditions += ` AND l.sub_category = '${sub_category.replace(/'/g, "''")}'`;
      }
      if (search) {
        whereConditions += ` AND (l.title ILIKE '%${search.replace(/'/g, "''")}%' OR l.description ILIKE '%${search.replace(/'/g, "''")}%')`;
      }

      console.log("Where conditions:", is_usa);

      if (is_usa === true) {
        whereConditions += ` AND l.post_to_usa = true`;
        whereConditions += ` AND l.usa_listing_status = 'APPROVED'`;
      } else {
        whereConditions += ` AND l.status = 'APPROVED'`;
      }

      // Build the complete query
      const query = `
            SELECT 
                l.id,
                l.created_at,
                l.slug,
                l.title,
                l.description,
                l.image,
                l.category,
                l.sub_category,
                l.status,
                l.usa_listing_status,
                l.post_to_usa,
                u.id AS user_id,
                u.name AS user_name,
                u.avatar AS user_avatar,
                ST_Distance(
                    c.location::geography,
                    ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography
                ) / 1609.34 AS distance
            FROM listings l
            JOIN "_ListingCities" lc ON lc."B" = l.id
            JOIN cities c ON c.id = lc."A"
            JOIN users u ON u.id = l.user_id
            ${whereConditions}
        `;

      // Execute the query
      const rawListings: any = await this.prisma.$queryRawUnsafe(query);

      // Rest of your processing logic remains the same...
      if (!rawListings.length) {
        return {
          success: true,
          message: 'No listings found within the specified radius',
          data: {
            listings: [],
            numberOfShownListings: 0,
            hasMore: false,
            listing_cutoff_time: cutoff.toISOString(),
          }
        };
      }

      // Group listings by ID, keeping only the one with the shortest distance
      const listingMap = new Map<string, any>();

      for (const row of rawListings) {
        const existing = listingMap.get(row.id);
        if (!existing || row.distance < existing.distance) {
          listingMap.set(row.id, row);
        }
      }

      const uniqueListings = Array.from(listingMap.values());

      // Score listings (proximity + freshness)
      const scoredListings = uniqueListings.map(listing => {
        const hoursOld = (now.getTime() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60);
        const proximityScore = (1 / (listing.distance + 1)) * 100;
        const freshnessScore = Math.max(0, 100 - hoursOld * 2);
        const finalScore = (proximityScore * proximityWeight) + (freshnessScore * freshnessWeight);

        return {
          ...listing,
          _score: finalScore,
        };
      });

      const sorted = scoredListings.sort((a, b) => b._score - a._score);
      const limitedListings = sorted.slice(numberOfShownListings, numberOfShownListings + limit);

      const groupsWithAds = await this.getActiveAdGroupsWithGeoMatchedAds(category || 'HOME', lat, lng);

      // 👉 inject ads AFTER slicing `limit` listings
      const listingsWithAds = this.injectAds(limitedListings, groupsWithAds, numberOfShownListings);

      // then return
      return {
        success: true,
        message: 'Listings fetched successfully',
        data: {
          listings: listingsWithAds.map((item) => {
            if (item.__isAd) {
              return {
                type: 'ad',
                id: item.id,
                name: item.name,
                target_url: item.target_url,
                image_url: SojebStorage.url(appConfig().storageUrl.ads + item.image_url),
                views: item.views || 0,
                clicks: item.clicks || 0,
                group_id: item.group_id,
                group_name: item.group_name,
              };
            } else {
              return {
                type: 'listing',
                id: item.id,
                title: item.title,
                slug: item.slug,
                image: item.image,
                category: item.category,
                sub_category: item.sub_category,
                description: item.description,
                status: item.status,
                post_to_usa: item.post_to_usa,
                user: {
                  id: item.user_id,
                  name: item.user_name,
                  avatar: item.user_avatar,
                }
              };
            }
          }),
          numberOfShownListings: numberOfShownListings + limit,
          hasMore: numberOfShownListings + limit < sorted.length,
          listing_cutoff_time: cutoff.toISOString(),
          totalCount: sorted.length,
          totalItems: listingsWithAds.length, // Total items after ads injection
        }
      };


      // // Sort by score and paginate
      // const sorted = scoredListings.sort((a, b) => b._score - a._score);
      // // const paginated = sorted.slice(numberOfShownListings, numberOfShownListings + limit);


      // const groupsWithAds = await this.getActiveAdGroupsWithGeoMatchedAds(category || 'HOME', lat, lng);
      // const paginatedWithAds = this.injectAdsWithPagination(sorted, groupsWithAds, numberOfShownListings, limit);
      // // console.log("Ads fetched:", groupsWithAds);


      // return {
      //   success: true,
      //   message: 'Listings fetched successfully',
      //   data: {
      //     listings: paginatedWithAds.map((item) => {
      //       if (item.__isAd) {
      //         return {
      //           type: 'ad',
      //           id: item.id,
      //           name: item.name,
      //           target_url: item.target_url,
      //           image_url: SojebStorage.url(appConfig().storageUrl.ads + item.image_url),
      //           views: item.views || 0,
      //           clicks: item.clicks || 0,
      //           group_id: item.group_id,
      //           group_name: item.group_name,
      //         };
      //       } else {
      //         return {
      //           type: 'listing',
      //           id: item.id,
      //           title: item.title,
      //           slug: item.slug,
      //           image: item.image,
      //           category: item.category,
      //           sub_category: item.sub_category,
      //           description: item.description,
      //           status: item.status,
      //           post_to_usa: item.post_to_usa,
      //           user: {
      //             id: item.user_id,
      //             name: item.user_name,
      //             avatar: item.user_avatar,
      //           }
      //         };
      //       }
      //     }),
      //     numberOfShownListings: numberOfShownListings + paginatedWithAds.length,
      //     hasMore: numberOfShownListings + paginatedWithAds.length < (sorted.length + groupsWithAds.length * 5), // approx
      //     listing_cutoff_time: cutoff.toISOString(),
      //     totalCount: sorted.length,
      //   }
      // };



      // groupsWithAds.forEach(group => {
      //     group.ads.forEach(ad => {
      //         console.log("Ad details:", ad)
      //     });
      // }
      // );
      // Add ads to the paginated listings

      // Return structured result
      // return {
      //     success: true,
      //     message: 'Listings fetched successfully',
      //     data: {
      //         listings: paginated.map(({ _score, user_id, user_name, user_avatar, ...rest }) => ({
      //             ...rest,
      //             user: {
      //                 id: user_id,
      //                 name: user_name,
      //                 avatar: user_avatar,
      //             }
      //         })),
      //         numberOfShownListings: numberOfShownListings + paginated.length,
      //         hasMore: numberOfShownListings + paginated.length < sorted.length,
      //         listing_cutoff_time: cutoff.toISOString(),
      //         totalCount: uniqueListings.length,
      //     }
      // };
    } catch (error) {
      console.error('Error in findNearbyListings:', error);
      return {
        success: false,
        message: 'Failed to fetch listings',
      };
    }
  }

  injectAds(
    listings: any[],
    adGroups: AdGroupWithAds[],
    numberOfShownListings: number = 0
  ): any[] {
    const result = [...listings];
    const insertions: { index: number; ad: any }[] = [];

    adGroups.forEach((group) => {
      if (group.ads.length === 0 || group.frequency <= 0) return;

      // Calculate how many listings we need to see *after the last ad* before showing the next one
      const sinceLastAd = numberOfShownListings % group.frequency;
      const listingsUntilNextAd = group.frequency - sinceLastAd;

      let nextAdPos = listingsUntilNextAd; // 1-based position in new listings
      let adIndex = 0;

      while (nextAdPos <= result.length) {
        const ad = group.ads[adIndex % group.ads.length];
        insertions.push({
          index: nextAdPos, // Convert to 0-based index
          ad: {
            ...ad,
            __isAd: true,
            group_id: group.group_id,
            group_name: group.group_name,
          },
        });

        adIndex++;
        nextAdPos += group.frequency; // Jump to next frequency interval
      }
    });

    // Insert ads from highest to lowest index (avoid shifting issues)
    insertions.sort((a, b) => b.index - a.index).forEach(({ index, ad }) => {
      result.splice(index, 0, ad);
    });

    return result;
  }

  // injectAdsWithPagination(
  //   listings: any[],
  //   adGroups: AdGroupWithAds[],
  //   offset: number,
  //   limit: number
  // ): any[] {
  //   const result = [...listings];
  //   const insertions: { index: number; ad: any }[] = [];

  //   adGroups.forEach((group) => {
  //     if (group.ads.length === 0 || group.frequency <= 0) return;

  //     let insertIndex = group.frequency;
  //     let adIndex = 0;

  //     while (insertIndex <= result.length + insertions.length + 100) {
  //       const ad = group.ads[adIndex % group.ads.length];
  //       const adItem = {
  //         ...ad,
  //         __isAd: true,
  //         group_id: group.group_id,
  //         group_name: group.group_name,
  //         frequency: group.frequency,
  //       };

  //       insertions.push({ index: insertIndex, ad: adItem });

  //       adIndex++;
  //       insertIndex += group.frequency;
  //     }
  //   });

  //   // Sort insertions to make sure ads are placed in the correct order
  //   insertions.sort((a, b) => a.index - b.index);

  //   // Now inject them while adjusting for shifting indexes
  //   let shift = 0;
  //   for (const { index, ad } of insertions) {
  //     const adjustedIndex = index + shift;
  //     if (adjustedIndex >= result.length) {
  //       result.push(ad);
  //     } else {
  //       result.splice(adjustedIndex, 0, ad);
  //     }
  //     shift++; // array grew by one item
  //   }

  //   return result.slice(offset, offset + limit);
  // }

  // injectAdsWithPagination(
  //   listings: any[],
  //   adGroups: AdGroupWithAds[],
  //   offset: number,
  //   limit: number
  // ): any[] {
  //   const result = [...listings];

  //   // Only process enough items to cover our pagination window
  //   const maxPosition = offset + limit;
  //   const insertions: { index: number; ad: any }[] = [];

  //   adGroups.forEach((group) => {
  //     if (group.ads.length === 0 || group.frequency <= 0) return;

  //     let insertIndex = group.frequency;
  //     let adIndex = 0;

  //     while (insertIndex <= maxPosition) {
  //       const ad = group.ads[adIndex % group.ads.length];
  //       insertions.push({
  //         index: insertIndex,
  //         ad: {
  //           ...ad,
  //           __isAd: true,
  //           group_id: group.group_id,
  //           group_name: group.group_name
  //         }
  //       });

  //       adIndex++;
  //       insertIndex += group.frequency;
  //     }
  //   });

  //   // Sort and inject ads
  //   insertions.sort((a, b) => a.index - b.index);

  //   let shift = 0;
  //   for (const { index, ad } of insertions) {
  //     const adjustedIndex = index + shift;
  //     if (adjustedIndex <= maxPosition) {  // Only insert if within our window
  //       result.splice(adjustedIndex, 0, ad);
  //       shift++;
  //     }
  //   }

  //   return result.slice(offset, offset + limit);
  // }


  async getActiveAdGroupsWithGeoMatchedAds(
    category: string,
    lat: number,
    lng: number
  ): Promise<AdGroupWithAds[]> {
    const now = new Date();

    const adGroups = await this.prisma.adGroup.findMany({
      where: {
        display_pages: {
          has: category as any,
        },
        active: true,
        OR: [
          {
            start_date: {
              lte: now,
            },
            end_date: {
              gte: now,
            },
          },
          {
            start_date: null,
            end_date: null,
          },
        ],
      },
      include: {
        ads: {
          where: {
            active: true,
            OR: [
              {
                adCities: {
                  some: {
                    city: {
                      latitude: lat,
                      longitude: lng,
                    },
                  },
                },
              },
              {
                adCities: {
                  none: {},
                },
              },
            ],
          },
          include: {
            adCities: {
              include: {
                city: true,
              },
            },
          },
        },
      },
    });

    const result: AdGroupWithAds[] = adGroups.map((group) => ({
      group_id: group.id,
      group_name: group.name,
      display_pages: group.display_pages,
      frequency: group.frequency,
      ads: group.ads.map((ad) => ({
        id: ad.id,
        name: ad.name,
        target_url: ad.target_url,
        image_url: ad.image,
        views: ad.views || 0,
        clicks: ad.clicks || 0,
      })),
    }));

    return result.filter((group) => group.ads.length > 0);
  }


  async findAll(userId: string) {
    try {
      const listings = await this.prisma.listing.findMany({
        where: { user_id: userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          // cities: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Add image URL to each listing
      listings.forEach(listing => {
        if (listing.image) {
          listing['image_url'] = SojebStorage.url(appConfig().storageUrl.listing + listing.image);
        }
      });

      return {
        success: true,
        message: 'Listings fetched successfully',
        data: listings,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch listings',
      };
    }
  }

  async findOne(idOrSlug: string) {
    try {
      const listing = await this.prisma.listing.findUnique({
        where: {
          id: idOrSlug,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          cities: true,
        },
      });

      if (!listing) {
        return {
          success: false,
          message: 'Listing not found',
        };
      }

      // add image URL
      if (listing.image) {
        listing['image_url'] = SojebStorage.url(appConfig().storageUrl.listing + listing.image);
      }

      return {
        success: true,
        message: 'Listing fetched successfully',
        data: listing,
      };
    } catch (error) {
      console.error('Error fetching listing:', error);
      return {
        success: false,
        message: 'Failed to fetch listing',
      };
    }
  }

  async update(id: string, updateListingDto: UpdateListingDto, image?: Express.Multer.File) {
    try {
      // find existing listing first
      const existingListing = await this.prisma.listing.findUnique({
        where: {
          id,
          user_id: updateListingDto.user_id, // Ensure the user owns the listing
        },
      });

      if (!existingListing) {
        return {
          success: false,
          message: 'Listing not found',
        };
      }

      // Prepare data for update
      const data: any = {};
      if (updateListingDto.title) data.title = updateListingDto.title;
      if (updateListingDto.description) data.description = updateListingDto.description;
      if (updateListingDto.category) data.category = updateListingDto.category;
      if (updateListingDto.sub_category) data.sub_category = updateListingDto.sub_category;
      if (updateListingDto.post_to_usa == true || updateListingDto.post_to_usa == false) data.post_to_usa = updateListingDto.post_to_usa;



      // Handle image upload
      if (image) {
        // Delete old image from storage if it exists
        if (existingListing.image) {
          await SojebStorage.delete(appConfig().storageUrl.listing + existingListing.image);
        }
        data.image = image.filename;
      }

      // Generate slug if title is provided
      if (updateListingDto.title) {
        const baseSlug = generateSlug(updateListingDto.title);
        let slug = baseSlug;
        let counter = 1;

        while (await this.prisma.listing.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter++}`;
        }
        data.slug = slug;
      }

      // If cities are provided, handle them
      if (updateListingDto.cities && updateListingDto.cities.length > 0) {
        // Find or create cities
        const cityIds = await Promise.all(
          updateListingDto.cities.map(async (city) => {
            // Try to find existing city first
            const existingCity = await this.prisma.city.findFirst({
              where: {
                address: city.address,
                latitude: city.latitude,
                longitude: city.longitude
              },
            });

            if (existingCity) return existingCity.id;

            // Create new city with proper geometry
            const newCity = await this.prisma.$queryRaw`
              INSERT INTO "cities" (
                id, 
                address, 
                latitude, 
                longitude, 
                location, 
                created_at, 
                updated_at
              )
              VALUES (
                ${cuid()},
                ${city.address}, 
                ${city.latitude}, 
                ${city.longitude}, 
                ST_SetSRID(ST_Point(${city.longitude}, ${city.latitude}), 4326),
                NOW(),
                NOW()
              )
              RETURNING id;
            `;

            return newCity[0].id;
          })
        );

        // Update listing with new cities
        data.cities = {
          set: [], // Clear existing connections
          connect: cityIds.map(id => ({ id })),
        };
      }

      // Update the listing
      const updatedListing = await this.prisma.listing.update({
        where: { id },
        data,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          cities: true, // Include cities to return them in the response
        }
      });

      // Add image URL to the updated listing
      if (updatedListing.image) {
        updatedListing['image_url'] = SojebStorage.url(appConfig().storageUrl.listing + updatedListing.image);
      }



      return {
        success: true,
        message: 'Listing updated successfully',
        data: updatedListing,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update listing',
      };
    }
  }

  async remove(id: string, userId: string) {
    try {
      // find listing first to ensure it exists
      const existingListing = await this.prisma.listing.findUnique({
        where: {
          id,
          user_id: userId, // Ensure the user owns the listing
        },
      });

      if (!existingListing) {
        return {
          success: false,
          message: 'Listing not found or you do not have permission to delete it',
        };
      }

      // Delete the image from storage if it exists
      if (existingListing.image) {
        await SojebStorage.delete(appConfig().storageUrl.listing + existingListing.image);
      }

      // Delete the listing from the database
      await this.prisma.listing.delete({
        where: {
          id,
        },
      });

      return {
        success: true,
        message: 'Listing deleted successfully',
      };
    } catch (error) {
      // console.error('Error deleting listing:', error);
      return {
        success: false,
        message: 'Failed to delete listing',
      };
    }
  }

  // async reportListing(id: string, userId: string) {
  async reportListing(id: string, userId: string, reportType?: string) {
    try {

      // Check if the listing exists
      const listing = await this.prisma.listing.findUnique({
        where: {
          id,
        },
      });

      if (!listing) {
        return {
          success: false,
          message: 'Listing not found',
        };
      }

      // Check if the user has already reported this listing
      const existingReport = await this.prisma.report.findFirst({
        where: {
          listing_id: id,
          user_id: userId,
          report_type: (reportType as any) || 'NORMAL' as any, // Cast to enum type to satisfy Prisma
        },
      });

      if (existingReport) {
        return {
          success: false,
          message: 'You have already reported this listing',
        };
      }

      // Create a new report
      const report = await this.prisma.report.create({
        data: {
          listing_id: id,
          user_id: userId,
          report_type: (reportType as any) || 'NORMAL' as any, // Cast to enum type to satisfy Prisma
        },
      });


      return {
        success: true,
        message: 'Listing reported successfully',
        // report: report
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to report listing',
      };
    }
  }

}
