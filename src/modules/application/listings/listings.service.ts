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
import { config } from 'process';




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

      // console.log(otherData)

      // filter cities with address, latitude, and longitude
      const filteredCities = cities.filter(city => city.address && city.latitude && city.longitude);
      // If no cities with address, latitude, and longitude, return error
      if (filteredCities.length === 0) {
        return {
          success: false,
          message: 'At least one city with address, latitude, and longitude is required',
        };
      }



      // Process within a transaction
      return await this.prisma.$transaction(async (prisma) => {
        // Process all cities - find or create
        const cityIds = await Promise.all(
          filteredCities.map(async (city) => {
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

        // console.log(cities[0])


        const isUsa = otherData?.post_to_usa === true || (otherData?.post_to_usa as any) === "true";
        // console.log("Is usa => ", isUsa)

        // Prepare listing data
        const data: any = {
          category: otherData.category,
          sub_category: otherData.sub_category,
          title: otherData.title,
          description: otherData.description,
          post_to_usa: isUsa || false,
          user_id: otherData.user_id,
          status: 'APPROVED', // Make sure this is set
          address: otherData.address || '',
          latitude: Number(otherData?.latitude) || 0,
          longitude: Number(otherData?.longitude) || 0,
          radius: Number(otherData.radius) || 0,
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
        if (image) {
          // upload image
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}${image.originalname.replace(/\s+/g, '-')}`;

          await SojebStorage.put("listing/" + fileName, image.buffer);

          data.image = fileName;
        }

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
      },
        { timeout: 100000 }
      );
    } catch (error) {
      // console.error("Listing creation error:", error);
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

  //   async findNearbyListings(
  //     lat: number,
  //     lng: number,
  //     radius: number,
  //     limit = 10,
  //     numberOfShownListings = 0,
  //     listing_cutoff_time?: string,
  //     category?: string,
  //     sub_category?: string,
  //     search?: string,
  //     is_usa?: boolean,
  //     userSession?: any,
  //   ) {
  //     try {
  //       const radiusInMeters = radius * 1609.34;
  //       const now = new Date();
  //       const cutoff = listing_cutoff_time ? new Date(listing_cutoff_time) : now;
  //       const cutoffISO = cutoff.toISOString();
  //       const proximityWeight = .5;
  //       const freshnessWeight = .5;

  //       // find listings with post_to_usa = true and status = 'APPROVED'
  //       // const test = await this.prisma.$queryRawUnsafe(`
  //       //   SELECT 
  //       //     l.id,
  //       //     l.title,
  //       //     l.description,
  //       //     l.category,
  //       //     l.sub_category,
  //       //     l.status,
  //       //     l.usa_listing_status,
  //       //     l.post_to_usa,
  //       //     l.created_at,
  //       //     l.updated_at,
  //       //     u.id AS user_id,
  //       //     u.name AS user_name,
  //       //     u.avatar AS user_avatar
  //       //   FROM listings l
  //       //   JOIN users u ON u.id = l.user_id
  //       //   JOIN "_ListingCities" lc ON lc."B" = l.id
  //       //       JOIN cities c ON c.id = lc."A"
  //       //   WHERE ST_DWithin(
  //       //           c.location::geography,
  //       //           ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography,
  //       //           ${radiusInMeters}
  //       //       )
  //       //     AND l.usa_listing_status = 'APPROVED'
  //       //     AND l.created_at <= '${cutoffISO}'::timestamp;
  //       // `);


  //       // console.log("Test => ", test)
  //       // Start building the WHERE conditions
  //       // let whereConditions = `
  //       //       WHERE ST_DWithin(
  //       //           c.location::geography,
  //       //           ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography,
  //       //           ${radiusInMeters}
  //       //       )
  //       //       AND l.created_at <= '${cutoffISO}'::timestamp
  //       //   `;

  //       // // Add filters conditionally
  //       // if (category) {
  //       //   whereConditions += ` AND l.category = '${category.replace(/'/g, "''")}'`;
  //       // }
  //       // if (sub_category) {
  //       //   whereConditions += ` AND l.sub_category = '${sub_category.replace(/'/g, "''")}'`;
  //       // }

  //       // if (search) {
  //       //   whereConditions += ` AND (l.title ILIKE '%${search.replace(/'/g, "''")}%' OR l.description ILIKE '%${search.replace(/'/g, "''")}%')`;
  //       // }

  //       // // console.log("Is usa => ", is_usa)

  //       // if (is_usa === true) {
  //       //   whereConditions += ` AND l.post_to_usa = true`;
  //       //   whereConditions += ` AND l.usa_listing_status = 'APPROVED'`;
  //       // } else {
  //       //   whereConditions += ` AND l.status = 'APPROVED'`;
  //       // }


  //       // Start building the WHERE conditions
  //       let whereConditions = ` WHERE l.created_at <= '${cutoffISO}'::timestamp`;

  //       // If is_usa is true, bypass the proximity check and apply the USA-specific filters
  //       if (is_usa === true) {
  //         whereConditions += ` AND l.post_to_usa = true`;
  //         whereConditions += ` AND l.usa_listing_status = 'APPROVED'`;
  //       } else {
  //         whereConditions += `
  //         AND ST_DWithin(
  //           c.location::geography,
  //           ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography,
  //           ${radiusInMeters}
  //         )`;
  //       }

  //       // Add category, sub_category, and search filters conditionally
  //       if (category) {
  //         whereConditions += ` AND l.category = '${category.replace(/'/g, "''")}'`;
  //       }
  //       if (sub_category) {
  //         whereConditions += ` AND l.sub_category = '${sub_category.replace(/'/g, "''")}'`;
  //       }
  //       if (search) {
  //         whereConditions += ` AND (l.title ILIKE '%${search.replace(/'/g, "''")}%' OR l.description ILIKE '%${search.replace(/'/g, "''")}%')`;
  //       }


  //       // Build the complete query
  //       const query = `
  //             SELECT 
  //                 l.id,
  //                 l.created_at,
  //                 l.slug,
  //                 l.title,
  //                 l.description,
  //                 l.image,
  //                 l.category,
  //                 l.sub_category,
  //                 l.status,
  //                 l.usa_listing_status,
  //                 l.post_to_usa,
  //                 l.address,
  //                 l.created_at,
  //                 l.updated_at,
  //                 u.id AS user_id,
  //                 u.name AS user_name,
  //                 u.avatar AS user_avatar,
  //                 ST_Distance(
  //                     c.location::geography,
  //                     ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography
  //                 ) / 1609.34 AS distance
  //             FROM listings l
  //             JOIN "_ListingCities" lc ON lc."B" = l.id
  //             JOIN cities c ON c.id = lc."A"
  //             JOIN users u ON u.id = l.user_id
  //             ${whereConditions}
  //         `;

  //       // Execute the query
  //       const rawListings: any = await this.prisma.$queryRawUnsafe(query);

  //       // Rest of your processing logic remains the same...
  //       if (!rawListings.length) {
  //         return {
  //           success: true,
  //           message: 'No listings found within the specified radius',
  //           data: {
  //             listings: [],
  //             numberOfShownListings: 0,
  //             hasMore: false,
  //             listing_cutoff_time: cutoff.toISOString(),
  //           }
  //         };
  //       }

  //       // Group listings by ID, keeping only the one with the shortest distance
  //       const listingMap = new Map<string, any>();

  //       for (const row of rawListings) {
  //         const existing = listingMap.get(row.id);
  //         if (!existing || row.distance < existing.distance) {
  //           listingMap.set(row.id, row);
  //         }
  //       }

  //       const uniqueListings = Array.from(listingMap.values());

  //       // Score listings (proximity + freshness)
  //       const scoredListings = uniqueListings.map(listing => {
  //         const hoursOld = (now.getTime() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60);
  //         const proximityScore = (1 / (listing.distance + 1)) * 100;
  //         const freshnessScore = Math.max(0, 100 - hoursOld * 2);
  //         const finalScore = (proximityScore * proximityWeight) + (freshnessScore * freshnessWeight);

  //         return {
  //           ...listing,
  //           _score: finalScore,
  //         };
  //       });

  //       const sorted = scoredListings.sort((a, b) => b._score - a._score);
  //       const limitedListings = sorted.slice(numberOfShownListings, numberOfShownListings + limit);

  //       const groupsWithAds = await this.getActiveAdGroupsWithGeoMatchedAds(category || 'HOME', lat, lng);

  //       // 👉 inject ads AFTER slicing `limit` listings
  //       const listingsWithAds = this.injectAds(limitedListings, groupsWithAds, numberOfShownListings, userSession);

  //       // then return
  //       return {
  //         success: true,
  //         message: 'Listings fetched successfully',
  //         data: {
  //           listings: listingsWithAds.map((item) => {
  //             if (item.__isAd) {
  //               return {
  //                 type: 'ad',
  //                 id: item.id,
  //                 name: item.name,
  //                 target_url: item.target_url,
  //                 image_url: SojebStorage.url(appConfig().storageUrl.ads + item.image_url),
  //                 views: item.views || 0,
  //                 clicks: item.clicks || 0,
  //                 group_id: item.group_id,
  //                 group_name: item.group_name,
  //               };
  //             } else {
  //               return {
  //                 type: 'listing',
  //                 id: item.id,
  //                 title: item.title,
  //                 slug: item.slug,
  //                 image: item.image,
  //                 category: item.category,
  //                 sub_category: item.sub_category,
  //                 description: item.description,
  //                 status: item.status,
  //                 usa_listing_status: item.usa_listing_status,
  //                 post_to_usa: item.post_to_usa,
  //                 address: item.address,
  //                 created_at: item.created_at,
  //                 updated_at: item.updated_at,
  //                 user: {
  //                   id: item.user_id,
  //                   name: item.user_name,
  //                   avatar: item.user_avatar,
  //                 }
  //               };
  //             }
  //           }),
  //           numberOfShownListings: numberOfShownListings + limit,
  //           hasMore: numberOfShownListings + limit < sorted.length,
  //           listing_cutoff_time: cutoff.toISOString(),
  //           totalCount: sorted.length,
  //           totalItems: listingsWithAds.length, // Total items after ads injection
  //         }
  //       };


  //       // // Sort by score and paginate
  //       // const sorted = scoredListings.sort((a, b) => b._score - a._score);
  //       // // const paginated = sorted.slice(numberOfShownListings, numberOfShownListings + limit);


  //       // const groupsWithAds = await this.getActiveAdGroupsWithGeoMatchedAds(category || 'HOME', lat, lng);
  //       // const paginatedWithAds = this.injectAdsWithPagination(sorted, groupsWithAds, numberOfShownListings, limit);
  //       // // console.log("Ads fetched:", groupsWithAds);


  //       // return {
  //       //   success: true,
  //       //   message: 'Listings fetched successfully',
  //       //   data: {
  //       //     listings: paginatedWithAds.map((item) => {
  //       //       if (item.__isAd) {
  //       //         return {
  //       //           type: 'ad',
  //       //           id: item.id,
  //       //           name: item.name,
  //       //           target_url: item.target_url,
  //       //           image_url: SojebStorage.url(appConfig().storageUrl.ads + item.image_url),
  //       //           views: item.views || 0,
  //       //           clicks: item.clicks || 0,
  //       //           group_id: item.group_id,
  //       //           group_name: item.group_name,
  //       //         };
  //       //       } else {
  //       //         return {
  //       //           type: 'listing',
  //       //           id: item.id,
  //       //           title: item.title,
  //       //           slug: item.slug,
  //       //           image: item.image,
  //       //           category: item.category,
  //       //           sub_category: item.sub_category,
  //       //           description: item.description,
  //       //           status: item.status,
  //       //           post_to_usa: item.post_to_usa,
  //       //           user: {
  //       //             id: item.user_id,
  //       //             name: item.user_name,
  //       //             avatar: item.user_avatar,
  //       //           }
  //       //         };
  //       //       }
  //       //     }),
  //       //     numberOfShownListings: numberOfShownListings + paginatedWithAds.length,
  //       //     hasMore: numberOfShownListings + paginatedWithAds.length < (sorted.length + groupsWithAds.length * 5), // approx
  //       //     listing_cutoff_time: cutoff.toISOString(),
  //       //     totalCount: sorted.length,
  //       //   }
  //       // };



  //       // groupsWithAds.forEach(group => {
  //       //     group.ads.forEach(ad => {
  //       //         console.log("Ad details:", ad)
  //       //     });
  //       // }
  //       // );
  //       // Add ads to the paginated listings

  //       // Return structured result
  //       // return {
  //       //     success: true,
  //       //     message: 'Listings fetched successfully',
  //       //     data: {
  //       //         listings: paginated.map(({ _score, user_id, user_name, user_avatar, ...rest }) => ({
  //       //             ...rest,
  //       //             user: {
  //       //                 id: user_id,
  //       //                 name: user_name,
  //       //                 avatar: user_avatar,
  //       //             }
  //       //         })),
  //       //         numberOfShownListings: numberOfShownListings + paginated.length,
  //       //         hasMore: numberOfShownListings + paginated.length < sorted.length,
  //       //         listing_cutoff_time: cutoff.toISOString(),
  //       //         totalCount: uniqueListings.length,
  //       //     }
  //       // };
  //     } catch (error) {
  //       console.error('Error in findNearbyListings:', error);
  //       return {
  //         success: false,
  //         message: 'Failed to fetch listings',
  //       };
  //     }
  //   }


  //   injectAds(
  //     listings: any[],
  //     adGroups: any[],
  //     numberOfShownListings: number = 0,
  //     userSession: any // Assuming session is passed in from the controller
  // ): any[] {

  //     console.log("User session => ", userSession);
  //     console.log("Ad groups => ", adGroups);
  //     const result = [...listings];
  //     const insertions: { index: number; ad: any }[] = [];

  //     // Iterate over each ad group
  //     adGroups.forEach((group) => {
  //         if (group.ads.length === 0 || group.frequency <= 0) return;

  //         // Retrieve the last shown ad index for the user from the session, specific to this group
  //         let lastAdIndex = userSession?.lastAdIndex?.[group.group_id] || 0;

  //         // Calculate the position where the next ad will be injected
  //         const sinceLastAd = numberOfShownListings % group.frequency;
  //         const listingsUntilNextAd = group.frequency - sinceLastAd;

  //         let nextAdPos = listingsUntilNextAd; // Position for the first ad insertion
  //         let adIndex = (lastAdIndex + Math.floor(numberOfShownListings / group.frequency)) % group.ads.length;

  //         // Loop to insert ads for this group based on the frequency
  //         while (nextAdPos <= result.length) {
  //             const ad = group.ads[adIndex % group.ads.length]; // Ensure we cycle through ads

  //             insertions.push({
  //                 index: nextAdPos,
  //                 ad: { ...ad, __isAd: true, group_id: group.group_id, group_name: group.group_name },
  //             });

  //             adIndex++;
  //             nextAdPos += group.frequency; // Move to the next position for the ad
  //         }

  //         // Check if userSession.lastAdIndex exists, if not, initialize it
  //         if (!userSession.lastAdIndex) {
  //             userSession.lastAdIndex = {};
  //         }

  //         // Now, update the last ad index correctly for this group, so it persists for the next page
  //         userSession.lastAdIndex[group.group_id] = adIndex % group.ads.length;

  //     });

  //     // Insert the ads in the correct order
  //     insertions.sort((a, b) => b.index - a.index).forEach(({ index, ad }) => {
  //         result.splice(index, 0, ad); // Insert ads in the sorted order
  //     });

  //     return result;
  // }




  // injectAds(
  //   listings: any[],
  //   adGroups: any[],
  //   numberOfShownListings: number = 0,
  //   userSession: any // Assuming session is passed in from the controller
  // ): any[] {

  //   console.log("User session => ", userSession)
  //   console.log("Ad groups => ", adGroups)
  //   const result = [...listings];
  //   const insertions: { index: number; ad: any }[] = [];

  //   adGroups.forEach((group) => {
  //     if (group.ads.length === 0 || group.frequency <= 0) return;

  //     // Retrieve the last shown ad index for the user from the session
  //     const lastAdIndex = userSession?.lastAdIndex?.[group.group_id] || 0;

  //     // Calculate the position where the next ad will be injected
  //     const sinceLastAd = numberOfShownListings % group.frequency;
  //     const listingsUntilNextAd = group.frequency - sinceLastAd;

  //     let nextAdPos = listingsUntilNextAd; // Position for the first ad insertion
  //     let adIndex = (lastAdIndex + Math.floor(numberOfShownListings / group.frequency)) % group.ads.length;

  //     while (nextAdPos <= result.length) {
  //       const ad = group.ads[adIndex % group.ads.length];

  //       insertions.push({
  //         index: nextAdPos,
  //         ad: { ...ad, __isAd: true, group_id: group.group_id, group_name: group.group_name },
  //       });

  //       adIndex++;
  //       nextAdPos += group.frequency;
  //     }

  //     // Check if userSession.lastAdIndex exists, if not, initialize it
  //     if (!userSession.lastAdIndex) {
  //       userSession.lastAdIndex = {};
  //     }

  //     // Now assign the ad index to the appropriate group
  //     userSession.lastAdIndex[group.group_id] = adIndex % group.ads.length;
  //     // Update the last shown ad index for the user in the session
  //     // userSession?.lastAdIndex?.[group.group_id] = adIndex % group.ads.length;
  //   });

  //   // Insert the ads in the correct order
  //   insertions.sort((a, b) => b.index - a.index).forEach(({ index, ad }) => {
  //     result.splice(index, 0, ad);
  //   });

  //   return result;
  // }

  // injectAds(
  //   listings: any[],
  //   adGroups: AdGroupWithAds[],
  //   numberOfShownListings: number = 0, // Total listings shown before the current page
  //   itemsPerPage: number // Number of listings per page
  // ) {
  //   const result = [...listings];
  //   const insertions: { index: number; ad: any }[] = [];

  //   adGroups.forEach((group) => {
  //     if (group.ads.length === 0 || group.frequency <= 0) return;

  //     // Calculate the total number of ads shown for this group before the current page
  //     const totalAdsShownPreviously = Math.floor(numberOfShownListings / group.frequency);

  //     // Calculate the starting ad index for this group
  //     let adIndex = totalAdsShownPreviously % group.ads.length;

  //     // Calculate the position of the first ad in the current page
  //     const sinceLastAd = numberOfShownListings % group.frequency;
  //     let nextAdPos = sinceLastAd === 0 ? group.frequency : group.frequency - sinceLastAd;

  //     // Insert ads within the current page
  //     while (nextAdPos < itemsPerPage && nextAdPos <= result.length) {
  //       const ad = group.ads[adIndex % group.ads.length];

  //       insertions.push({
  //         index: nextAdPos,
  //         ad: {
  //           ...ad,
  //           __isAd: true,
  //           group_id: group.group_id,
  //           group_name: group.group_name,
  //         },
  //       });

  //       adIndex++;
  //       nextAdPos += group.frequency;
  //     }
  //   });

  //   // Sort insertions by index in descending order to avoid shifting issues
  //   insertions.sort((a, b) => b.index - a.index).forEach(({ index, ad }) => {
  //     result.splice(index, 0, ad);
  //   });

  //   return result;
  // }





  // injectAds(
  //   listings: any[],
  //   adGroups: AdGroupWithAds[],
  //   numberOfShownListings: number = 0
  // ): any[] {
  //   const result = [...listings];
  //   const insertions: { index: number; ad: any }[] = [];

  //   adGroups.forEach((group) => {
  //     if (group.ads.length === 0 || group.frequency <= 0) return;

  //     // Calculate how many listings we need to see after the last ad before showing the next one
  //     const sinceLastAd = numberOfShownListings % group.frequency;
  //     const listingsUntilNextAd = group.frequency - sinceLastAd;

  //     let nextAdPos = listingsUntilNextAd; // Position for the first ad insertion
  //     const totalAdsShownPreviously = Math.floor(numberOfShownListings / group.frequency);

  //     // Track the ad index based on total ads shown previously
  //     let adIndex = totalAdsShownPreviously % group.ads.length; 

  //     // Now, we start inserting ads at the correct position and continue through pagination
  //     while (nextAdPos <= result.length) {
  //       const ad = group.ads[adIndex % group.ads.length]; // Get the ad based on adIndex

  //       insertions.push({
  //         index: nextAdPos, // Insert the ad at the calculated position
  //         ad: {
  //           ...ad,
  //           __isAd: true,
  //           group_id: group.group_id,
  //           group_name: group.group_name,
  //         },
  //       });

  //       // Move to the next position for the next ad
  //       adIndex++;
  //       nextAdPos += group.frequency; // Skip to the next interval
  //     }
  //   });

  //   // Insert the ads in the correct order (highest index first)
  //   insertions.sort((a, b) => b.index - a.index).forEach(({ index, ad }) => {
  //     result.splice(index, 0, ad);
  //   });

  //   return result;
  // }




  // injectAds(
  //   listings: any[],
  //   adGroups: AdGroupWithAds[],
  //   numberOfShownListings: number = 0
  // ): any[] {
  //   const result = [...listings];
  //   const insertions: { index: number; ad: any }[] = [];

  //   adGroups.forEach((group) => {
  //     if (group.ads.length === 0 || group.frequency <= 0) return;

  //     // Calculate how many listings we need to see *after the last ad* before showing the next one
  //     const sinceLastAd = numberOfShownListings % group.frequency;
  //     const listingsUntilNextAd = group.frequency - sinceLastAd;

  //     let nextAdPos = listingsUntilNextAd; // 1-based position in new listings
  //     const totalAdsShownPreviously = Math.floor(numberOfShownListings / group.frequency);
  //     let adIndex = totalAdsShownPreviously % group.ads.length;
  //     // let adIndex = 0;

  //     while (nextAdPos <= result.length) {
  //       const ad = group.ads[adIndex % group.ads.length];
  //       insertions.push({
  //         index: nextAdPos, // Convert to 0-based index
  //         ad: {
  //           ...ad,
  //           __isAd: true,
  //           group_id: group.group_id,
  //           group_name: group.group_name,
  //         },
  //       });

  //       adIndex++;
  //       nextAdPos += group.frequency; // Jump to next frequency interval
  //     }
  //   });

  //   // Insert ads from highest to lowest index (avoid shifting issues)
  //   insertions.sort((a, b) => b.index - a.index).forEach(({ index, ad }) => {
  //     result.splice(index, 0, ad);
  //   });

  //   return result;
  // }


  // injectAdsWithPagination(
  //   listings: any[],
  //   adGroups: AdGroupWithAds[],
  //   numberOfShownListings: number = 0
  // ): any[] {
  //   const result = [...listings];
  //   const insertions: { index: number; ad: any }[] = [];

  //   adGroups.forEach((group) => {
  //     if (group.ads.length === 0 || group.frequency <= 0) return;

  //     // Calculate the global position range for this batch
  //     const startGlobalPos = numberOfShownListings;
  //     const endGlobalPos = numberOfShownListings + listings.length - 1;

  //     // Find the first ad position in this range
  //     const firstAdPos = Math.max(
  //       Math.ceil((startGlobalPos + 1) / group.frequency) * group.frequency - 1,
  //       startGlobalPos
  //     );

  //     // Iterate through all ad positions in this range
  //     for (let globalPos = firstAdPos; globalPos <= endGlobalPos; globalPos += group.frequency) {
  //       // Calculate which ad to show (consistent across pagination)
  //       const adIndex = Math.floor(globalPos / group.frequency) % group.ads.length;
  //       const ad = group.ads[adIndex];

  //       // Calculate local position within this batch
  //       const localPos = globalPos - startGlobalPos;

  //       // Only insert if the position is within our current batch
  //       if (localPos >= 0 && localPos <= result.length) {
  //         insertions.push({
  //           index: localPos,
  //           ad: {
  //             ...ad,
  //             __isAd: true,
  //             group_id: group.group_id,
  //             group_name: group.group_name,
  //           },
  //         });
  //       }
  //     }
  //   });

  //   // Insert ads from highest to lowest index to avoid shifting issues
  //   insertions.sort((a, b) => b.index - a.index).forEach(({ index, ad }) => {
  //     result.splice(index, 0, ad);
  //   });

  //   return result;
  // }

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


  // async getActiveAdGroupsWithGeoMatchedAds(
  //   category: string,
  //   lat: number,
  //   lng: number
  // ): Promise<AdGroupWithAds[]> {
  //   const now = new Date();

  //   // console.log("Category:", category)

  //   const pages = ["HOME", "RIDES", "MARKETPLACE", "JOBS", "ACCOMMODATIONS"]
  //   if (!pages.includes(category)) {
  //     return [];
  //   }


  //   const adGroups = await this.prisma.adGroup.findMany({
  //     where: {
  //       display_pages: {
  //         has: category as any,
  //       },
  //       active: true,
  //       OR: [
  //         {
  //           start_date: {
  //             lte: now,
  //           },
  //           end_date: {
  //             gte: now,
  //           },
  //         },
  //         {
  //           start_date: null,
  //           end_date: null,
  //         },
  //       ],
  //     },
  //     include: {
  //       ads: {
  //         where: {
  //           active: true,
  //           OR: [
  //             {
  //               adCities: {
  //                 some: {
  //                   city: {
  //                     latitude: lat,
  //                     longitude: lng,
  //                   },
  //                 },
  //               },
  //             },
  //             {
  //               adCities: {
  //                 none: {},
  //               },
  //             },
  //           ],
  //         },
  //         include: {
  //           adCities: {
  //             include: {
  //               city: true,
  //             },
  //           },
  //         },
  //         orderBy: {
  //           created_at: "asc",
  //         }
  //       },
  //     },
  //   });

  //   // const result: AdGroupWithAds[] = adGroups.map((group) => ({
  //   //   group_id: group.id,
  //   //   group_name: group.name,
  //   //   display_pages: group.display_pages,
  //   //   frequency: group.frequency,
  //   //   ads: group.ads.map((ad) => ({
  //   //     id: ad.id,
  //   //     name: ad.name,
  //   //     target_url: ad.target_url,
  //   //     image_url: ad.image,
  //   //     views: ad.views || 0,
  //   //     clicks: ad.clicks || 0,
  //   //   })),
  //   // }));

  //   // Increment the views for each ad
  //   const result: AdGroupWithAds[] = await Promise.all(
  //     adGroups.map(async (group) => {
  //       const updatedAds = await Promise.all(
  //         group.ads.map(async (ad) => {
  //           // Increment the views by 1
  //           const updatedAd = await this.prisma.ad.update({
  //             where: { id: ad.id },
  //             data: {
  //               views: {
  //                 increment: 1,
  //               },
  //             },
  //           });

  //           return {
  //             id: updatedAd.id,
  //             name: updatedAd.name,
  //             target_url: updatedAd.target_url,
  //             image_url: updatedAd.image,
  //             views: updatedAd.views,
  //             clicks: updatedAd.clicks || 0,
  //           };
  //         })
  //       );

  //       return {
  //         group_id: group.id,
  //         group_name: group.name,
  //         display_pages: group.display_pages,
  //         frequency: group.frequency,
  //         ads: updatedAds,
  //       };
  //     })
  //   );

  //   return result.filter((group) => group.ads.length > 0);
  // }


  async findAll(userId: string) {
    try {
      const listings = await this.prisma.listing.findMany({
        where: {
          user_id: userId,
          NOT: {
            status: 'DELETED'
          }
        },
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
      const listing = await this.prisma.listing.findFirst({
        where: {
          OR: [
            { id: idOrSlug },
            { slug: idOrSlug },
          ],
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
      if (updateListingDto.post_to_usa == true || updateListingDto.post_to_usa == false) {
        data.post_to_usa = updateListingDto.post_to_usa
        // data.usa_listing_status = ListingStatus.PENDING
      };
      if (updateListingDto.radius) data.radius = Number(updateListingDto.radius);
      if (updateListingDto.address && updateListingDto.latitude && updateListingDto.longitude) {
        data.address = updateListingDto.address;
        data.latitude = updateListingDto.latitude;
        data.longitude = updateListingDto.longitude;
      }




      // Handle image upload
      if (image) {
        // Delete old image from storage if it exists
        if (existingListing.image) {
          await SojebStorage.delete(appConfig().storageUrl.listing + existingListing.image);
        }
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        const fileName = `${randomName}${image.originalname.replace(/\s+/g, '-')}`;

        await SojebStorage.put("listing/" + fileName, image.buffer);
        data.image = fileName
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



      // filter cities latitude and longitude and address
      const filteredCities = updateListingDto.cities.filter(city => city.latitude && city.longitude && city.address);

      // If cities are provided, handle them
      if (filteredCities && filteredCities.length > 0) {
        // // updated address, latitude, longitude
        // data.latitude = filteredCities[0].latitude;
        // data.longitude = filteredCities[0].longitude;
        // data.address = filteredCities[0].address;


        // Find or create cities
        const cityIds = await Promise.all(
          filteredCities.map(async (city) => {
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


  calculateDistanceInMiles(lat1, lon1, lat2, lon2) {
    // Convert degrees to radians
    const radianLat1 = lat1 * (Math.PI / 180);
    const radianLon1 = lon1 * (Math.PI / 180);
    const radianLat2 = lat2 * (Math.PI / 180);
    const radianLon2 = lon2 * (Math.PI / 180);

    // Haversine formula
    const dLat = radianLat2 - radianLat1;
    const dLon = radianLon2 - radianLon1;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(radianLat1) * Math.cos(radianLat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Radius of the Earth in miles (3959)
    const radius = 3959;

    // Calculate the distance
    const distance = radius * c;

    return distance;
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
    is_usa?: boolean,
    userSession?: any,
  ) {
    try {
      const radiusInMeters = radius * 1609.34;
      const now = new Date();
      const cutoff = listing_cutoff_time ? new Date(listing_cutoff_time) : now;
      const cutoffISO = cutoff.toISOString();
      const proximityWeight = Number(process.env.PROXIMITY_WEIGHT);
      const freshnessWeight = Number(process.env.FRESHNESS_WEIGHT);
      // const proximityWeight = 0.5
      // const freshnessWeight = 0.5


      // Initialize session ad tracking if not exists
      if (!userSession?.adTracking) {
        userSession.adTracking = {};
      }

      // Start building the WHERE conditions
      let whereConditions = ` WHERE l.created_at <= '${cutoffISO}'::timestamp`;

      // If is_usa is true, bypass the proximity check and apply the USA-specific filters
      if (is_usa === true) {
        whereConditions += ` AND l.post_to_usa = true`;
        whereConditions += ` AND l.usa_listing_status = 'APPROVED'`;
      } else {
        whereConditions += `
        AND l.status = 'APPROVED'
        AND ST_DWithin(
          c.location::geography,
          ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography,
          ${radiusInMeters}
        )`;
      }

      // Add category, sub_category, and search filters conditionally
      if (category) {
        whereConditions += ` AND l.category = '${category.replace(/'/g, "''")}'`;
      }
      if (sub_category) {
        whereConditions += ` AND l.sub_category = '${sub_category.replace(/'/g, "''")}'`;
      }
      if (search) {
        whereConditions += ` AND (l.title ILIKE '%${search.replace(/'/g, "''")}%' OR l.description ILIKE '%${search.replace(/'/g, "''")}%')`;
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
                l.address,
                l.created_at,
                l.updated_at,
                l.latitude,
                l.longitude,
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
        // const hoursOld = (now.getTime() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60);
        // const proximityScore = (1 / (listing.distance + 1)) * 100;
        // const freshnessScore = Math.max(0, 100 - hoursOld * 2);

        const hoursOld = (now.getTime() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60);
    
        // Improved proximity score - higher for closer distances
        // Using inverse square gives better differentiation for nearby items
        // const proximityScore = 100 / Math.pow(listing.distance + 1, 0.5);
        const proximityScore = 100 / Math.pow(this.calculateDistanceInMiles(lat, lng, listing.latitude, listing.longitude) + 1, 0.5);


        // const proximityScore = 100 / (1 + listing.distance)

        // Hyperbolic decay (adjust k as needed)
        const k = 24; // Tune this!
        const freshnessScore = 100 / (1 + hoursOld / k);
        const finalScore = (proximityScore * proximityWeight) + (freshnessScore * freshnessWeight);
      
        // console.log(listing.latitude, listing.longitude)

        // console.log(" ====================================")
        // console.log("listing => ", listing.title, 
        //   " distance: ",this.calculateDistanceInMiles(lat, lng, listing.latitude, listing.longitude), 
        //   " hoursOld: ", hoursOld, 
        //   " proximityScore: ", proximityScore, 
        //   " freshnessScore: ",freshnessScore, 
        //   " finalScore: ", finalScore)
        // console.log(" ====================================")

        return {
          ...listing,
          _score: finalScore,
        };
      });

      const sorted = scoredListings.sort((a, b) => b._score - a._score);

      
      // for (const listing of sorted) {
      //   console.log("listing => ", listing.title, listing._score)
      // }
      const limitedListings = sorted.slice(numberOfShownListings, numberOfShownListings + limit);

      const groupsWithAds = await this.getActiveAdGroupsWithGeoMatchedAds(category || 'HOME', lat, lng);

      // Inject ads with proper pagination handling
      const listingsWithAds = this.injectAdsWithPagination(
        limitedListings,
        groupsWithAds,
        numberOfShownListings,
        userSession
      );

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
                usa_listing_status: item.usa_listing_status,
                post_to_usa: item.post_to_usa,
                address: item.address,
                created_at: item.created_at,
                updated_at: item.updated_at,
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
          totalItems: listingsWithAds.length,
        }
      };
    } catch (error) {
      console.error('Error in findNearbyListings:', error);
      return {
        success: false,
        message: 'Failed to fetch listings',
      };
    }
  }

  /**
   * Improved ad injection with proper pagination handling
   */
  injectAdsWithPagination(
    listings: any[],
    adGroups: any[],
    numberOfShownListings: number,
    userSession: any
  ): any[] {
    if (!adGroups.length || !listings.length) {
      return listings;
    }

    // Initialize session ad tracking if not exists
    if (!userSession?.adTracking || numberOfShownListings === 0) {
      userSession.adTracking = {};
    }


    const result = [...listings];
    const insertions: { index: number; ad: any }[] = [];

    adGroups.forEach((group) => {
      if (group.ads.length === 0 || group.frequency <= 0) return;

      // Initialize tracking for this group if not exists
      if (!userSession.adTracking[group.group_id]) {
        userSession.adTracking[group.group_id] = {
          currentAdIndex: 0,
          totalListingsShown: 0, // Track only listings, not ads
        };
      }

      const groupTracking = userSession.adTracking[group.group_id];

      // Calculate total listings shown up to this point (excluding ads)
      const totalListingsBeforeThisPage = numberOfShownListings;

      // Find positions where ads should be inserted for this group
      const adPositions = this.calculateAdPositions(
        group.frequency,
        totalListingsBeforeThisPage,
        listings.length,
        groupTracking.totalListingsShown
      );

      adPositions.forEach((position) => {
        // Get the next ad for this group with proper wrapping
        const ad = group.ads[groupTracking.currentAdIndex];

        insertions.push({
          index: position,
          ad: {
            ...ad,
            __isAd: true,
            group_id: group.group_id,
            group_name: group.group_name,
          },
        });

        // Update the ad index with proper wrapping
        groupTracking.currentAdIndex = (groupTracking.currentAdIndex + 1) % group.ads.length;
      });

      // Update total listings shown for this group (only count listings, not ads)
      groupTracking.totalListingsShown = totalListingsBeforeThisPage + listings.length;
    });

    // Sort insertions by index in descending order to maintain correct positions
    insertions.sort((a, b) => b.index - a.index);

    // Insert ads into the result
    insertions.forEach(({ index, ad }) => {
      if (index >= 0 && index <= result.length) {
        result.splice(index, 0, ad);
      }
    });

    return result;
  }

  /**
   * Calculate the total number of ads injected before the current page
   */
  private getTotalAdsInjectedBefore(
    numberOfShownListings: number,
    adGroups: any[],
    userSession: any
  ): number {
    let totalAds = 0;

    adGroups.forEach((group) => {
      if (group.frequency <= 0) return;

      const groupTracking = userSession.adTracking?.[group.group_id];
      if (!groupTracking) return;

      // Calculate how many ads from this group were injected before this page
      const adsFromThisGroup = Math.floor(groupTracking.totalItemsShown / group.frequency);
      totalAds += adsFromThisGroup;
    });

    return totalAds;
  }

  /**
   * Calculate positions where ads should be inserted for a specific group
   */
  private calculateAdPositions(
    frequency: number,
    totalListingsBeforeThisPage: number,
    currentPageSize: number,
    groupTotalItemsShown: number
  ): number[] {
    const positions: number[] = [];

    // Calculate how many listings we've shown so far (excluding ads)
    const listingsShownSoFar = totalListingsBeforeThisPage;

    // Find the next multiple of frequency that's greater than listingsShownSoFar
    let nextAdAfterListing = Math.floor(listingsShownSoFar / frequency + 1) * frequency;

    // Convert to relative position on current page
    let relativePosition = nextAdAfterListing - listingsShownSoFar;

    // Add positions for ads that should appear on this page
    while (relativePosition <= currentPageSize) {
      // Position should be after the listing, so we add the position
      positions.push(relativePosition);
      relativePosition += frequency;
    }

    return positions;
  }

  /**
   * Original inject method for backward compatibility (now calls the improved version)
   */
  injectAds(
    listings: any[],
    adGroups: any[],
    numberOfShownListings: number = 0,
    userSession: any
  ): any[] {
    return this.injectAdsWithPagination(listings, adGroups, numberOfShownListings, userSession);
  }

  async getActiveAdGroupsWithGeoMatchedAds(
    category: string,
    lat: number,
    lng: number
  ): Promise<AdGroupWithAds[]> {
    const now = new Date();

    const pages = ["HOME", "RIDES", "MARKETPLACE", "JOBS", "ACCOMMODATIONS"];
    if (!pages.includes(category)) {
      return [];
    }

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
          orderBy: {
            created_at: "asc",
          }
        },
      },
    });

    // Increment the views for each ad
    const result: AdGroupWithAds[] = await Promise.all(
      adGroups.map(async (group) => {
        const updatedAds = await Promise.all(
          group.ads.map(async (ad) => {
            // Increment the views by 1
            const updatedAd = await this.prisma.ad.update({
              where: { id: ad.id },
              data: {
                views: {
                  increment: 1,
                },
              },
            });

            return {
              id: updatedAd.id,
              name: updatedAd.name,
              target_url: updatedAd.target_url,
              image_url: updatedAd.image,
              views: updatedAd.views,
              clicks: updatedAd.clicks || 0,
            };
          })
        );

        return {
          group_id: group.id,
          group_name: group.name,
          display_pages: group.display_pages,
          frequency: group.frequency,
          ads: updatedAds,
        };
      })
    );

    return result.filter((group) => group.ads.length > 0);
  }




}
