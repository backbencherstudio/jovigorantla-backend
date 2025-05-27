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
import { FindAllQueryDto } from './dto/find-all-query.dto';


@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService){}
  // async create(createListingDto: CreateListingDto, image: Express.Multer.File) {
  //   try {

  //     // // if category is marketplace oraccommodations
  //     // if (createListingDto.category === DisplayPageType.MARKETPLACE || createListingDto.category === DisplayPageType.ACCOMMODATIONS) {
  //     //   // if image is not provided
  //     //   if (!image) {
  //     //     return {
  //     //       success: false,
  //     //       message: 'Image is required',
  //     //     }
  //     //   }
  //     // }

  //     const data: any = {};

  //     if(image) data.image = image.filename;
  //     if(createListingDto.category) data.category = createListingDto.category;
  //     if(createListingDto.sub_category) data.sub_category = createListingDto.sub_category;
  //     if(createListingDto.title) { 
  //       data.title = createListingDto.title;
        
  //       const baseSlug = generateSlug(createListingDto.title); // e.g. "this-is-a-title"
  //       let slugToCheck = baseSlug;
  //       let counter = 1;

  //       while (true) {
  //         const exists = await this.prisma.listing.findUnique({ where: { slug: slugToCheck } });
  //         if (!exists) break;
  //         slugToCheck = `${baseSlug}-${counter++}`;
  //       }

  //       data.slug = slugToCheck;
  //     }
  //     if(createListingDto.description) data.description = createListingDto.description;
  //     if(createListingDto.lat) data.latitude = createListingDto.lat;
  //     if(createListingDto.lng) data.longitude = createListingDto.lng;
  //     if(createListingDto.is_usa === true || createListingDto.is_usa === false) {
  //       data.post_to_usa = createListingDto.is_usa;
  //       data.usa_listing_status = ListingStatus.PENDING
  //     };
  //     if(createListingDto.user_id) data.user_id = createListingDto.user_id;

  //     // console.log("data => ", data)

  //     await this.prisma.listing.create({
  //       data: data
  //     });


      


  //     return {
  //       success: true,
  //       message: 'Listing created successfully',
       
  //     }
      
  //   } catch (error) {
  //     // console.log("error => ", error)
  //     return {
  //       success: false,
  //       message: 'Failed to create listing',
  //     }
  //   }
  // }

  async create(createListingDto: CreateListingDto, image: Express.Multer.File) {
    try {
      // if (
      //   (createListingDto.category === DisplayPageType.MARKETPLACE ||
      //     createListingDto.category === DisplayPageType.ACCOMMODATIONS) &&
      //   !image
      // ) {
      //   return {
      //     success: false,
      //     message: 'Image is required',
      //   };
      // }
  
      const {
        category,
        sub_category,
        title,
        description,
        lat,
        lng,
        is_usa,
        user_id,
        address,
      } = createListingDto;
  
      const data: any = {
        id: cuid(),
        user_id,
        created_at: new Date(),
        updated_at: new Date(),
        category,
        sub_category,
        title,
        description,
        post_to_usa: !!is_usa,
        flagged_listing_status: ListingStatus.PENDING,
        usa_listing_status: is_usa ? ListingStatus.PENDING : null,
        address,
      };
  
      if (image) {
        data.image = image.filename;
      }
  
      // Unique slug generation
      if (title) {
        const baseSlug = generateSlug(title);
        let slugToCheck = baseSlug;
        let counter = 1;
  
        while (true) {
          const exists = await this.prisma.listing.findUnique({ where: { slug: slugToCheck } });
          if (!exists) break;
          slugToCheck = `${baseSlug}-${counter++}`;
        }
  
        data.slug = slugToCheck;
      }
  
      if (typeof lat === 'number' && typeof lng === 'number') {
        // Use raw SQL to insert with PostGIS point
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO "listings" (
            id, category, sub_category, title, description,
            image, slug, location, post_to_usa, flagged_listing_status,
            usa_listing_status, user_id, created_at, updated_at, address
          ) VALUES (
            '${data.id}',
            '${data.category}',
            '${data.sub_category}',
            ${data.title ? `'${data.title.replace(/'/g, "''")}'` : 'NULL'},
            ${data.description ? `'${data.description.replace(/'/g, "''")}'` : 'NULL'},
            ${data.image ? `'${data.image}'` : 'NULL'},
            '${data.slug}',
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
            ${data.post_to_usa},
            '${data.flagged_listing_status}',
            ${data.usa_listing_status ? `'${data.usa_listing_status}'` : 'NULL'},
            '${data.user_id}',
            '${data.created_at.toISOString()}',
            '${data.updated_at.toISOString()}',
            '${data.address}'
          )
        `);
      } else {
        return {
          success: false,
          message: 'Latitude and Longitude are required for geolocation.',
        };
      }
  
      return {
        success: true,
        message: 'Listing created successfully',
      };
    } catch (error) {
      // console.error(error);
      return {
        success: false,
        message: 'Failed to create listing',
      };
    }
  }
  

  // async getNearbyListings(
  //   lat: number,
  //   lng: number,
  //   radius: number = 20 // miles
  // ) {
  // const radiusInMeters = radius * 1609.34;

  //   const listings = await this.prisma.$queryRawUnsafe(`
  //     SELECT
  //       id,
  //       title,
  //       ST_AsText(location) AS location,
  //       ST_Distance(
  //         location::geography,
  //         ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
  //       ) AS distance_meters
  //     FROM "listings"
  //     WHERE ST_DWithin(
  //       location::geography,
  //       ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
  //       ${radiusInMeters}
  //     )
  //     ORDER BY distance_meters ASC
  //   `);
    

  //   return { listings };
  // }

  // async getNearbyListings(
  //  nearByDto: NearbyListingsQueryDto
  // ) {

  //   const lng = nearByDto.lng;
  //   const lat = nearByDto.lat;
  //   const radius = nearByDto.radius || 20;
  //   const category = nearByDto.category;
  //   const sub_category = nearByDto.sub_category;
    
  //   const radiusInMeters = radius * 1609.34;
  
  //   // Dynamic WHERE clause
  //   const conditions = [
  //     `ST_DWithin(
  //       location::geography,
  //       ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
  //       $3
  //     )`
  //   ];
  //   const params: any[] = [lng, lat, radiusInMeters];
  //   let paramIndex = 4;
  
  //   if (category) {
  //     conditions.push(`category = $${paramIndex++}`);
  //     params.push(category);
  //   }
  
  //   if (sub_category) {
  //     conditions.push(`sub_category = $${paramIndex++}`);
  //     params.push(sub_category);
  //   }
  
  //   const whereClause = conditions.join(" AND ");
  
  //   const query = `
  //     SELECT
  //       id,
  //       title,
  //       category,
  //       sub_category,
  //       ST_AsText(location) AS location,
  //       ST_Distance(
  //         location::geography,
  //         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
  //       ) AS distance_meters
  //     FROM "listings"
  //     WHERE ${whereClause}
  //     ORDER BY distance_meters ASC
  //   `;
  
  //   const listings = await this.prisma.$queryRawUnsafe(query, ...params);
  //   return { listings };
  // }

  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   const {
  //     lng,
  //     lat,
  //     radius = 30,
  //     category,
  //     sub_category,
  //     cursor_distance,
  //     limit = 20
  //   } = nearByDto;
  
  //   const radiusInMeters = radius * 1609.34;
  //   const fetchLimit = limit + 1; // Fetch one extra to check if there's more
  
  //   // Dynamic WHERE clause
  //   const conditions = [
  //     `ST_DWithin(
  //       location::geography,
  //       ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
  //       $3
  //     )`
  //   ];
  //   const params: any[] = [lng, lat, radiusInMeters];
  //   let paramIndex = 4;
  
  //   // Cursor: skip items already loaded
  //   if (cursor_distance) {
  //     conditions.push(`
  //       ST_Distance(
  //         location::geography,
  //         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
  //       ) > $${paramIndex}
  //     `);
  //     params.push(cursor_distance);
  //     paramIndex++;
  //   }
  
  //   if (category) {
  //     conditions.push(`category = $${paramIndex}`);
  //     params.push(category);
  //     paramIndex++;
  //   }
  
  //   if (sub_category) {
  //     conditions.push(`sub_category = $${paramIndex}`);
  //     params.push(sub_category);
  //     paramIndex++;
  //   }
  
  //   // Push final LIMIT value
  //   params.push(fetchLimit);
  
  //   const whereClause = conditions.join(" AND ");
  
  //   const query = `
  //     SELECT
  //       id,
  //       title,
  //       category,
  //       sub_category,
  //       ST_AsText(location) AS location,
  //       ST_Distance(
  //         location::geography,
  //         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
  //       ) AS distance_meters
  //     FROM "listings"
  //     WHERE ${whereClause}
  //     ORDER BY distance_meters ASC
  //     LIMIT $${params.length}
  //   `;
  
  //   const results = await this.prisma.$queryRawUnsafe(query, ...params);
  
  //   const hasNextPage = (results as any[]).length > limit;
  //   const listings= hasNextPage ? (results as any[]).slice(0, limit) : results;
  
  //   const nextCursorDistance = hasNextPage
  //     ? listings[(listings as any[]).length - 1].distance_meters
  //     : null;
  
  //   return {
  //     listings,
  //     hasNextPage,
  //     nextCursorDistance
  //   };
  // }
  
  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   const {
  //     lng,
  //     lat,
  //     radius = 30,
  //     category,
  //     sub_category,
  //     cursor_distance,
  //     limit = 20,
  //     search
  //   } = nearByDto;
  
  //   const radiusInMeters = radius * 1609.34;
  //   const fetchLimit = limit + 1;
  
  //   const conditions = [
  //     `ST_DWithin(
  //       location::geography,
  //       ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
  //       $3
  //     )`
  //   ];
  //   const params: any[] = [lng, lat, radiusInMeters];
  //   let paramIndex = 4;
  
  //   if (cursor_distance) {
  //     conditions.push(`
  //       ST_Distance(
  //         location::geography,
  //         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
  //       ) > $${paramIndex}
  //     `);
  //     params.push(cursor_distance);
  //     paramIndex++;
  //   }
  
  //   if (category) {
  //     conditions.push(`category = $${paramIndex}`);
  //     params.push(category);
  //     paramIndex++;
  //   }
  
  //   if (sub_category) {
  //     conditions.push(`sub_category = $${paramIndex}`);
  //     params.push(sub_category);
  //     paramIndex++;
  //   }
  
  //   if (search) {
  //     conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
  //     params.push(`%${search}%`);
  //     paramIndex++;
  //   }
  
  //   // Add limit at final position
  //   params.push(fetchLimit);
  //   const limitIndex = paramIndex;
  
  //   const whereClause = conditions.join(" AND ");
  
  //   const query = `
  //     SELECT
  //       id,
  //       slug,
  //       title,
  //       category,
  //       sub_category,
  //       description,
  //       latitude,
  //       longitude,
  //       created_at,
  //       updated_at,
  //       ST_AsText(location) AS location,
  //       ST_Distance(
  //         location::geography,
  //         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
  //       ) AS distance_meters
  //     FROM "listings"
  //     WHERE ${whereClause}
  //     ORDER BY distance_meters ASC
  //     LIMIT $${limitIndex}
  //   `;
  
  //   const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  
  //   const hasNextPage = results.length > limit;
  //   const listings = hasNextPage ? results.slice(0, limit) : results;
  
  //   const nextCursorDistance = hasNextPage
  //     ? listings[listings.length - 1].distance_meters
  //     : null;
  
  //   return {
  //     listings,
  //     hasNextPage,
  //     nextCursorDistance
  //   };
  // }
  
  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   const {
  //     lng,
  //     lat,
  //     radius = 30,
  //     category,
  //     sub_category,
  //     cursor_distance,
  //     limit = 20,
  //     search,
  //     is_usa
  //   } = nearByDto;

  
  //   const radiusInMeters = radius * 1609.34;
  //   const fetchLimit = limit + 1;
  
  //   const conditions = [
  //     `ST_DWithin(
  //       l.location::geography,
  //       ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
  //       $3
  //     )`
  //   ];
  //   const params: any[] = [lng, lat, radiusInMeters];
  //   let paramIndex = 4;
  
  //   if (cursor_distance) {
  //     conditions.push(`
  //       ST_Distance(
  //         l.location::geography,
  //         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
  //       ) > $${paramIndex}
  //     `);
  //     params.push(cursor_distance);
  //     paramIndex++;
  //   }
  
  //   if (category) {
  //     conditions.push(`l.category = $${paramIndex}`);
  //     params.push(category);
  //     paramIndex++;
  //   }
  
  //   if (sub_category) {
  //     conditions.push(`l.sub_category = $${paramIndex}`);
  //     params.push(sub_category);
  //     paramIndex++;
  //   }
  
  //   if (search) {
  //     conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
  //     params.push(`%${search}%`);
  //     paramIndex++;
  //   }

  //   if (is_usa === true) {
  //     conditions.push(`l.usa_listing_status = 'APPROVED'`);
  //   } else {
  //     conditions.push(`l.flagged_listing_status = 'APPROVED'`);
  //   }
  
  //   // Add limit
  //   params.push(fetchLimit);
  //   const limitIndex = paramIndex;
  
  //   const whereClause = conditions.join(" AND ");
  
  //   const query = `
  //     SELECT
  //       l.id,
  //       l.slug,
  //       l.title,
  //       l.category,
  //       l.sub_category,
  //       l.latitude,
  //       l.longitude,
  //       l.created_at,
  //       l.updated_at,
  //       ST_AsText(l.location) AS location,
  //       ST_Distance(
  //         l.location::geography,
  //         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
  //       ) AS distance_meters,
  
  //       u.id AS user_id,
  //       u.name AS user_name,
  //       u.email AS user_email
  
  //     FROM "listings" l
  //     JOIN "users" u ON u.id = l.user_id
  //     WHERE ${whereClause}
  //     ORDER BY distance_meters ASC
  //     LIMIT $${limitIndex}
  //   `;
  
  //   const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  
  //   const hasNextPage = results.length > limit;
  
  //   const listings = (hasNextPage ? results.slice(0, limit) : results).map((item) => ({
  //     id: item.id,
  //     slug: item.slug,
  //     title: item.title,
  //     category: item.category,
  //     sub_category: item.sub_category,
  //     latitude: item.latitude,
  //     longitude: item.longitude,
  //     created_at: item.created_at,
  //     updated_at: item.updated_at,
  //     location: item.location,
  //     distance_meters: item.distance_meters,
  //     user: {
  //       // id: item.user_id,
  //       name: item.user_name,
  //       // email: item.user_email
  //     }
  //   }));
  
  //   const nextCursorDistance = hasNextPage
  //     ? listings[listings.length - 1].distance_meters
  //     : null;
  
  //   return {
  //     success: true,
  //     data: listings,
  //     hasNextPage,
  //     nextCursorDistance
  //   };
  // }
  


  // Inside your ListingsService
  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //  try {
  //   const {
  //     lng,
  //     lat,
  //     radius = 30,
  //     category,
  //     sub_category,
  //     cursor_distance,
  //     limit = 20,
  //     search,
  //     is_usa,
  //     listing_offset = 0 // default to 0 for first page
  //   } = nearByDto;

  //   const radiusInMeters = radius * 1609.34;
  //   const fetchLimit = limit + 1;
  //   const conditions = [
  //     `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
  //   ];
  //   const params: any[] = [lng, lat, radiusInMeters];
  //   let paramIndex = 4;

  //   if (cursor_distance) {
  //     conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
  //     params.push(cursor_distance);
  //     paramIndex++;
  //   }

  //   if (category) {
  //     conditions.push(`l.category = $${paramIndex}`);
  //     params.push(category);
  //     paramIndex++;
  //   }

  //   if (sub_category) {
  //     conditions.push(`l.sub_category = $${paramIndex}`);
  //     params.push(sub_category);
  //     paramIndex++;
  //   }

  //   if (search) {
  //     conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
  //     params.push(`%${search}%`);
  //     paramIndex++;
  //   }

  //   if (is_usa === true) {
  //     conditions.push(`l.usa_listing_status = 'APPROVED'`);
  //   }
  //   //  else {
  //   //   conditions.push(`l.flagged_listing_status = 'APPROVED'`);
  //   // }

  //   params.push(fetchLimit);
  //   const limitIndex = paramIndex;
  //   const whereClause = conditions.join(" AND ");

  //   const query = `
  //     SELECT
  //       l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
  //       l.created_at, l.updated_at,
  //       ST_AsText(l.location) AS location,
  //       ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
  //       u.id AS user_id, u.name AS user_name
  //     FROM "listings" l
  //     JOIN "users" u ON u.id = l.user_id
  //     WHERE ${whereClause}
  //     ORDER BY distance_meters ASC
  //     LIMIT $${limitIndex}`;

  //   const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  //   const hasNextPage = results.length > limit;
  //   const realListings = hasNextPage ? results.slice(0, limit) : results;

  //   // Fetch ad groups matching any listed DisplayPageType (supporting multiple categories per group)
  //   const adGroups = await this.prisma.adGroup.findMany({
  //     where: {
  //       active: true,
  //       AND: [
  //         {
  //           OR: [
  //             ...(category ? [{ display_pages: { has: category as any } }] : []),
  //             { display_pages: { has: DisplayPageType.HOME } }
  //           ]
  //         },
  //         {
  //           OR: [
  //             { start_date: null },
  //             { start_date: { lte: new Date() } }
  //           ]
  //         },
  //         {
  //           OR: [
  //             { end_date: null },
  //             { end_date: { gte: new Date() } }
  //           ]
  //         }
  //       ]
  //     },
  //     include: {
  //       ads: { where: { active: true } }
  //     }
  //   });

  //   // Round-robin ad rotation state (per ad group)
  //   const adRotationMap = new Map<string, number>();``
  //   adGroups.forEach(group => adRotationMap.set(group.id, 0));

  //   const finalFeed: any[] = [];

  //   for (let i = 0; i < realListings.length; i++) {
  //     const listing = realListings[i];
  //     const globalIndex = listing_offset + i;

  //     finalFeed.push({ type: 'listing', ...listing });

  //     for (const group of adGroups) {
  //       if ((globalIndex + 1) % group.frequency === 0 && group.ads.length > 0) {
  //         const currentIndex = adRotationMap.get(group.id) || 0;
  //         const ad = group.ads[currentIndex % group.ads.length];

  //         // Add impression tracking (increment view count)
  //         await this.prisma.ad.update({
  //           where: { id: ad.id },
  //           data: { views: { increment: 1 } }
  //         });

  //         finalFeed.push({ type: 'ad', ...ad });
  //         adRotationMap.set(group.id, currentIndex + 1);
  //       }
  //     }
  //   }

  //   finalFeed.forEach(item => {
  //     if (item?.type === 'ad' && item?.image) {
  //       item['image_url'] = SojebStorage.url(
  //         appConfig().storageUrl.ads + item?.image,
  //       )
  //     }
  //   })

  //   const nextCursorDistance = hasNextPage
  //     ? realListings[realListings.length - 1].distance_meters
  //     : null;

  //   return {
  //     success: true,
  //     data: finalFeed,
  //     hasNextPage,
  //     nextCursorDistance,
  //     nextListingOffset: listing_offset + realListings.length
  //   };
  //  } catch (error) {
  //   // console.log(error)
  //   return {
  //     success: false,
  //     message: "Failed to retrived nearby listings",
  //   }
  //  }
  // }
  

  async findAll(user_id: any, findAllQueryDto: FindAllQueryDto) {
    try {
      const {
        category,
        sub_category,
        cursor,
        limit = 20,
        search,
        is_usa
      } = findAllQueryDto;

      const conditions = {
        user_id: user_id
      } as any;

      if (category) {
        conditions.category = category;
      }

      if (sub_category) {
        conditions.sub_category = sub_category;
      }

      if (search) {
        conditions.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // if (is_usa === true) {
      //   conditions.post_to_usa = true;
      // } else{
      //   conditions.post_to_usa = false;
      // }
      // else {
      //   conditions.flagged_listing_status = 'APPROVED';
      // }

      // Find listings with pagination using cursor
      const listings = await this.prisma.listing.findMany({
        where: conditions,
        take: limit + 1, // Take one extra to check if there's more
        cursor: cursor ? { id: String(cursor) } : undefined,
        orderBy: {
          created_at: 'desc'
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });

      const hasNextPage = listings.length > limit;
      const data = hasNextPage ? listings.slice(0, limit) : listings;

      // Add image URLs and format response
      const formattedData = data.map(listing => {
        const formatted = {
          ...listing,
          image_url: listing.image ? 
            SojebStorage.url(appConfig().storageUrl.listing + listing.image) : 
            null
        };
        return formatted;
      });

      return {
        success: true,
        message: 'Listings fetched successfully',
        data: formattedData,
        hasNextPage,
        nextCursor: hasNextPage ? data[data.length - 1].id : null
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get listings',
      }
    }
  }

  async findOne(idOrSlug: string) {
    try {
      // find listing by filters id or slug

      const listing = await this.prisma.listing.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            id: true
          }
        }
      }
    });

      

      if (!listing) {
        return {
          success: false,
          message: 'Listing not found',
        }
      }

      if(listing?.image){
        listing['image_url'] =  SojebStorage.url(
          appConfig().storageUrl.listing + listing.image,
        )
      }

      return {
        success: true,
        message: 'Listing fetched successfully',
        data: listing
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get listing',
      }
    }
  }

  async update(id: string, updateListingDto: UpdateListingDto, image: Express.Multer.File) {
    try {
      // find listing by filters id and user_id
      const listing = await this.prisma.listing.findFirst({
        where: {
          id: id,
          user_id: updateListingDto.user_id
        }
      });

      if (!listing) {
        return {
          success: false,
          message: 'Listing not found',
        }
      }


      // delete image if exists
      if (image && listing.image) {
        SojebStorage.delete(appConfig().storageUrl.listing + listing.image);
      }

      // update listing
      const data: any = {}

      if(image) data.image = image.filename;
      if(updateListingDto.title) data.title = updateListingDto.title;
      if(updateListingDto.description) data.description = updateListingDto.description;
      if(updateListingDto.category) data.category = updateListingDto.category;
      if(updateListingDto.sub_category) data.sub_category = updateListingDto.sub_category;
      if(updateListingDto.is_usa) data.post_to_usa = updateListingDto.is_usa;
      if(updateListingDto.address) data.address = updateListingDto.address;
      if(updateListingDto.lat && updateListingDto.lng) {
        data.latitude = updateListingDto.lat;
        data.longitude = updateListingDto.lng;
        await this.prisma.$executeRawUnsafe(`
          UPDATE "listings"
          SET location = ST_SetSRID(ST_MakePoint(${updateListingDto.lat}, ${updateListingDto.lng}), 4326)
          WHERE id = '${id}'
        `);
      };


      const updatedListing = await this.prisma.listing.update({
        where: {
          id: id
        },
        data
      });
     

      if(updatedListing?.image){
        updatedListing['image_url'] =  SojebStorage.url(
          appConfig().storageUrl.listing + updatedListing.image,
        )
      }

      return {
        success: true,
        message: 'Listing updated successfully',
        data: updatedListing
      }

      
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update listing',
      }
    }
  }

  async remove(id: string, user_id: any) {
    try {
      // find listing by filters id and user_id
      const listing = await this.prisma.listing.findFirst({
        where: {
          id: id,
          user_id: user_id
        }
      });

      if (!listing) {
        return {
          success: false,
          message: 'Listing not found',
        }
      }

      // delete image if exists
      if (listing.image) {
        SojebStorage.delete(appConfig().storageUrl.listing + listing.image);
      }

      // delete listing
      await this.prisma.listing.delete({
        where: {
          id: id
        }
      });

      return {
        success: true,
        message: 'Listing deleted successfully',
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete listing',
      }
    }
  }






  // // testing
  // async createMany(listings: any) {
  //   try {
  //     const insertions = listings.map((listing) => ({
  //       id: cuid(),
  //       title: listing.title,
  //       description: listing.description,
  //       category: listing.category,
  //       sub_category: listing.sub_category,
  //       latitude: listing.latitude,
  //       longitude: listing.longitude,
  //       location: {
  //         raw: `ST_SetSRID(ST_MakePoint(${listing.lng}, ${listing.lat}), 4326)`
  //       },
  //       post_to_usa: listing.is_usa,
  //       usa_listing_status: listing.is_usa ? ListingStatus.PENDING : null,
  //       flagged_listing_status: ListingStatus.PENDING,
  //       user_id: 'cmb243qvh0001skyso5ea5knv',
  //       address: listing.address,
  //     }));
  
  //     for (const data of insertions) {
  //       await this.prisma.$executeRawUnsafe(`
  //         INSERT INTO "listings" (
  //           id, title, description, category, sub_category,
  //           latitude, longitude, location,
  //           post_to_usa, address, usa_listing_status, flagged_listing_status,
  //           user_id, created_at, updated_at
  //         ) VALUES (
  //           '${data.id}',
  //           '${data.title.replace(/'/g, "''")}',
  //           '${data.description.replace(/'/g, "''")}',
  //           '${data.category}', '${data.sub_category}',
  //           ${data.latitude}, ${data.longitude},
  //           ${data.location.raw},
  //           ${data.post_to_usa},
  //           ${data.address? `'${data.address}'` : 'NULL'}
  //           ${data.usa_listing_status ? `'${data.usa_listing_status}'` : 'NULL'},
  //           '${data.flagged_listing_status}',
  //           '${data.user_id}',
  //           NOW(), NOW()
  //         )
  //       `);
  //     }
  
  //     return { success: true, count: insertions.length };
  //   } catch (error) {
  //     console.error("🔥 Bulk Insert Error:", error);
  //     return {
  //       success: false,
  //       message: "An error occurred",
  //       error: error.message
  //     };
  //   }
  // }






  
//   async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
//     try {
//       const {
//         lng,
//         lat,
//         radius = 30,
//         category,
//         sub_category,
//         cursor_distance,
//         limit = 20,
//         search,
//         is_usa,
//         listing_offset = 0,
//       } = nearByDto;

//       const radiusInMeters = radius * 1609.34;
//       const fetchLimit = limit + 1;
//       const params: any[] = [lng, lat, radiusInMeters];
//       let paramIndex = 4;

//       const conditions = [
//         `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
//       ];

//       if (cursor_distance) {
//         conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
//         params.push(cursor_distance);
//         paramIndex++;
//       }

//       if (category) {
//         conditions.push(`l.category = $${paramIndex}`);
//         params.push(category);
//         paramIndex++;
//       }

//       if (sub_category) {
//         conditions.push(`l.sub_category = $${paramIndex}`);
//         params.push(sub_category);
//         paramIndex++;
//       }

//       if (search) {
//         conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
//         params.push(`%${search}%`);
//         paramIndex++;
//       }

//       if (is_usa === true) {
//         conditions.push(`l.usa_listing_status = 'APPROVED'`);
//       }

//       params.push(fetchLimit);
//       const limitIndex = paramIndex;

//       const whereClause = conditions.join(" AND ");

//       const query = `
//         SELECT
//           l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
//           l.created_at, l.updated_at,
//           ST_AsText(l.location) AS location,
//           ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
//           u.id AS user_id, u.name AS user_name
//         FROM "listings" l
//         JOIN "users" u ON u.id = l.user_id
//         WHERE ${whereClause}
//         ORDER BY distance_meters ASC
//         LIMIT $${limitIndex}`;

//       const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
//       const hasNextPage = results.length > limit;
//       const realListings = hasNextPage ? results.slice(0, limit) : results;

//       // ✅ Fetch nearby cities
//       const nearbyCities = await this.prisma.$queryRawUnsafe(`
//         SELECT id, name, latitude, longitude,
//         ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
//         FROM "cities"
//         WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
//       `, lng, lat, radiusInMeters);

// const cityIds = (nearbyCities as any[]).map(city => city.id);

//       // ✅ Fetch ads linked to those cities
//       const adCities = await this.prisma.adCity.findMany({
//         where: {
//           city_id: { in: cityIds },
//           ad: { active: true } // ✅ filter on related ad
//         },
//         include: {
//           ad: true,    // ✅ fetch full ad
//           city: true   // ✅ fetch city details
//         }
//       });
      

//       // ✅ Build map of ads with shortest distance
//       const adMap = new Map<string, any>();
//       for (const adCity of adCities) {
//         const dist = this.getDistance(lat, lng, adCity.city.latitude, adCity.city.longitude);
//         const existing = adMap.get(adCity.ad.id);
//         if (!existing || dist < existing.distance_km) {
//           adMap.set(adCity.ad.id, {
//             ...adCity.ad,
//             type: 'ad',
//             distance_km: dist,
//             city_name: adCity.city.name
//           });
//         }
//       }

//       const sortedAds = Array.from(adMap.values()).sort((a, b) => a.distance_km - b.distance_km);

//       const adGroups = await this.prisma.adGroup.findMany({
//         where: {
//           active: true,
//           AND: [
//             {
//               OR: [
//                 ...(category ? [{ display_pages: { has: category as any } }] : []),
//                 { display_pages: { has: DisplayPageType.HOME } }
//               ]
//             },
//             {
//               OR: [
//                 { start_date: null },
//                 { start_date: { lte: new Date() } }
//               ]
//             },
//             {
//               OR: [
//                 { end_date: null },
//                 { end_date: { gte: new Date() } }
//               ]
//             }
//           ]
//         },
//         include: {
//           ads: { where: { active: true } }
//         }
//       });

//       const adRotationMap = new Map<string, number>();
//       adGroups.forEach(group => adRotationMap.set(group.id, 0));

//       const finalFeed: any[] = [];

//       for (let i = 0; i < realListings.length; i++) {
//         const listing = realListings[i];
//         const globalIndex = listing_offset + i;

//         finalFeed.push({ type: 'listing', ...listing });

//         // Ad rotation by group frequency
//         for (const group of adGroups) {
//           if ((globalIndex + 1) % group.frequency === 0 && group.ads.length > 0) {
//             const currentIndex = adRotationMap.get(group.id) || 0;
//             const ad = group.ads[currentIndex % group.ads.length];
//             await this.prisma.ad.update({ where: { id: ad.id }, data: { views: { increment: 1 } } });
//             finalFeed.push({ type: 'ad', ...ad });
//             adRotationMap.set(group.id, currentIndex + 1);
//           }
//         }

//         // Nearby ad injection (optional)
//         if (sortedAds[i]) {
//           await this.prisma.ad.update({
//             where: { id: sortedAds[i].id },
//             data: { views: { increment: 1 } }
//           });
//           finalFeed.push(sortedAds[i]);
//         }
//       }

//       finalFeed.forEach(item => {
//         if (item?.type === 'ad' && item?.image) {
//           item['image_url'] = SojebStorage.url(
//             appConfig().storageUrl.ads + item?.image,
//           );
//         }
//       });

//       const nextCursorDistance = hasNextPage
//         ? realListings[realListings.length - 1].distance_meters
//         : null;

//       return {
//         success: true,
//         data: finalFeed,
//         hasNextPage,
//         nextCursorDistance,
//         nextListingOffset: listing_offset + realListings.length
//       };
//     } catch (error) {
//       console.error("❌ getNearbyListings Error:", error);
//       return {
//         success: false,
//         message: "Failed to retrieve nearby listings"
//       };
//     }
//   }


  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   try {
  //     const {
  //       lng,
  //       lat,
  //       radius = 30,
  //       category,
  //       sub_category,
  //       cursor_distance,
  //       limit = 20,
  //       search,
  //       is_usa,
  //       listing_offset = 0,
  //     } = nearByDto;

  //     const radiusInMeters = radius * 1609.34;
  //     const fetchLimit = limit + 1;
  //     const params: any[] = [lng, lat, radiusInMeters];
  //     let paramIndex = 4;

  //     const conditions = [
  //       `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
  //     ];

  //     if (cursor_distance) {
  //       conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
  //       params.push(cursor_distance);
  //       paramIndex++;
  //     }

  //     if (category) {
  //       conditions.push(`l.category = $${paramIndex}`);
  //       params.push(category);
  //       paramIndex++;
  //     }

  //     if (sub_category) {
  //       conditions.push(`l.sub_category = $${paramIndex}`);
  //       params.push(sub_category);
  //       paramIndex++;
  //     }

  //     if (search) {
  //       conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
  //       params.push(`%${search}%`);
  //       paramIndex++;
  //     }

  //     if (is_usa === true) {
  //       conditions.push(`l.usa_listing_status = 'APPROVED'`);
  //     }

  //     params.push(fetchLimit);
  //     const limitIndex = paramIndex;

  //     const whereClause = conditions.join(" AND ");

  //     const query = `
  //       SELECT
  //         l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
  //         l.created_at, l.updated_at,
  //         ST_AsText(l.location) AS location,
  //         ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
  //         u.id AS user_id, u.name AS user_name
  //       FROM "listings" l
  //       JOIN "users" u ON u.id = l.user_id
  //       WHERE ${whereClause}
  //       ORDER BY distance_meters ASC
  //       LIMIT $${limitIndex}`;

  //     const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  //     const hasNextPage = results.length > limit;
  //     const realListings = hasNextPage ? results.slice(0, limit) : results;

  //     // ✅ Fetch nearby cities
  //     const nearbyCities = await this.prisma.$queryRawUnsafe(`
  //       SELECT id, name, latitude, longitude,
  //       ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
  //       FROM "cities"
  //       WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
  //     `, lng, lat, radiusInMeters);

  // const cityIds = (nearbyCities as any[]).map(city => city.id);

  //     // ✅ Fetch ads linked to those cities
  //     const adCities = await this.prisma.adCity.findMany({
  //       where: {
  //         city_id: { in: cityIds },
  //         ad: { active: true } // ✅ filter on related ad
  //       },
  //       include: {
  //         ad: true,    // ✅ fetch full ad
  //         city: true   // ✅ fetch city details
  //       }
  //     });
      

  //     // ✅ Build map of ads with shortest distance
  //     const adMap = new Map<string, any>();
  //     for (const adCity of adCities) {
  //       const dist = this.getDistance(lat, lng, adCity.city.latitude, adCity.city.longitude);
  //       const existing = adMap.get(adCity.ad.id);
  //       if (!existing || dist < existing.distance_km) {
  //         adMap.set(adCity.ad.id, {
  //           ...adCity.ad,
  //           type: 'ad',
  //           distance_km: dist,
  //           city_name: adCity.city.name
  //         });
  //       }
  //     }

  //     const sortedAds = Array.from(adMap.values()).sort((a, b) => a.distance_km - b.distance_km);

  //     const adGroups = await this.prisma.adGroup.findMany({
  //       where: {
  //         active: true,
  //         AND: [
  //           {
  //             OR: [
  //               ...(category ? [{ display_pages: { has: category as any } }] : []),
  //               { display_pages: { has: DisplayPageType.HOME } }
  //             ]
  //           },
  //           {
  //             OR: [
  //               { start_date: null },
  //               { start_date: { lte: new Date() } }
  //             ]
  //           },
  //           {
  //             OR: [
  //               { end_date: null },
  //               { end_date: { gte: new Date() } }
  //             ]
  //           }
  //         ]
  //       },
  //       include: {
  //         ads: { where: { active: true } }
  //       }
  //     });

  //     const adRotationMap = new Map<string, number>();
  //     adGroups.forEach(group => adRotationMap.set(group.id, 0));

  //     const finalFeed: any[] = [];

  //     for (let i = 0; i < realListings.length; i++) {
  //       const listing = realListings[i];
  //       const globalIndex = listing_offset + i;

  //       finalFeed.push({ type: 'listing', ...listing });

  //       // Ad rotation by group frequency
  //       for (const group of adGroups) {
  //         if ((globalIndex + 1) % group.frequency === 0 && group.ads.length > 0) {
  //           const currentIndex = adRotationMap.get(group.id) || 0;
  //           const ad = group.ads[currentIndex % group.ads.length];
  //           await this.prisma.ad.update({ where: { id: ad.id }, data: { views: { increment: 1 } } });
  //           finalFeed.push({ type: 'ad', ...ad });
  //           adRotationMap.set(group.id, currentIndex + 1);
  //         }
  //       }

  //       // Nearby ad injection (optional)
  //       if (sortedAds[i]) {
  //         await this.prisma.ad.update({
  //           where: { id: sortedAds[i].id },
  //           data: { views: { increment: 1 } }
  //         });
  //         finalFeed.push(sortedAds[i]);
  //       }
  //     }

  //     finalFeed.forEach(item => {
  //       if (item?.type === 'ad' && item?.image) {
  //         item['image_url'] = SojebStorage.url(
  //           appConfig().storageUrl.ads + item?.image,
  //         );
  //       }
  //     });

  //     const nextCursorDistance = hasNextPage
  //       ? realListings[realListings.length - 1].distance_meters
  //       : null;

  //     return {
  //       success: true,
  //       data: finalFeed,
  //       hasNextPage,
  //       nextCursorDistance,
  //       nextListingOffset: listing_offset + realListings.length
  //     };
  //   } catch (error) {
  //     console.error("❌ getNearbyListings Error:", error);
  //     return {
  //       success: false,
  //       message: "Failed to retrieve nearby listings"
  //     };
  //   }
  // }

  private getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in km
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }


  async createMany(listings: CreateListingDto[]) {
    try {
      // console.log(listings)
      for (const listing of listings) {
        const id = cuid();
        const title = listing.title?.replace(/'/g, "''") || '';
        const description = listing.description?.replace(/'/g, "''") || '';
        const category = listing.category;
        const subCategory = listing.sub_category;
        const latitude = listing.lat;
        const longitude = listing.lng;
        const postToUsa = listing.is_usa ?? false;
        const flaggedStatus = ListingStatus.APPROVED;
        const usaStatus = postToUsa ? `'${ListingStatus.APPROVED}'` : 'NULL';
        const address = listing.address ? `'${listing.address.replace(/'/g, "''")}'` : 'NULL';

        const slug = listing.title?.replace(/'/g, "''") || null;
        const slugPart = slug ? `'${slug}'` : 'NULL';

        const image = 'NULL';

        const sql = `
          INSERT INTO "listings" (
            id, category, sub_category, title, description,
            image, slug, latitude, longitude, location,
            post_to_usa, flagged_listing_status, usa_listing_status,
            user_id, address, created_at, updated_at
          ) VALUES (
            '${id}',
            '${category}', '${subCategory}', '${title}', '${description}',
            ${image}, ${slugPart}, ${latitude}, ${longitude},
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
            ${postToUsa}, '${flaggedStatus}', ${usaStatus},
            '${'cmb243qvh0001skyso5ea5knv'}',
            ${address}, NOW(), NOW()
          );
        `;

        await this.prisma.$executeRawUnsafe(sql);
      }

      return { success: true, count: listings.length };
    } catch (error) {
      console.error("🔥 Insert Error:", error);
      return {
        success: false,
        message: "An error occurred while creating listings",
        error: error.message
      };
    }
  }


  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   try {
  //     const {
  //       lng,
  //       lat,
  //       radius = 30,
  //       category,
  //       sub_category,
  //       cursor_distance,
  //       limit = 20,
  //       search,
  //       is_usa,
  //       listing_offset = 0,
  //     } = nearByDto;
  
  //     const radiusInMeters = radius * 1609.34;
  //     const fetchLimit = limit + 1;
  //     const params: any[] = [lng, lat, radiusInMeters];
  //     let paramIndex = 4;
  
  //     const conditions = [
  //       `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
  //     ];
  
  //     if (cursor_distance) {
  //       conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
  //       params.push(cursor_distance);
  //       paramIndex++;
  //     }
  
  //     if (category) {
  //       conditions.push(`l.category = $${paramIndex}`);
  //       params.push(category);
  //       paramIndex++;
  //     }
  
  //     if (sub_category) {
  //       conditions.push(`l.sub_category = $${paramIndex}`);
  //       params.push(sub_category);
  //       paramIndex++;
  //     }
  
  //     if (search) {
  //       conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
  //       params.push(`%${search}%`);
  //       paramIndex++;
  //     }
  
  //     if (is_usa === true) {
  //       conditions.push(`l.usa_listing_status = 'APPROVED'`);
  //     }
  
  //     params.push(fetchLimit);
  //     const limitIndex = paramIndex;
  
  //     const whereClause = conditions.join(" AND ");
  
  //     const query = `
  //       SELECT
  //         l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
  //         l.created_at, l.updated_at,
  //         ST_AsText(l.location) AS location,
  //         ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
  //         u.id AS user_id, u.name AS user_name
  //       FROM "listings" l
  //       JOIN "users" u ON u.id = l.user_id
  //       WHERE ${whereClause}
  //       ORDER BY distance_meters ASC
  //       LIMIT $${limitIndex}`;
  
  //     const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  //     const hasNextPage = results.length > limit;
  //     const realListings = hasNextPage ? results.slice(0, limit) : results;
  
  //     // Fetch nearby cities using boundary (polygon) detection
  //     const nearbyCities = await this.prisma.$queryRawUnsafe(`
  //       SELECT id, name, latitude, longitude,
  //       ST_Distance(ST_Centroid(boundary)::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
  //       FROM "cities"
  //       WHERE ST_DWithin(boundary::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
  //       ORDER BY distance ASC
  //     `, lng, lat, radiusInMeters);
  
  //     const cityIds = (nearbyCities as any[]).map(city => city.id);
  
  //     const adCities = await this.prisma.adCity.findMany({
  //       where: {
  //         city_id: { in: cityIds },
  //         ad: { active: true }
  //       },
  //       include: {
  //         ad: true,
  //         city: true
  //       }
  //     });
  
  //     const adMap = new Map<string, any>();
  //     for (const adCity of adCities) {
  //       const dist = this.getDistance(lat, lng, adCity.city.latitude, adCity.city.longitude);
  //       const existing = adMap.get(adCity.ad.id);
  //       if (!existing || dist < existing.distance_km) {
  //         adMap.set(adCity.ad.id, {
  //           ...adCity.ad,
  //           type: 'ad',
  //           distance_km: dist,
  //           city_name: adCity.city.name
  //         });
  //       }
  //     }
  
  //     const sortedAds = Array.from(adMap.values()).sort((a, b) => a.distance_km - b.distance_km);
  
  //     const finalFeed: any[] = [];
  //     const maxLength = Math.max(realListings.length, sortedAds.length);
  
  //     for (let i = 0; i < maxLength; i++) {
  //       if (i < realListings.length) finalFeed.push({ type: 'listing', ...realListings[i] });
  //       if (i < sortedAds.length) {
  //         await this.prisma.ad.update({
  //           where: { id: sortedAds[i].id },
  //           data: { views: { increment: 1 } }
  //         });
  //         finalFeed.push(sortedAds[i]);
  //       }
  //     }
  
  //     finalFeed.forEach(item => {
  //       if (item?.type === 'ad' && item?.image) {
  //         item['image_url'] = SojebStorage.url(
  //           appConfig().storageUrl.ads + item?.image,
  //         );
  //       }
  //     });
  
  //     const nextCursorDistance = hasNextPage
  //       ? realListings[realListings.length - 1].distance_meters
  //       : null;
  
  //     return {
  //       success: true,
  //       data: finalFeed,
  //       hasNextPage,
  //       nextCursorDistance,
  //       nextListingOffset: listing_offset + realListings.length
  //     };
  //   } catch (error) {
  //     console.error("\u274C getNearbyListings Error:", error);
  //     return {
  //       success: false,
  //       message: "Failed to retrieve nearby listings"
  //     };
  //   }
  // }
  
  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   try {
  //     const {
  //       lng,
  //       lat,
  //       radius = 30,
  //       category,
  //       sub_category,
  //       cursor_distance,
  //       limit = 20,
  //       search,
  //       is_usa,
  //       listing_offset = 0,
  //     } = nearByDto;
  
  //     const radiusInMeters = radius * 1609.34;
  //     const fetchLimit = limit + 1;
  //     const params: any[] = [lng, lat, radiusInMeters];
  //     let paramIndex = 4;
  
  //     const conditions = [
  //       `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
  //     ];
  
  //     if (cursor_distance) {
  //       conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
  //       params.push(cursor_distance);
  //       paramIndex++;
  //     }
  
  //     if (category) {
  //       conditions.push(`l.category = $${paramIndex}`);
  //       params.push(category);
  //       paramIndex++;
  //     }
  
  //     if (sub_category) {
  //       conditions.push(`l.sub_category = $${paramIndex}`);
  //       params.push(sub_category);
  //       paramIndex++;
  //     }
  
  //     if (search) {
  //       conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
  //       params.push(`%${search}%`);
  //       paramIndex++;
  //     }
  
  //     if (is_usa === true) {
  //       conditions.push(`l.usa_listing_status = 'APPROVED'`);
  //     }
  
  //     params.push(fetchLimit);
  //     const limitIndex = paramIndex;
  
  //     const whereClause = conditions.join(" AND ");
  
  //     const query = `
  //       SELECT
  //         l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
  //         l.created_at, l.updated_at,
  //         ST_AsText(l.location) AS location,
  //         ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
  //         u.id AS user_id, u.name AS user_name
  //       FROM "listings" l
  //       JOIN "users" u ON u.id = l.user_id
  //       WHERE ${whereClause}
  //       ORDER BY distance_meters ASC
  //       LIMIT $${limitIndex}`;
  
  //     const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  //     const hasNextPage = results.length > limit;
  //     const realListings = hasNextPage ? results.slice(0, limit) : results;
  
  //     // Fetch nearby cities using boundary (polygon) detection
  //     const nearbyCities = await this.prisma.$queryRawUnsafe(`
  //       SELECT id, name, latitude, longitude,
  //       ST_Distance(ST_Centroid(boundary)::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
  //       FROM "cities"
  //       WHERE ST_DWithin(boundary::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
  //       ORDER BY distance ASC
  //     `, lng, lat, radiusInMeters);
  
  //     const cityIds = (nearbyCities as any[]).map(city => city.id);
  
  //     // Fetch ads linked to those cities
  //     const adCities = await this.prisma.adCity.findMany({
  //       where: {
  //         city_id: { in: cityIds },
  //         ad: { active: true }
  //       },
  //       include: {
  //         ad: true,
  //         city: true
  //       }
  //     });
  
  //     // Fetch ads not linked to any city (global ads)
  //     const globalAds = await this.prisma.ad.findMany({
  //       where: {
  //         active: true,
  //         adCities: { none: {} }
  //       }
  //     });
  
  //     const adMap = new Map<string, any>();
  //     for (const adCity of adCities) {
  //       const dist = this.getDistance(lat, lng, adCity.city.latitude, adCity.city.longitude);
  //       const existing = adMap.get(adCity.ad.id);
  //       if (!existing || dist < existing.distance_km) {
  //         adMap.set(adCity.ad.id, {
  //           ...adCity.ad,
  //           type: 'ad',
  //           distance_km: dist,
  //           city_name: adCity.city.name
  //         });
  //       }
  //     }
  
  //     const sortedAds = Array.from(adMap.values()).sort((a, b) => a.distance_km - b.distance_km);
  
  //     const globalFormattedAds = globalAds.map(ad => ({
  //       ...ad,
  //       type: 'ad',
  //       distance_km: Infinity,
  //       city_name: null
  //     }));
  
  //     const finalSortedAds = [...sortedAds, ...globalFormattedAds];
  
  //     const finalFeed: any[] = [];
  //     const maxLength = Math.max(realListings.length, finalSortedAds.length);
  
  //     for (let i = 0; i < maxLength; i++) {
  //       if (i < realListings.length) finalFeed.push({ type: 'listing', ...realListings[i] });
  //       if (i < finalSortedAds.length) {
  //         await this.prisma.ad.update({
  //           where: { id: finalSortedAds[i].id },
  //           data: { views: { increment: 1 } }
  //         });
  //         finalFeed.push(finalSortedAds[i]);
  //       }
  //     }
  
  //     finalFeed.forEach(item => {
  //       if (item?.type === 'ad' && item?.image) {
  //         item['image_url'] = SojebStorage.url(
  //           appConfig().storageUrl.ads + item?.image,
  //         );
  //       }
  //     });
  
  //     const nextCursorDistance = hasNextPage
  //       ? realListings[realListings.length - 1].distance_meters
  //       : null;
  
  //     return {
  //       success: true,
  //       data: finalFeed,
  //       hasNextPage,
  //       nextCursorDistance,
  //       nextListingOffset: listing_offset + realListings.length
  //     };
  //   } catch (error) {
  //     // console.error("\u274C getNearbyListings Error:", error);
  //     return {
  //       success: false,
  //       message: "Failed to retrieve nearby listings"
  //     };
  //   }
  // }

  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   try {
  //     const {
  //       lng,
  //       lat,
  //       radius = 30,
  //       category,
  //       sub_category,
  //       cursor_distance,
  //       limit = 20,
  //       search,
  //       is_usa,
  //       listing_offset = 0,
  //     } = nearByDto;
  
  //     const radiusInMeters = radius * 1609.34;
  //     const fetchLimit = limit + 1;
  //     const params: any[] = [lng, lat, radiusInMeters];
  //     let paramIndex = 4;
  
  //     const conditions = [
  //       `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
  //     ];
  
  //     if (cursor_distance) {
  //       conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
  //       params.push(cursor_distance);
  //       paramIndex++;
  //     }
  
  //     if (category) {
  //       conditions.push(`l.category = $${paramIndex}`);
  //       params.push(category);
  //       paramIndex++;
  //     }
  
  //     if (sub_category) {
  //       conditions.push(`l.sub_category = $${paramIndex}`);
  //       params.push(sub_category);
  //       paramIndex++;
  //     }
  
  //     if (search) {
  //       conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
  //       params.push(`%${search}%`);
  //       paramIndex++;
  //     }
  
  //     if (is_usa === true) {
  //       conditions.push(`l.usa_listing_status = 'APPROVED'`);
  //     }
  
  //     params.push(fetchLimit);
  //     const limitIndex = paramIndex;
  
  //     const whereClause = conditions.join(" AND ");
  
  //     const query = `
  //       SELECT
  //         l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
  //         l.created_at, l.updated_at,
  //         ST_AsText(l.location) AS location,
  //         ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
  //         u.id AS user_id, u.name AS user_name
  //       FROM "listings" l
  //       JOIN "users" u ON u.id = l.user_id
  //       WHERE ${whereClause}
  //       ORDER BY distance_meters ASC
  //       LIMIT $${limitIndex}`;
  
  //     const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  //     const hasNextPage = results.length > limit;
  //     const realListings = hasNextPage ? results.slice(0, limit) : results;
  
  //     // Fetch nearby cities using boundary (polygon) detection
  //     const nearbyCities = await this.prisma.$queryRawUnsafe(`
  //       SELECT id, name, latitude, longitude,
  //         ST_Distance(ST_Centroid(boundary)::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
  //       FROM "cities"
  //       WHERE ST_DWithin(boundary::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
  //       ORDER BY distance ASC
  //     `, lng, lat, radiusInMeters);
  
  //     const cityIds = (nearbyCities as any[]).map(city => city.id);
  
  //     // Fetch ads linked to those cities
  //     const adCities = await this.prisma.adCity.findMany({
  //       where: {
  //         city_id: { in: cityIds },
  //         ad: { active: true }
  //       },
  //       include: {
  //         ad: true,
  //         city: true
  //       }
  //     });
  
  //     // Fetch global ads (ads not linked to any city)
  //     const globalAds = await this.prisma.ad.findMany({
  //       where: { active: true, adCities: { none: {} } }
  //     });
  
  //     // Map to track ads based on city proximity
  //     const adMap = new Map<string, any>();
  //     for (const adCity of adCities) {
  //       const dist = this.getDistance(lat, lng, adCity.city.latitude, adCity.city.longitude);
  //       const existing = adMap.get(adCity.ad.id);
  //       if (!existing || dist < existing.distance_km) {
  //         adMap.set(adCity.ad.id, {
  //           ...adCity.ad,
  //           type: 'ad',
  //           distance_km: dist,
  //           city_name: adCity.city.name
  //         });
  //       }
  //     }
  
  //     const sortedAds = Array.from(adMap.values()).sort((a, b) => a.distance_km - b.distance_km);
  
  //     // Global ads formatted
  //     const globalFormattedAds = globalAds.map(ad => ({
  //       ...ad,
  //       type: 'ad',
  //       distance_km: Infinity,
  //       city_name: null
  //     }));
  
  //     const finalSortedAds = [...sortedAds, ...globalFormattedAds];
  
  //     // Feed building: alternating listings and ads
  //     const finalFeed: any[] = [];
  //     const maxLength = Math.max(realListings.length, finalSortedAds.length);
  
  //     for (let i = 0; i < maxLength; i++) {
  //       if (i < realListings.length) finalFeed.push({ type: 'listing', ...realListings[i] });
  //       if (i < finalSortedAds.length) {
  //         await this.prisma.ad.update({
  //           where: { id: finalSortedAds[i].id },
  //           data: { views: { increment: 1 } }
  //         });
  //         finalFeed.push(finalSortedAds[i]);
  //       }
  //     }
  
  //     // Adding image URLs for ads
  //     finalFeed.forEach(item => {
  //       if (item?.type === 'ad' && item?.image) {
  //         item['image_url'] = SojebStorage.url(appConfig().storageUrl.ads + item?.image);
  //       }
  //     });
  
  //     const nextCursorDistance = hasNextPage ? realListings[realListings.length - 1].distance_meters : null;
  
  //     return {
  //       success: true,
  //       data: finalFeed,
  //       hasNextPage,
  //       nextCursorDistance,
  //       nextListingOffset: listing_offset + realListings.length
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: "Failed to retrieve nearby listings"
  //     };
  //   }
  // }

  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   try {
  //     const {
  //       lng,
  //       lat,
  //       radius = 30,
  //       category,
  //       sub_category,
  //       cursor_distance,
  //       limit = 20,
  //       search,
  //       is_usa,
  //       listing_offset = 0,
  //     } = nearByDto;
  
  //     const radiusInMeters = radius * 1609.34;
  //     const fetchLimit = limit + 1;
  //     const params: any[] = [lng, lat, radiusInMeters];
  //     let paramIndex = 4;
  
  //     const conditions = [
  //       `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
  //     ];
  
  //     if (cursor_distance) {
  //       conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
  //       params.push(cursor_distance);
  //       paramIndex++;
  //     }
  
  //     if (category) {
  //       conditions.push(`l.category = $${paramIndex}`);
  //       params.push(category);
  //       paramIndex++;
  //     }
  
  //     if (sub_category) {
  //       conditions.push(`l.sub_category = $${paramIndex}`);
  //       params.push(sub_category);
  //       paramIndex++;
  //     }
  
  //     if (search) {
  //       conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
  //       params.push(`%${search}%`);
  //       paramIndex++;
  //     }
  
  //     if (is_usa === true) {
  //       conditions.push(`l.usa_listing_status = 'APPROVED'`);
  //     }
  
  //     params.push(fetchLimit);
  //     const limitIndex = paramIndex;
  
  //     const whereClause = conditions.join(" AND ");
  
  //     const query = `
  //       SELECT
  //         l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
  //         l.created_at, l.updated_at,
  //         ST_AsText(l.location) AS location,
  //         ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
  //         u.id AS user_id, u.name AS user_name
  //       FROM "listings" l
  //       JOIN "users" u ON u.id = l.user_id
  //       WHERE ${whereClause}
  //       ORDER BY distance_meters ASC
  //       LIMIT $${limitIndex}`;
  
  //     const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  //     const hasNextPage = results.length > limit;
  //     const realListings = hasNextPage ? results.slice(0, limit) : results;
  
  //     // Fetch nearby cities using boundary (polygon) detection
  //     const nearbyCities = await this.prisma.$queryRawUnsafe(`
  //       SELECT id, name, latitude, longitude,
  //         ST_Distance(ST_Centroid(boundary)::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
  //       FROM "cities"
  //       WHERE ST_DWithin(boundary::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
  //       ORDER BY distance ASC
  //     `, lng, lat, radiusInMeters);
  
  //     const cityIds = (nearbyCities as any[]).map(city => city.id);
  
  //     // Fetch ads linked to those cities
  //     const adCities = await this.prisma.adCity.findMany({
  //       where: {
  //         city_id: { in: cityIds },
  //         ad: { active: true }
  //       },
  //       include: {
  //         ad: true,
  //         city: true
  //       }
  //     });
  
  //     // Fetch global ads (ads not linked to any city)
  //     const globalAds = await this.prisma.ad.findMany({
  //       where: { active: true, adCities: { none: {} } }
  //     });
  
  //     // Map to track ads based on city proximity
  //     const adMap = new Map<string, any>();
  //     for (const adCity of adCities) {
  //       const dist = this.getDistance(lat, lng, adCity.city.latitude, adCity.city.longitude);
  //       const existing = adMap.get(adCity.ad.id);
  //       if (!existing || dist < existing.distance_km) {
  //         adMap.set(adCity.ad.id, {
  //           ...adCity.ad,
  //           type: 'ad',
  //           distance_km: dist,
  //           city_name: adCity.city.name
  //         });
  //       }
  //     }
  
  //     const sortedAds = Array.from(adMap.values()).sort((a, b) => a.distance_km - b.distance_km);
  
  //     // Global ads formatted
  //     const globalFormattedAds = globalAds.map(ad => ({
  //       ...ad,
  //       type: 'ad',
  //       distance_km: Infinity,
  //       city_name: null
  //     }));
  
  //     const finalSortedAds = [...sortedAds, ...globalFormattedAds];
  
  //     // Ad rotation logic (Insert ads based on frequency)
  //     let adIndex = 0;
  //     const finalFeed: any[] = [];
  //     const maxLength = Math.max(realListings.length, finalSortedAds.length);
  
  //     for (let i = 0; i < maxLength; i++) {
  //       if (i < realListings.length) {
  //         finalFeed.push({ type: 'listing', ...realListings[i] });
  
  //         // Insert ad after every 3rd listing (or based on frequency)
  //         if ((i + 1) % 3 === 0 && adIndex < finalSortedAds.length) {
  //           finalFeed.push(finalSortedAds[adIndex]);
  //           adIndex++; // Move to next ad in rotation
  //         }
  //       }
  //     }
  
  //     // Adding image URLs for ads
  //     finalFeed.forEach(item => {
  //       if (item?.type === 'ad' && item?.image) {
  //         item['image_url'] = SojebStorage.url(appConfig().storageUrl.ads + item?.image);
  //       }
  //     });
  
  //     const nextCursorDistance = hasNextPage ? realListings[realListings.length - 1].distance_meters : null;
  
  //     return {
  //       success: true,
  //       data: finalFeed,
  //       hasNextPage,
  //       nextCursorDistance,
  //       nextListingOffset: listing_offset + realListings.length
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: "Failed to retrieve nearby listings"
  //     };
  //   }
  // }

//   async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
//   try {
//     const {
//       lng,
//       lat,
//       radius = 30,
//       category,
//       sub_category,
//       cursor_distance,
//       limit = 20,
//       search,
//       is_usa,
//       listing_offset = 0,
//     } = nearByDto;

//     const radiusInMeters = radius * 1609.34;
//     const fetchLimit = limit + 1;
//     const params: any[] = [lng, lat, radiusInMeters];
//     let paramIndex = 4;

//     const conditions = [
//       `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
//     ];

//     // Add filter conditions based on input parameters
//     if (cursor_distance) {
//       conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
//       params.push(cursor_distance);
//       paramIndex++;
//     }

//     if (category) {
//       conditions.push(`l.category = $${paramIndex}`);
//       params.push(category);
//       paramIndex++;
//     }

//     if (sub_category) {
//       conditions.push(`l.sub_category = $${paramIndex}`);
//       params.push(sub_category);
//       paramIndex++;
//     }

//     if (search) {
//       conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
//       params.push(`%${search}%`);
//       paramIndex++;
//     }

//     if (is_usa === true) {
//       conditions.push(`l.usa_listing_status = 'APPROVED'`);
//     }

//     params.push(fetchLimit);
//     const limitIndex = paramIndex;

//     const whereClause = conditions.join(" AND ");

//     const query = `
//       SELECT
//         l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
//         l.created_at, l.updated_at,
//         ST_AsText(l.location) AS location,
//         ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
//         u.id AS user_id, u.name AS user_name
//       FROM "listings" l
//       JOIN "users" u ON u.id = l.user_id
//       WHERE ${whereClause}
//       ORDER BY distance_meters ASC
//       LIMIT $${limitIndex}`;

//     const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
//     const hasNextPage = results.length > limit;
//     const realListings = hasNextPage ? results.slice(0, limit) : results;

//     // Fetch ads grouped by their ad groups
//     const adGroups = await this.prisma.adGroup.findMany({
//       where: { active: true },
//       include: {
//         ads: { where: { active: true } }
//       }
//     });

//     // Initialize rotation state
//     const adRotationMap = new Map<string, number>(); // Keeps track of which ad in a group to show next
//     adGroups.forEach(group => adRotationMap.set(group.id, 0));

//     const finalFeed: any[] = [];
//     const maxLength = Math.max(realListings.length, adGroups.length);

//     let listingIndex = 0;

//     // Round-robin insert ads from ad groups
//     for (let i = 0; i < maxLength; i++) {
//       // Insert listing
//       if (listingIndex < realListings.length) {
//         finalFeed.push({ type: 'listing', ...realListings[listingIndex] });
//         listingIndex++;
//       }

//       // Insert ads based on ad group frequency
//       for (const group of adGroups) {
//         const frequency = group.frequency || 1; // Default frequency is 1 if not specified

//         if (i % frequency === 0) { // If the current index is a multiple of the frequency, show an ad
//           const adIndex = adRotationMap.get(group.id) || 0;
//           const ad = group.ads[adIndex];

//           // Add the ad to the feed
//           finalFeed.push({ type: 'ad', ...ad });

//           // Rotate to the next ad
//           adRotationMap.set(group.id, (adIndex + 1) % group.ads.length);

//           // Increment the ad view count
//           await this.prisma.ad.update({
//             where: { id: ad.id },
//             data: { views: { increment: 1 } }
//           });
//         }
//       }
//     }

//     // Add image URLs for the ads
//     finalFeed.forEach(item => {
//       if (item?.type === 'ad' && item?.image) {
//         item['image_url'] = SojebStorage.url(appConfig().storageUrl.ads + item?.image);
//       }
//     });

//     return {
//       success: true,
//       data: finalFeed,
//       hasNextPage,
//       nextListingOffset: listing_offset + realListings.length
//     };

//   } catch (error) {
//     console.error("Error fetching nearby listings:", error);
//     return {
//       success: false,
//       message: "Failed to retrieve nearby listings"
//     };
//   }
// }

  

  // private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  //   // Haversine formula to calculate distance between two coordinates
  //   const R = 6371; // Earth's radius in km
  //   const dLat = this.toRad(lat2 - lat1);
  //   const dLon = this.toRad(lon2 - lon1);
  //   const a =
  //     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  //     Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
  //     Math.sin(dLon / 2) * Math.sin(dLon / 2);
  //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  //   return R * c;
  // }

  // private toRad(value: number): number {
  //   return value * Math.PI / 180;
  // }

  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   try {
  //     const {
  //       lng,
  //       lat,
  //       radius = 30,
  //       category,
  //       sub_category,
  //       cursor_distance,
  //       limit = 20,
  //       search,
  //       is_usa,
  //       listing_offset = 0,
  //     } = nearByDto;

  //     // Convert miles to meters (1 mile = 1609.34 meters)
  //     const radiusInMeters = radius * 1609.34;
  //     const fetchLimit = limit + 1;
  //     const params: any[] = [lng, lat, radiusInMeters];
  //     let paramIndex = 4;

  //     // Base condition for proximity search
  //     const conditions = [
  //       `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
  //     ];

  //     // Additional filters
  //     if (cursor_distance) {
  //       conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
  //       params.push(cursor_distance);
  //       paramIndex++;
  //     }

  //     if (category) {
  //       conditions.push(`l.category = $${paramIndex}`);
  //       params.push(category);
  //       paramIndex++;
  //     }

  //     if (sub_category) {
  //       conditions.push(`l.sub_category = $${paramIndex}`);
  //       params.push(sub_category);
  //       paramIndex++;
  //     }

  //     if (search) {
  //       conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
  //       params.push(`%${search}%`);
  //       paramIndex++;
  //     }

  //     if (is_usa === true) {
  //       conditions.push(`l.usa_listing_status = 'APPROVED'`);
  //     }

  //     params.push(fetchLimit);
  //     const limitIndex = paramIndex;

  //     const whereClause = conditions.join(" AND ");

  //     // Main query to fetch listings
  //     const query = `
  //       SELECT
  //         l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
  //         l.created_at, l.updated_at,
  //         ST_AsText(l.location) AS location,
  //         ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
  //         u.id AS user_id, u.name AS user_name
  //       FROM "listings" l
  //       JOIN "users" u ON u.id = l.user_id
  //       WHERE ${whereClause}
  //       ORDER BY distance_meters ASC
  //       LIMIT $${limitIndex}`;

  //     const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  //     const hasNextPage = results.length > limit;
  //     const realListings = hasNextPage ? results.slice(0, limit) : results;

  //     // Fetch nearby cities using boundary (polygon) detection
  //     const nearbyCities = await this.prisma.$queryRawUnsafe(`
  //       SELECT id, name, latitude, longitude,
  //         ST_Distance(ST_Centroid(boundary)::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
  //       FROM "cities"
  //       WHERE boundary IS NOT NULL
  //       AND ST_DWithin(boundary::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
  //       ORDER BY distance ASC
  //     `, lng, lat, radiusInMeters);

  //     const cityIds = (nearbyCities as any[]).map(city => city.id);

  //     // Get all active ad groups with their ads
  //     const now = new Date();
  //     const adGroups = await this.prisma.adGroup.findMany({
  //       where: {
  //         active: true,
  //         start_date: { lte: now },
  //         end_date: { gte: now },
  //       },
  //       include: {
  //         ads: {
  //           where: { active: true },
  //           include: { 
  //             adCities: { 
  //               include: { city: true } 
  //             } 
  //           }
  //         }
  //       },
  //       orderBy: { created_at: 'asc' }
  //     });

  //     // Organize ads by their scope (city-specific or global)
  //     const cityAdMap = new Map<string, any[]>(); // groupId -> ads[]
  //     const globalAds: any[] = [];

  //     for (const group of adGroups) {
  //       for (const ad of group.ads) {
  //         if (ad.adCities.length > 0) {
  //           // City-specific ads - only include if city is in nearby cities
  //           for (const adCity of ad.adCities) {
  //             if (cityIds.includes(adCity.city_id)) {
  //               const dist = this.getDistance(lat, lng, adCity.city.latitude, adCity.city.longitude);
  //               const adWithDistance = {
  //                 ...ad,
  //                 type: 'ad',
  //                 distance_km: dist,
  //                 city_name: adCity.city.name,
  //                 ad_group_id: group.id,
  //                 ad_group_frequency: group.frequency
  //               };
                
  //               if (!cityAdMap.has(group.id)) {
  //                 cityAdMap.set(group.id, []);
  //               }
  //               cityAdMap.get(group.id).push(adWithDistance);
  //             }
  //           }
  //         } else {
  //           // Global ads
  //           globalAds.push({
  //             ...ad,
  //             type: 'ad',
  //             distance_km: Infinity,
  //             city_name: null,
  //             ad_group_id: group.id,
  //             ad_group_frequency: group.frequency
  //           });
  //         }
  //       }
  //     }

  //     // Sort ads within each group by proximity and add global ads to their groups
  //     const sortedAdGroups: Record<string, any[]> = {};
      
  //     // First process city-specific ads
  //     cityAdMap.forEach((ads, groupId) => {
  //       sortedAdGroups[groupId] = ads.sort((a, b) => a.distance_km - b.distance_km);
  //     });

  //     // Then add global ads to their groups
  //     globalAds.forEach(ad => {
  //       const groupId = ad.ad_group_id;
  //       if (!sortedAdGroups[groupId]) {
  //         sortedAdGroups[groupId] = [];
  //       }
  //       sortedAdGroups[groupId].push(ad);
  //     });

  //     // Build the final feed with proper ad rotation
  //     const finalFeed: any[] = [];
  //     const groupCounters: Record<string, number> = {}; // Tracks insertion counts per group
  //     const adPointers: Record<string, number> = {}; // Tracks next ad to show per group

  //     // Initialize counters and pointers for each ad group
  //     adGroups.forEach(group => {
  //       groupCounters[group.id] = 0;
  //       adPointers[group.id] = 0;
  //     });

  //     // Insert listings and ads according to each group's frequency
  //     for (let i = 0; i < realListings.length; i++) {
  //       // Add the listing to the feed
  //       finalFeed.push({ 
  //         type: 'listing', 
  //         ...realListings[i],
  //         distance_km: realListings[i].distance_meters / 1000 // Convert to km
  //       });

  //       // Check each ad group to see if we should insert an ad
  //       for (const group of adGroups) {
  //         groupCounters[group.id]++;
          
  //         // If we've reached the frequency for this group, insert an ad
  //         if (groupCounters[group.id] >= group.frequency) {
  //           const ads = sortedAdGroups[group.id] || [];
  //           if (ads.length > 0) {
  //             // Get next ad in rotation (round-robin)
  //             const adIndex = adPointers[group.id] % ads.length;
  //             const adToInsert = ads[adIndex];
              
  //             // Add to feed
  //             finalFeed.push(adToInsert);
              
  //             // Update pointers and counters
  //             adPointers[group.id]++;
  //             groupCounters[group.id] = 0; // Reset counter for this group
  //           }
  //         }
  //       }
  //     }

  //     // Add image URLs for ads
  //     finalFeed.forEach(item => {
  //       if (item?.type === 'ad' && item?.image) {
  //         item.image_url = SojebStorage.url(appConfig().storageUrl.ads + item.image);
  //       }
  //     });

  //     const nextCursorDistance = hasNextPage ? realListings[realListings.length - 1].distance_meters : null;

  //     return {
  //       success: true,
  //       data: finalFeed,
  //       hasNextPage,
  //       nextCursorDistance,
  //       nextListingOffset: listing_offset + realListings.length
  //     };
  //   } catch (error) {
  //     console.error('Error in getNearbyListings:', error);
  //     return {
  //       success: false,
  //       message: "Failed to retrieve nearby listings"
  //     };
  //   }
  // }

  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   try {
  //     const {
  //       lng,
  //       lat,
  //       radius = 30,
  //       category,
  //       sub_category,
  //       cursor_distance,
  //       limit = 20,
  //       search,
  //       is_usa,
  //       listing_offset = 0,
  //     } = nearByDto;
  
  //     const radiusInMeters = radius * 1609.34;
  //     const fetchLimit = limit + 1;
  //     const params: any[] = [lng, lat, radiusInMeters];
  //     let paramIndex = 4;
  
  //     const conditions = [
  //       `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
  //     ];
  
  //     if (cursor_distance) {
  //       conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
  //       params.push(cursor_distance);
  //       paramIndex++;
  //     }
  
  //     if (category) {
  //       conditions.push(`l.category = $${paramIndex}`);
  //       params.push(category);
  //       paramIndex++;
  //     }
  
  //     if (sub_category) {
  //       conditions.push(`l.sub_category = $${paramIndex}`);
  //       params.push(sub_category);
  //       paramIndex++;
  //     }
  
  //     if (search) {
  //       conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
  //       params.push(`%${search}%`);
  //       paramIndex++;
  //     }
  
  //     if (is_usa === true) {
  //       conditions.push(`l.usa_listing_status = 'APPROVED'`);
  //     }
  
  //     params.push(fetchLimit);
  //     const limitIndex = paramIndex;
  
  //     const whereClause = conditions.join(" AND ");
  
  //     const query = `
  //       SELECT
  //         l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
  //         l.created_at, l.updated_at,
  //         ST_AsText(l.location) AS location,
  //         ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
  //         u.id AS user_id, u.name AS user_name
  //       FROM "listings" l
  //       JOIN "users" u ON u.id = l.user_id
  //       WHERE ${whereClause}
  //       ORDER BY distance_meters ASC
  //       LIMIT $${limitIndex}`;
  
  //     // Fetch listings based on filters
  //     const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  //     const hasNextPage = results.length > limit;
  //     const realListings = hasNextPage ? results.slice(0, limit) : results;
  
  //     // Step 1: Fetch all active ad groups and ads
  //     const adGroups = await this.prisma.adGroup.findMany({
  //       where: { active: true },
  //       include: {
  //         ads: { where: { active: true } }
  //       }
  //     });
  
  //     // Initialize ad rotation map (to track which ad to show next in each group)
  //     const adRotationMap = new Map<string, number>(); // Keeps track of which ad in a group to show next
  //     adGroups.forEach(group => adRotationMap.set(group.id, 0));
  
  //     // Step 2: Merge listings and ads based on group frequency
  //     const finalFeed: any[] = [];
  //     let listingIndex = 0;
  //     let adIndex = 0; // Ad insertion index (controls frequency)
  
  //     // Step 3: Round-robin insert ads from ad groups
  //     for (let i = 0; i < Math.max(realListings.length, adGroups.length); i++) {
  //       // Insert listing
  //       if (listingIndex < realListings.length) {
  //         finalFeed.push({ type: 'listing', ...realListings[listingIndex] });
  //         listingIndex++;
  //       }
  
  //       // Insert ads based on ad group frequency
  //       for (const group of adGroups) {
  //         const frequency = group.frequency || 1; // Default frequency is 1 if not specified
  
  //         // If the ad frequency is reached, insert the ad
  //         if (adIndex % frequency === 0) {
  //           const adRotationPointer = adRotationMap.get(group.id) || 0;
  //           const ad = group.ads[adRotationPointer];
  
  //           finalFeed.push({ type: 'ad', ...ad });
  
  //           // Rotate to the next ad in the group (round-robin)
  //           adRotationMap.set(group.id, (adRotationPointer + 1) % group.ads.length);
  
  //           // Increment the ad view count
  //           await this.prisma.ad.update({
  //             where: { id: ad.id },
  //             data: { views: { increment: 1 } }
  //           });
  //         }
  
  //         // Increment adIndex after each ad insertion (this is the frequency counter)
  //         adIndex++;
  //       }
  //     }
  
  //     // Step 4: Add image URLs for the ads
  //     finalFeed.forEach(item => {
  //       if (item?.type === 'ad' && item?.image) {
  //         item['image_url'] = SojebStorage.url(appConfig().storageUrl.ads + item?.image);
  //       }
  //     });
  
  //     // Step 5: Return the feed data with pagination info
  //     return {
  //       success: true,
  //       data: finalFeed,
  //       hasNextPage,
  //       nextListingOffset: listing_offset + realListings.length
  //     };
  
  //   } catch (error) {
  //     console.error("Error fetching nearby listings:", error);
  //     return {
  //       success: false,
  //       message: "Failed to retrieve nearby listings"
  //     };
  //   }
  // }
  
  

  // async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
  //   try {
  //     const {
  //       lng,
  //       lat,
  //       radius = 30,
  //       category,
  //       sub_category,
  //       cursor_distance,
  //       limit = 20,
  //       search,
  //       is_usa,
  //       listing_offset = 0,
  //     } = nearByDto;
  
  //     const radiusInMeters = radius * 1609.34;
  //     const fetchLimit = limit + 1;
  //     const params: any[] = [lng, lat, radiusInMeters];
  //     let paramIndex = 4;
  
  //     const conditions = [
  //       `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
  //     ];
  
  //     // Add filter conditions based on input parameters
  //     if (cursor_distance) {
  //       conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
  //       params.push(cursor_distance);
  //       paramIndex++;
  //     }
  
  //     if (category) {
  //       conditions.push(`l.category = $${paramIndex}`);
  //       params.push(category);
  //       paramIndex++;
  //     }
  
  //     if (sub_category) {
  //       conditions.push(`l.sub_category = $${paramIndex}`);
  //       params.push(sub_category);
  //       paramIndex++;
  //     }
  
  //     if (search) {
  //       conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
  //       params.push(`%${search}%`);
  //       paramIndex++;
  //     }
  
  //     if (is_usa === true) {
  //       conditions.push(`l.usa_listing_status = 'APPROVED'`);
  //     }
  
  //     params.push(fetchLimit);
  //     const limitIndex = paramIndex;
  //     const whereClause = conditions.join(" AND ");
  
  //     const query = `
  //       SELECT
  //         l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
  //         l.created_at, l.updated_at,
  //         ST_AsText(l.location) AS location,
  //         ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
  //         u.id AS user_id, u.name AS user_name
  //       FROM "listings" l
  //       JOIN "users" u ON u.id = l.user_id
  //       WHERE ${whereClause}
  //       ORDER BY distance_meters ASC
  //       LIMIT $${limitIndex}`;
  
  //     // Fetch listings based on filters
  //     const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
  //     const hasNextPage = results.length > limit;
  //     const realListings = hasNextPage ? results.slice(0, limit) : results;
  
  //     // Step 1: Fetch all active ad groups and ads
  //     const adGroups = await this.prisma.adGroup.findMany({
  //       where: { active: true },
  //       include: {
  //         ads: { where: { active: true } }
  //       }
  //     });
  
  //     // Fetch nearby cities using boundary (polygon) detection
  //     const nearbyCities = await this.prisma.$queryRawUnsafe(`
  //       SELECT id, name, latitude, longitude,
  //       ST_Distance(ST_Centroid(boundary)::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
  //       FROM "cities"
  //       WHERE ST_DWithin(boundary::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
  //       ORDER BY distance ASC
  //     `, lng, lat, radiusInMeters);
  
  //     const cityIds = (nearbyCities as any[]).map(city => city.id);
  
  //     // Step 2: Fetch ads linked to those cities
  //     const adCities = await this.prisma.adCity.findMany({
  //       where: {
  //         city_id: { in: cityIds },
  //         ad: { active: true }
  //       },
  //       include: {
  //         ad: true,
  //         city: true
  //       }
  //     });
  
  //     // Step 3: Fetch global ads not associated with any city
  //     const globalAds = await this.prisma.ad.findMany({
  //       where: {
  //         active: true,
  //         adCities: { none: {} }
  //       }
  //     });
  
  //     // Map ads to be inserted into the feed
  //     const adMap = new Map<string, any>();
  //     for (const adCity of adCities) {
  //       const dist = this.getDistance(lat, lng, adCity.city.latitude, adCity.city.longitude);
  //       const existing = adMap.get(adCity.ad.id);
  //       if (!existing || dist < existing.distance_km) {
  //         adMap.set(adCity.ad.id, {
  //           ...adCity.ad,
  //           type: 'ad',
  //           distance_km: dist,
  //           city_name: adCity.city.name
  //         });
  //       }
  //     }
  
  //     const sortedAds = Array.from(adMap.values()).sort((a, b) => a.distance_km - b.distance_km);
  
  //     const globalFormattedAds = globalAds.map(ad => ({
  //       ...ad,
  //       type: 'ad',
  //       distance_km: Infinity,
  //       city_name: null
  //     }));
  
  //     const finalSortedAds = [...sortedAds, ...globalFormattedAds];
  
  //     // Step 4: Merge listings and ads based on group frequency
  //     const finalFeed: any[] = [];
  //     let listingIndex = 0;
  //     let adInsertedCount = 0; // Track how many ads have been inserted
  
  //     // Round-robin insert ads from ad groups
  //     for (let i = 0; i < realListings.length; i++) {
  //       finalFeed.push({ type: 'listing', ...realListings[i] });
  
  //       let adInsertedForThisListing = false;
  //       for (const group of adGroups) {
  //         const frequency = group.frequency || 1; // Default frequency is 1 if not specified
  
  //         // Insert ad based on ad group frequency
  //         if ((i + 1) % frequency === 0 && !adInsertedForThisListing) {
  //           const adRotationPointer = adRotationMap.get(group.id) || 0;
  //           const ad = group.ads[adRotationPointer];
  
  //           // Add the ad to the feed
  //           finalFeed.push({ type: 'ad', ...ad });
  
  //           // Rotate to the next ad in the group (round-robin)
  //           adRotationMap.set(group.id, (adRotationPointer + 1) % group.ads.length);
  
  //           // Increment the ad view count
  //           await this.prisma.ad.update({
  //             where: { id: ad.id },
  //             data: { views: { increment: 1 } }
  //           });
  
  //           adInsertedForThisListing = true; // Mark that we've inserted an ad for this listing
  //         }
  //       }
  //     }
  
  //     // Step 5: Add image URLs for the ads
  //     finalFeed.forEach(item => {
  //       if (item?.type === 'ad' && item?.image) {
  //         item['image_url'] = SojebStorage.url(appConfig().storageUrl.ads + item?.image);
  //       }
  //     });
  
  //     // Step 6: Return the feed data with pagination info
  //     return {
  //       success: true,
  //       data: finalFeed,
  //       hasNextPage,
  //       nextListingOffset: listing_offset + realListings.length
  //     };
  
  //   } catch (error) {
  //     console.error("Error fetching nearby listings:", error);
  //     return {
  //       success: false,
  //       message: "Failed to retrieve nearby listings"
  //     };
  //   }
  // }

  async getNearbyListings(nearByDto: NearbyListingsQueryDto) {
    try {
      const {
        lng,
        lat,
        radius = 30,
        category,
        sub_category,
        cursor_distance,
        limit = 20,
        search,
        is_usa,
        listing_offset = 0,
      } = nearByDto;
  
      const radiusInMeters = radius * 1609.34;
      const fetchLimit = limit + 1;
      const params: any[] = [lng, lat, radiusInMeters];
      let paramIndex = 4;
  
      const conditions = [
        `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
      ];
  
      if (cursor_distance) {
        conditions.push(`ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > $${paramIndex}`);
        params.push(cursor_distance);
        paramIndex++;
      }
  
      if (category) {
        conditions.push(`l.category = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }
  
      if (sub_category) {
        conditions.push(`l.sub_category = $${paramIndex}`);
        params.push(sub_category);
        paramIndex++;
      }
  
      if (search) {
        conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }
  
      if (is_usa === true) {
        conditions.push(`l.usa_listing_status = 'APPROVED'`);
      }
  
      params.push(fetchLimit);
      const limitIndex = paramIndex;
      const whereClause = conditions.join(" AND ");
  
      const query = `
        SELECT
          l.id, l.slug, l.title, l.category, l.sub_category, l.latitude, l.longitude,
          l.created_at, l.updated_at,
          ST_AsText(l.location) AS location,
          ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
          u.id AS user_id, u.name AS user_name
        FROM "listings" l
        JOIN "users" u ON u.id = l.user_id
        WHERE ${whereClause}
        ORDER BY distance_meters ASC
        LIMIT $${limitIndex}`;
  
      // Fetch listings based on filters
      const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
      const hasNextPage = results.length > limit;
      const realListings = hasNextPage ? results.slice(0, limit) : results;
  
      // Step 1: Fetch all active ad groups and ads
      const adGroups = await this.prisma.adGroup.findMany({
        where: { active: true },
        include: {
          ads: { where: { active: true } }
        }
      });
  
      // Fetch nearby cities using boundary (polygon) detection
      const nearbyCities = await this.prisma.$queryRawUnsafe(`
        SELECT id, name, latitude, longitude,
        ST_Distance(ST_Centroid(boundary)::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
        FROM "cities"
        WHERE ST_DWithin(boundary::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
        ORDER BY distance ASC
      `, lng, lat, radiusInMeters);
  
      const cityIds = (nearbyCities as any[]).map(city => city.id);
  
      // Step 2: Fetch ads linked to those cities
      const adCities = await this.prisma.adCity.findMany({
        where: {
          city_id: { in: cityIds },
          ad: { active: true }
        },
        include: {
          ad: true,
          city: true
        }
      });
  
      // Step 3: Fetch global ads not associated with any city
      const globalAds = await this.prisma.ad.findMany({
        where: {
          active: true,
          adCities: { none: {} }
        }
      });
  
      // Map ads to be inserted into the feed
      const adMap = new Map<string, any>();
      for (const adCity of adCities) {
        const dist = this.getDistance(lat, lng, adCity.city.latitude, adCity.city.longitude);
        const existing = adMap.get(adCity.ad.id);
        if (!existing || dist < existing.distance_km) {
          adMap.set(adCity.ad.id, {
            ...adCity.ad,
            type: 'ad',
            distance_km: dist,
            city_name: adCity.city.name
          });
        }
      }
  
      const sortedAds = Array.from(adMap.values()).sort((a, b) => a.distance_km - b.distance_km);
  
      const globalFormattedAds = globalAds.map(ad => ({
        ...ad,
        type: 'ad',
        distance_km: Infinity,
        city_name: null
      }));
  
      const finalSortedAds = [...sortedAds, ...globalFormattedAds];
  
      // Step 4: Merge listings and ads based on group frequency and rotation
      const finalFeed: any[] = [];
      let listingIndex = 0;
  
      // Initialize ad rotation state (one map per ad group)
      const adRotationMap = new Map<string, number>();
      adGroups.forEach(group => adRotationMap.set(group.id, 0));
  
      // Round-robin insert ads from ad groups
      for (let i = 0; i < realListings.length; i++) {
        finalFeed.push({ type: 'listing', ...realListings[i] });
  
        // Insert ads based on frequency
        for (const group of adGroups) {
          const frequency = group.frequency || 1; // Default frequency is 1 if not specified
  
          // Insert ad if the current index is a multiple of the frequency
          if ((i + 1) % frequency === 0) {
            const adIndex = adRotationMap.get(group.id) || 0;
            const ad = finalSortedAds[adIndex % finalSortedAds.length];
  
            if (ad) {
              finalFeed.push(ad);
  
              // Update ad rotation state
              adRotationMap.set(group.id, adIndex + 1);
  
              // Increment the ad view count
              await this.prisma.ad.update({
                where: { id: ad.id },
                data: { views: { increment: 1 } }
              });
            }
          }
        }
      }
  
      // Step 5: Add image URLs for the ads
      finalFeed.forEach(item => {
        if (item?.type === 'ad' && item?.image) {
          item['image_url'] = SojebStorage.url(appConfig().storageUrl.ads + item?.image);
        }
      });
  
      // Step 6: Return the feed data with pagination info
      return {
        success: true,
        data: finalFeed,
        hasNextPage,
        nextListingOffset: listing_offset + realListings.length
      };
  
    } catch (error) {
      console.error("Error fetching nearby listings:", error);
      return {
        success: false,
        message: "Failed to retrieve nearby listings"
      };
    }
  }
  
  
  

  
}
