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
  constructor(private prisma: PrismaService) { }
  // async create(createListingDto: CreateListingDto) {
  //   return 'This action adds a new listing';
  // }

  // findAll() {
  //   return `This action returns all listings`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} listing`;
  // }

  // async getFlaggedListings(listingsQueryDto: ListingsQueryDto) {
  //   try {

  //     const cursor = listingsQueryDto?.cursor || undefined;
  //     const limit = listingsQueryDto?.limit || 20;

  //     // Find listings with pagination using cursor
  //     const listings = await this.prisma.listing.findMany({
  //       where: {
  //           status: ListingStatus.PENDING
  //       },
  //       take: limit + 1, // Take one extra to check if there's more
  //       cursor: cursor ? { id: String(cursor) } : undefined,
  //       orderBy: {
  //         created_at: 'desc'
  //       },
  //       include: {
  //         user: {
  //           select: {
  //             name: true,
  //             email: true,
  //           }
  //         }
  //       }
  //     });


  //     // const hasNextPage = listings.length > limit;
  //     // const data = hasNextPage ? listings.slice(0, limit) : listings;

  //     // return {
  //     //   success: true,
  //     //   message: 'Listings fetched successfully',
  //     //   data: data.map(listing => ({
  //     //     ...listing,
  //     //     image_url: listing.image 
  //     //       ? SojebStorage.url(appConfig().storageUrl.listing + listing.image)
  //     //       : null,
  //     //   })),
  //     //   hasNextPage,
  //     //   nextCursor: hasNextPage ? listings[limit].id : null, // ✅ This is the correct one
  //     // };

  //     const hasNextPage = listings.length > limit;
  //     const data = hasNextPage ? listings.slice(0, limit) : listings;

  //     // Add image URLs and format response
  //     const formattedData = data.map(listing => {
  //       const formatted = {
  //         ...listing,
  //         image_url: listing.image ? 
  //           SojebStorage.url(appConfig().storageUrl.listing + listing.image) : 
  //           null
  //       };
  //       return formatted;
  //     });

  //     return {
  //       success: true,
  //       message: 'Listings fetched successfully',
  //       data: formattedData,
  //       hasNextPage,
  //       nextCursor: hasNextPage ? data[data.length - 1].id : null
  //     }
  //   } catch (error) {
  //     console.log(error)
  //     return {
  //       success: false,
  //       message: 'Failed to get listings',
  //     }
  //   }
  // }

  async getFlaggedListings(queryDto: ListingsQueryDto) {
    try {
      const cursor = queryDto?.cursor || undefined;
      const limit = queryDto?.limit || 20;

      const reports = await this.prisma.report.findMany({
        where: {
          status: 'PENDING',
          listing_id: {
            not: null,
          },
          user_id: {
            not: null,
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: String(cursor) } : undefined,
        orderBy: {
          updated_at: 'desc',
        },
        include: {
          listing: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      const hasNextPage = reports.length > limit;
      const data = hasNextPage ? reports.slice(0, limit) : reports;

      const formatted = data.map((report) => ({
        id: report.id,
        reason: report.reason,
        message: report.message,
        report_type: report.report_type,
        is_usa_report: report.report_type === 'POST_TO_USA',
        created_at: report.created_at,
        updated_at: report.updated_at,
        reported_by: report.user,
        status: report.status,
        listing: {
          id: report.listing?.id,
          title: report.listing?.title,
          category: report.listing?.category,
          sub_category: report.listing?.sub_category,
          image_url: report.listing?.image
            ? SojebStorage.url(appConfig().storageUrl.listing + report.listing.image)
            : null,
          post_to_usa: report.listing?.post_to_usa,
          usa_listing_status: report.listing?.usa_listing_status,
          status: report.listing?.status,
          created_at: report.listing?.created_at,
          user: report.listing?.user,
        },
      }));

      return {
        success: true,
        message: 'Pending reports with listings fetched successfully',
        data: formatted,
        hasNextPage,
        nextCursor: hasNextPage ? data[data.length - 1].id : null,
      };
    } catch (error) {
      console.error('Error in getPendingReportsWithListings:', error);
      return {
        success: false,
        message: 'Failed to get reported listings',
      };
    }
  }


  async getUsaListings(listingsQueryDto: ListingsQueryDto) {
    try {
      const cursor = listingsQueryDto?.cursor || undefined;
      const limit = listingsQueryDto?.limit || 20;


      // Find listings with pagination using cursor
      const listings = await this.prisma.listing.findMany({
        where: {
          usa_listing_status: ListingStatus.PENDING,
          post_to_usa: true, // Ensure we only get listings that are meant for USA
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


  // async update(id: string, @Body() updateListingDto: UpdateListingDto) {
  //   try {
  //     const listing = await this.prisma.listing.findUnique({
  //       where: {
  //         id: id,
  //       },
  //     });

  //     if (!listing) {
  //       return {
  //         success: false,
  //         message: 'Listing not found',
  //       }
  //     }

  //     // console.log(updateListingDto.flagged_listing_status)

  //     const updatedListing = await this.prisma.listing.update({
  //       where: {
  //         id: id,
  //       },
  //       data: updateListingDto,
  //     });

  //     // Add image URL
  //     if (updatedListing?.image) {
  //       updatedListing['image_url'] = SojebStorage.url(appConfig().storageUrl.listing + updatedListing.image)
  //     }


  //     return {
  //       success: true,
  //       message: 'Listing updated successfully',
  //       data: updatedListing,
  //     }
  //   } catch (e) {

  //     return {
  //       success: false,
  //       message: 'Failed to update listing',
  //     }
  //   }
  // }

  async updateReportStatus(
    reportId: string,
    newStatus: 'APPROVED' | 'BLOCKED' | 'DELETED'
  ) {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
        include: {
          listing: {
            select: {
              id: true,
              user_id: true,
            },
          },
        },
      });

      if (!report) {
        return {
          success: false,
          message: 'Report not found',
        };
      }

      const updateTasks: Promise<any>[] = [];

      // 1. Update this report
      updateTasks.push(
        this.prisma.report.update({
          where: { id: reportId },
          data: {
            status: newStatus,  
            updated_at: new Date(),
          },
        })
      );

      // // 2. Update other pending reports for same listing
      // updateTasks.push(
      //   this.prisma.report.updateMany({
      //     where: {
      //       listing_id: report.listing.id,
      //       status: 'PENDING',
      //       NOT: { id: reportId },
      //     },
      //     data: {
      //       status: newStatus,
      //       updated_at: new Date(),
      //     },
      //   })
      // );

      // 3. Update listing (normal or USA) depending on report type
      const listingUpdatePayload: any = { updated_at: new Date() };

      if (report.report_type === 'POST_TO_USA') {
        listingUpdatePayload.usa_listing_status = newStatus;
      } else {
        listingUpdatePayload.status = newStatus;
      }

      updateTasks.push(
        this.prisma.listing.update({
          where: { id: report.listing.id },
          data: listingUpdatePayload,
        })
      );

      // 4. If BLOCKED, also block the user
      if (newStatus === 'BLOCKED') {
        updateTasks.push(
          this.prisma.user.update({
            where: { id: report.listing.user_id },
            data: {
              status: 0,
              updated_at: new Date(),
            },
          })
        );
      }

      // Execute all updates in parallel
      await Promise.all(updateTasks);

      return {
        success: true,
        message: `Report updated to ${newStatus} successfully.`,
      };
    } catch (error) {
      console.error('Error in updateReportStatus:', error);
      return {
        success: false,
        report_id: reportId,
        message: 'Failed to update report status',
      };
    }
  }

  async updateUsaListingStatus(
    listingId: string,
    newStatus: 'APPROVED' | 'BLOCKED' | 'DELETED'
  ) {
    try {
      // Fetch listing with user ID
      const listing = await this.prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          user_id: true,
          post_to_usa: true,
        },
      });

      if (!listing) {
        return {
          success: false,
          message: 'Listing not found',
        };
      }

      if (!listing.post_to_usa) {
        return {
          success: false,
          message: 'This is not a USA listing',
        };
      }

      const updateTasks: Promise<any>[] = [];

      // 1. Update usa_listing_status
      updateTasks.push(
        this.prisma.listing.update({
          where: { id: listingId },
          data: {
            usa_listing_status: newStatus,
            status: newStatus,
            updated_at: new Date(),
          },
        })
      );

      // 2. If BLOCKED, also block user
      if (newStatus === 'BLOCKED') {
        updateTasks.push(
          this.prisma.user.update({
            where: { id: listing.user_id },
            data: {
              status: 0,
              updated_at: new Date(),
            },
          })
        );
      }

      await Promise.all(updateTasks);

      return {
        success: true,
        message: `USA listing status updated to ${newStatus} successfully`,
      };
    } catch (error) {
      console.error('Error in updateUsaListingStatus:', error);
      return {
        success: false,
        message: 'Failed to update USA listing status',
      };
    }
  }



  // async getFlaggedListingsHitory(listingsHitoryDto: ListingsQueryDto) {
  //   try {
  //     const cursor = listingsHitoryDto?.cursor || undefined;
  //     // const limit = listingsHitoryDto?.limit || 20;
  //     const limit = 6;

  //     // Find listings with pagination using cursor
  //     const listings = await this.prisma.listing.findMany({
  //       where: {
  //         NOT: {
  //           status: ListingStatus.PENDING
  //         }
  //       },
  //       take: limit + 1, // Take one extra to check if there's more
  //       cursor: cursor ? { id: String(cursor) } : undefined,
  //       orderBy: {
  //         updated_at: 'desc'
  //       },
  //       include: {
  //         user: {
  //           select: {
  //             name: true,
  //             email: true
  //           }
  //         }
  //       }
  //     });

  //     const hasNextPage = listings.length > limit;
  //     const data = hasNextPage ? listings.slice(0, limit) : listings;

  //     // Add image URLs and format response
  //     const formattedData = data.map(listing => {
  //       const formatted = {
  //         ...listing,
  //         image_url: listing.image ?
  //           SojebStorage.url(appConfig().storageUrl.listing + listing.image) :
  //           null
  //       };
  //       return formatted;
  //     });

  //     return {
  //       success: true,
  //       message: 'Listings fetched successfully',
  //       data: formattedData,
  //       hasNextPage,
  //       nextCursor: hasNextPage ? data[data.length - 1].id : null
  //     }
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: 'Failed to get listings',
  //     }
  //   }
  // }

  async getFlaggedListingsHitory(queryDto: ListingsQueryDto) {
    try {
      const cursor = queryDto?.cursor || undefined;
      const limit = queryDto?.limit || 20;

      const reports = await this.prisma.report.findMany({
        where: {
          NOT: {
            status: 'PENDING',
          },
          listing_id: {
            not: null,
          },
          user_id: {
            not: null,
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: String(cursor) } : undefined,
        orderBy: {
          updated_at: 'desc',
        },
        include: {
          listing: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      const hasNextPage = reports.length > limit;
      const data = hasNextPage ? reports.slice(0, limit) : reports;

      const formatted = data.map((report) => ({
        report_id: report.id,
        reason: report.reason,
        message: report.message,
        report_type: report.report_type,
        is_usa_report: report.report_type === 'POST_TO_USA',
        created_at: report.created_at,
        reported_by: report.user,
        status: report.status,
        updated_at: report.updated_at,
        listing: {
          id: report.listing?.id,
          title: report.listing?.title,
          category: report.listing?.category,
          sub_category: report.listing?.sub_category,
          image_url: report.listing?.image
            ? SojebStorage.url(appConfig().storageUrl.listing + report.listing.image)
            : null,
          post_to_usa: report.listing?.post_to_usa,
          usa_listing_status: report.listing?.usa_listing_status,
          status: report.listing?.status,
          created_at: report.listing?.created_at,
          user: report.listing?.user,
        },
      }));

      return {
        success: true,
        message: 'Pending reports history with listings fetched successfully',
        data: formatted,
        hasNextPage,
        nextCursor: hasNextPage ? data[data.length - 1].id : null,
      };
    } catch (error) {
      console.error('Error in getPendingReportsWithListings:', error);
      return {
        success: false,
        message: 'Failed to get reported listings',
      };
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
          },
          post_to_usa: true, // Ensure we only get listings that are meant for USA
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


  async reverseUpdateReportStatus(reportId: string) {
    try {
      // 1. Find the report with necessary relations
      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
        include: {
          listing: {
            select: {
              id: true,
              user_id: true,
              status: true,
              usa_listing_status: true,
            },
          },
        },
      });
  
      if (!report) {
        return {
          success: false,
          message: 'Report not found',
        };
      }
  
      const updateTasks: Promise<any>[] = [];
  
      // 2. Restore the specified report to PENDING
      updateTasks.push(
        this.prisma.report.update({
          where: { id: reportId },
          data: {
            status: 'PENDING',
            updated_at: new Date(),
          },
        })
      );
  
      // // 3. Restore other reports for the same listing to PENDING
      // updateTasks.push(
      //   this.prisma.report.updateMany({
      //     where: {
      //       listing_id: report.listing.id,
      //       status: report.status, // Match reports with the same status as the original
      //       NOT: { id: reportId },
      //     },
      //     data: {
      //       status: 'PENDING',
      //       updated_at: new Date(),
      //     },
      //   })
      // );
  
      // 4. Restore the listing's status
      const listingUpdatePayload: any = { updated_at: new Date() };
  
      if (report.report_type === 'POST_TO_USA') {
        listingUpdatePayload.usa_listing_status = 'APPROVED';
      } else {
        listingUpdatePayload.status = 'APPROVED';
      }
  
      updateTasks.push(
        this.prisma.listing.update({
          where: { id: report.listing.id },
          data: listingUpdatePayload,
        })
      );
  
      // 5. Restore the user's status if it was blocked
      if (report.status === 'BLOCKED') {
        updateTasks.push(
          this.prisma.user.update({
            where: { id: report.listing.user_id },
            data: {
              status: 1, // Restore to active
              updated_at: new Date(),
            },
          })
        );
      }
  
      // Execute all updates in parallel
      await Promise.all(updateTasks);
  
      return {
        success: true,
        message: 'Report status reversal completed successfully.',
      };
    } catch (error) {
      console.error('Error in reverseUpdateReportStatus:', error);
      return {
        success: false,
        message: 'Failed to reverse report status',
      };
    }
  }


  async reverseUpdateUsaListingStatus(listingId: string) {
    try {
      // 1. Fetch listing with user ID and status
      const listing = await this.prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          user_id: true,
          post_to_usa: true,
          usa_listing_status: true,
          status: true,
        },
      });
  
      if (!listing) {
        return {
          success: false,
          message: 'Listing not found',
        };
      }
  
      if (!listing.post_to_usa) {
        return {
          success: false,
          message: 'This is not a USA listing',
        };
      }
  
      const updateTasks: Promise<any>[] = [];
      
  
      // 2. Restore usa_listing_status to PENDING
      updateTasks.push(
        this.prisma.listing.update({
          where: { id: listingId },
          data: {
            usa_listing_status: 'PENDING',
            status: 'APPROVED',
            updated_at: new Date(),
          },
        })
      );
  
      // 3. If the listing was BLOCKED, restore user status
      if (listing.usa_listing_status === 'BLOCKED') {
        updateTasks.push(
          this.prisma.user.update({
            where: { id: listing.user_id },
            data: {
              status: 1, // Restore to active
              updated_at: new Date(),
            },
          })
        );
      }
  
      // Execute all updates in parallel
      await Promise.all(updateTasks);
  
      return {
        success: true,
        message: 'USA listing status reversal completed successfully.',
      };
    } catch (error) {
      console.error('Error in reverseUpdateUsaListingStatus:', error);
      return {
        success: false,
        message: 'Failed to reverse USA listing status',
      };
    }
  }
  
  


  // remove(id: number) {
  //   return `This action removes a #${id} listing`;
  // }
}
