import { Body, Get, Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListingStatus } from 'src/common/enum/listing-status.enum';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { ListingsQueryDto } from './dto/get-flagged-listing.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService){}
  // async create(createListingDto: CreateListingDto) {
  //   return 'This action adds a new listing';
  // }

  // findAll() {
  //   return `This action returns all listings`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} listing`;
  // }

  async getFlaggedListings(listingsQueryDto: ListingsQueryDto) {
    try {
     
      const cursor = listingsQueryDto?.cursor || undefined;
      const limit = listingsQueryDto?.limit || 20;

      // Find listings with pagination using cursor
      const listings = await this.prisma.listing.findMany({
        where: {
            flagged_listing_status: ListingStatus.PENDING
        },
        take: limit + 1, // Take one extra to check if there's more
        cursor: cursor ? { id: String(cursor) } : undefined,
        orderBy: {
          created_at: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });


      // const hasNextPage = listings.length > limit;
      // const data = hasNextPage ? listings.slice(0, limit) : listings;

      // return {
      //   success: true,
      //   message: 'Listings fetched successfully',
      //   data: data.map(listing => ({
      //     ...listing,
      //     image_url: listing.image 
      //       ? SojebStorage.url(appConfig().storageUrl.listing + listing.image)
      //       : null,
      //   })),
      //   hasNextPage,
      //   nextCursor: hasNextPage ? listings[limit].id : null, // ✅ This is the correct one
      // };

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
      console.log(error)
      return {
        success: false,
        message: 'Failed to get listings',
      }
    }
  }

  async getUsaListings(listingsQueryDto: ListingsQueryDto) {
    try {
      const cursor = listingsQueryDto?.cursor || undefined;
      const limit = listingsQueryDto?.limit || 20;


      // Find listings with pagination using cursor
      const listings = await this.prisma.listing.findMany({
        where: {
            usa_listing_status: ListingStatus.PENDING
        },
        take: limit + 1, // Take one extra to check if there's more
        cursor: cursor ? { id: String(cursor) } : undefined,
        orderBy: {
          created_at: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
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

  async update(id: string, @Body() updateListingDto: UpdateListingDto) {
    try{
      const listing = await this.prisma.listing.findUnique({
        where: {
          id: id,
        },
      });

      if(!listing){
        return {
          success: false,
          message: 'Listing not found',
        }
      }

      // console.log(updateListingDto.flagged_listing_status)

      const updatedListing = await this.prisma.listing.update({
        where: {
          id: id,
        },
        data: updateListingDto,
      });

      // Add image URL
      if (updatedListing?.image) {
        updatedListing['image_url'] = SojebStorage.url(appConfig().storageUrl.listing + updatedListing.image)
      }

      
      return {
        success: true,
        message: 'Listing updated successfully',
        data: updatedListing,
      }
    }catch(e){
      
      return {
        success: false,
        message: 'Failed to update listing',
      }
    }
  }

  async getFlaggedListingsHitory(listingsHitoryDto: ListingsQueryDto) {
    try {
      const cursor = listingsHitoryDto?.cursor || undefined;
      // const limit = listingsHitoryDto?.limit || 20;
      const limit = 6;

      // Find listings with pagination using cursor
      const listings = await this.prisma.listing.findMany({
        where: {
          NOT: {
            flagged_listing_status: ListingStatus.PENDING
          }
        },
        take: limit + 1, // Take one extra to check if there's more
        cursor: cursor ? { id: String(cursor) } : undefined,
        orderBy: {
          updated_at: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
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


  async getUsaListingsHitory(listingsHitoryDto: ListingsQueryDto) {
    try {
      const cursor = listingsHitoryDto?.cursor || undefined;
      const limit = listingsHitoryDto?.limit || 20;

      // Find listings with pagination using cursor
      const listings = await this.prisma.listing.findMany({
        where: {
          NOT: {
            usa_listing_status: ListingStatus.PENDING
          }
        },
        take: limit + 1, // Take one extra to check if there's more
        cursor: cursor ? { id: String(cursor) } : undefined,
        orderBy: {
          updated_at: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
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


  // remove(id: number) {
  //   return `This action removes a #${id} listing`;
  // }
}
