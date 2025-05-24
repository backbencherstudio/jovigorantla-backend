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
            usa_listing_status, user_id, created_at, updated_at
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
            '${data.updated_at.toISOString()}'
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
      listing_offset = 0 // default to 0 for first page
    } = nearByDto;

    const radiusInMeters = radius * 1609.34;
    const fetchLimit = limit + 1;
    const conditions = [
      `ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
    ];
    const params: any[] = [lng, lat, radiusInMeters];
    let paramIndex = 4;

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
    //  else {
    //   conditions.push(`l.flagged_listing_status = 'APPROVED'`);
    // }

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

    const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
    const hasNextPage = results.length > limit;
    const realListings = hasNextPage ? results.slice(0, limit) : results;

    // Fetch ad groups matching any listed DisplayPageType (supporting multiple categories per group)
    const adGroups = await this.prisma.adGroup.findMany({
      where: {
        active: true,
        AND: [
          {
            OR: [
              ...(category ? [{ display_pages: { has: category as any } }] : []),
              { display_pages: { has: DisplayPageType.HOME } }
            ]
          },
          {
            OR: [
              { start_date: null },
              { start_date: { lte: new Date() } }
            ]
          },
          {
            OR: [
              { end_date: null },
              { end_date: { gte: new Date() } }
            ]
          }
        ]
      },
      include: {
        ads: { where: { active: true } }
      }
    });

    // Round-robin ad rotation state (per ad group)
    const adRotationMap = new Map<string, number>();
    adGroups.forEach(group => adRotationMap.set(group.id, 0));

    const finalFeed: any[] = [];

    for (let i = 0; i < realListings.length; i++) {
      const listing = realListings[i];
      const globalIndex = listing_offset + i;

      finalFeed.push({ type: 'listing', ...listing });

      for (const group of adGroups) {
        if ((globalIndex + 1) % group.frequency === 0 && group.ads.length > 0) {
          const currentIndex = adRotationMap.get(group.id) || 0;
          const ad = group.ads[currentIndex % group.ads.length];

          // Add impression tracking (increment view count)
          await this.prisma.ad.update({
            where: { id: ad.id },
            data: { views: { increment: 1 } }
          });

          finalFeed.push({ type: 'ad', ...ad });
          adRotationMap.set(group.id, currentIndex + 1);
        }
      }
    }

    finalFeed.forEach(item => {
      if (item?.type === 'ad' && item?.image) {
        item['image_url'] = SojebStorage.url(
          appConfig().storageUrl.ads + item?.image,
        )
      }
    })

    const nextCursorDistance = hasNextPage
      ? realListings[realListings.length - 1].distance_meters
      : null;

    return {
      success: true,
      data: finalFeed,
      hasNextPage,
      nextCursorDistance,
      nextListingOffset: listing_offset + realListings.length
    };
   } catch (error) {
    // console.log(error)
    return {
      success: false,
      message: "Failed to retrived nearby listings",
    }
   }
  }
  

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
            name: true
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
  async createMany(listings: CreateListingDto[]) {
    try {
      const insertions = listings.map((listing) => ({
        id: cuid(),
        title: listing.title,
        description: listing.description,
        category: listing.category,
        sub_category: listing.sub_category,
        latitude: listing.lat,
        longitude: listing.lng,
        location: {
          raw: `ST_SetSRID(ST_MakePoint(${listing.lng}, ${listing.lat}), 4326)`
        },
        post_to_usa: listing.is_usa,
        usa_listing_status: listing.is_usa ? ListingStatus.PENDING : null,
        flagged_listing_status: ListingStatus.PENDING,
        user_id: 'cmaqf9rdk0001skmotkx9k7uz'
      }));
  
      for (const data of insertions) {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO "listings" (
            id, title, description, category, sub_category,
            latitude, longitude, location,
            post_to_usa, usa_listing_status, flagged_listing_status,
            user_id, created_at, updated_at
          ) VALUES (
            '${data.id}',
            '${data.title.replace(/'/g, "''")}',
            '${data.description.replace(/'/g, "''")}',
            '${data.category}', '${data.sub_category}',
            ${data.latitude}, ${data.longitude},
            ${data.location.raw},
            ${data.post_to_usa},
            ${data.usa_listing_status ? `'${data.usa_listing_status}'` : 'NULL'},
            '${data.flagged_listing_status}',
            '${data.user_id}',
            NOW(), NOW()
          )
        `);
      }
  
      return { success: true, count: insertions.length };
    } catch (error) {
      console.error("🔥 Bulk Insert Error:", error);
      return {
        success: false,
        message: "An error occurred",
        error: error.message
      };
    }
  }
  
}
