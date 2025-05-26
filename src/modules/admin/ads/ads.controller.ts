import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { CreateSidebarAdDto } from './dto/create-sidebar-ad.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import appConfig from 'src/config/app.config';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';

@Controller('admin/ads')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdsController {
  constructor(private readonly adsService: AdsService) { }

  // @Post()
  // @UseInterceptors(
  //   FileInterceptor('image', {
  //     storage: diskStorage({
  //       destination:
  //         appConfig().storageUrl.rootUrl + appConfig().storageUrl.ads,
  //       filename: (req, file, cb) => {
  //         const randomName = Array(32)
  //           .fill(null)
  //           .map(() => Math.round(Math.random() * 16).toString(16))
  //           .join('');
  //         return cb(
  //           null,
  //           `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
  //         );
  //       },
  //     }),
  //     limits: {
  //       fileSize: 5 * 1024 * 1024, // 5MB in bytes
  //     },
  //   }),
  // )
  // async create(@Body() createAdDto: CreateAdDto, @UploadedFile() image: Express.Multer.File) {
  //   try {
  //     return await this.adsService.create(createAdDto, image);
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: "ads create failed",
  //     }
  //   }
  // }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.ads,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(
            null,
            `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
      },
    }),
  )
  async createAd(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: any,
  ) {
    try {
      const createAdDto: CreateAdDto = {
        name: body.name,
        target_url: body.target_url,
        ad_group_id: body.ad_group_id,
        cities: body.cities ? JSON.parse(body.cities) : [], // ✅ Fix is here
      };

      return this.adsService.create(createAdDto, image);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to parse ad data',
        error,
      };
    }
  }


  @Get()
  async findAll() {
    try {
      return await this.adsService.findAll();
    } catch (error) {
      return {
        success: false,
        message: "ads retrieve failed",
      }
    }
  }

  @Post('sidebar-top')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.ads,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(
            null,
            `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
      },
    }),
  )
  async createOrUpdateSidebarTop(@Body() createSidebarAdDto: CreateSidebarAdDto, @UploadedFile() image: Express.Multer.File) {
    try {
      return await this.adsService.createOrUpdateSidebarTop(createSidebarAdDto, image);
    } catch (error) {
      return {
        success: false,
        message: "sidebar top ad create failed",
      }
    }
  }

  @Get('sidebar-top')
  async getSidebarTop() {
    try {
      return await this.adsService.getSidebarTop();
    } catch (error) {
      return {
        success: false,
        message: "sidebar top ad retrieve failed",
      }
    }
  }

  @Post('sidebar-bottom')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.ads,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(
            null,
            `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
      },
    }),
  )
  async createOrUpdateSidebarBottom(@Body() createSidebarAdDto: CreateSidebarAdDto, @UploadedFile() image: Express.Multer.File) {
    try {
      return await this.adsService.createOrUpdateSidebarBottom(createSidebarAdDto, image);
    } catch (error) {
      return {
        success: false,
        message: "sidebar bottom ad create failed",
      }
    }
  }

  @Get('sidebar-bottom')
  async getSidebarBottom() {
    try {
      return await this.adsService.getSidebarBottom();
    } catch (error) {
      return {
        success: false,
        message: "sidebar bottom ad retrieve failed",
      }
    }
  }



  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.adsService.findOne(id);
    } catch (error) {
      return {
        success: false,
        message: "ads retrieve failed",
      }
    }
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.ads,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(
            null,
            `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
      },
    }),
  )
  async update(@Param('id') id: string, @Body() updateAdDto: UpdateAdDto, @UploadedFile() image: Express.Multer.File) {
    try {
      return await this.adsService.update(id, updateAdDto, image);
    } catch (error) {
      return {
        success: false,
        message: "ads update failed",
      }
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.adsService.remove(id);
    } catch (error) {
      return {
        success: false,
        message: "ads delete failed",
      }
    }
  }

  @Post('bulk')
  async createBulkAds(@Body() ads: any[]) {
    return this.adsService.createBulkAds(ads);
  }
}
