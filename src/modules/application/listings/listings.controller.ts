import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UseGuards, Req, Query, UploadedFile } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import appConfig from 'src/config/app.config';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { NearbyListingsQueryDto } from './dto/near-by-listing.dto';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { FindAllQueryDto } from './dto/find-all-query.dto';

@Controller('listings')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) { }

  @Get()
  async findAll(@Req() req: Request) {
    try {
      return await this.listingsService.findAll(req?.user?.userId);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get listings',
      }
    }
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image',
      {
        // storage: diskStorage({
        //   destination:
        //     appConfig().storageUrl.rootUrl + appConfig().storageUrl.listing,
        //   filename: (req, file, cb) => {
        //     const randomName = Array(32)
        //       .fill(null)
        //       .map(() => Math.round(Math.random() * 16).toString(16))
        //       .join('');
        //     return cb(
        //       null,
        //       `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
        //     );
        //   },
        // }
        // ),
        storage: memoryStorage(),
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB in bytes
        },
      }
    ),
  )
  async create(@Req() req: Request, @Body() createListingDto: any, @UploadedFile() image: Express.Multer.File) {
    try {
      // console.log("form controller", createListingDto);
      console.log("image", image)
      createListingDto.user_id = req.user.userId;
      createListingDto.cities = JSON.parse(createListingDto.cities);
      return await this.listingsService.create(createListingDto, image);;
    } catch (error) {
      // console.log("form controller", error);
      return {
        success: false,
        message: 'Failed to create listing',
      }
    }
  }

  @Post('bulk-create')
  async bulkCreate(@Body() createListingsDto: any[], @Req() req: Request) {
    console.log('Bulk create listings:', createListingsDto);
    try {
      const userId = req?.user?.userId || "";
      const listingsWithUserId = createListingsDto.map(listing => ({
        ...listing,
        user_id: userId,
      }));
      console.log('Bulk create listings with user ID:', listingsWithUserId);
      return await this.listingsService.bulkCreate(listingsWithUserId);
    }
    catch (error) {
      console.error('Error creating listings (controller):', error);
      return {
        success: false,
        message: 'Failed to create listings',
      }
    }
  }

  @Public()
  @Get('test')
  test() {
    return {
      success: true,
      message: 'Test endpoint is working',
    };
  }

  @Public()
  @Get("nearby")
  async getNearByListings(
    @Query() nearByDto: NearbyListingsQueryDto,
    @Req() req: Request,
  ) {
    try {

      // Example usage
      // const lat = 40.7128; // Latitude for New York
      // const lng = -74.006; // Longitude for New York
      // const radius = 5; // 5miles radius

      return await this.listingsService.findNearbyListings(
        nearByDto?.lat,
        nearByDto?.lng,
        nearByDto?.radius,
        nearByDto?.limit,
        nearByDto.numberOfShownListings,
        nearByDto?.listing_cutoff_time,
        nearByDto?.category,
        nearByDto?.sub_category,
        nearByDto?.search,
        nearByDto?.is_usa,
        req.session
      );
    } catch (error) {
      // console.log(error);
      return {
        success: false,
        message: 'Failed to get nearby listings',
      }
    }
  }

  // @Public()
  // @Get('nearby')
  // async getNearbyListings(
  //   @Query() nearByDto: NearbyListingsQueryDto
  // ) {
  //   try {
  //     return await this.listingsService.getNearbyListings(nearByDto);
  //   } catch (error) {
  //     // console.log(error);
  //     return {
  //       success: false,
  //       message: 'Failed to get nearby listings',
  //     }
  //   }
  // }


  // @Get()
  // async findAll(@Req() req: Request, @Query() findAllQueryDto: FindAllQueryDto) {
  //   try {
  //     return await this.listingsService.findAll(req?.user?.userId, findAllQueryDto);
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: 'Failed to get listings',
  //     }
  //   }
  // }

  @Post(':id/report')
  async reportListing(@Param('id') id: string, @Req() req: Request, @Body() reportDto: { report_type: string }) {
    try {
      const userId = req?.user?.userId || "";
      return await this.listingsService.reportListing(id, userId, reportDto?.report_type);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to report listing',
      }
    }
  }

  @Public()
  @Get(':idOrSlug')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    try {
      return await this.listingsService.findOne(idOrSlug);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get listing',
      }
    }
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      // storage: diskStorage({
      //   destination:
      //     appConfig().storageUrl.rootUrl + appConfig().storageUrl.listing,
      //   filename: (req, file, cb) => {
      //     const randomName = Array(32)
      //       .fill(null)
      //       .map(() => Math.round(Math.random() * 16).toString(16))
      //       .join('');
      //     return cb(
      //       null,
      //       `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
      //     );
      //   },
      // }),
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
      },
    }),
  )
  async update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto, @UploadedFile() image: Express.Multer.File, @Req() req: Request) {
    try {
      updateListingDto.user_id = req?.user?.userId || "";
      return await this.listingsService.update(id, updateListingDto, image);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update listing',
      }
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    try {
      return await this.listingsService.remove(id, req?.user?.userId);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete listing',
      }
    }
  }

  // // testing
  // @Post('bulk')
  // async createBulk(@Body() listings: CreateListingDto[]) {
  //   return await this.listingsService.createMany(listings);
  // }

}
