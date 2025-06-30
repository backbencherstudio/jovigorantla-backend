import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UseGuards, UploadedFile } from '@nestjs/common';
import { AdsGroupService } from './ads-group.service';
import { CreateAdsGroupDto } from './dto/create-ads-group.dto';
import { UpdateAdsGroupDto } from './dto/update-ads-group.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import appConfig from 'src/config/app.config';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';


@Controller('admin/ads-group')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ads-group')
export class AdsGroupController {
  constructor(private readonly adsGroupService: AdsGroupService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      // storage: diskStorage({
      //   destination:
      //     appConfig().storageUrl.rootUrl + appConfig().storageUrl.ads,
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
  async create(@Body() createAdsGroupDto: CreateAdsGroupDto, @UploadedFile() image: Express.Multer.File) {
   try {
    return await this.adsGroupService.create(createAdsGroupDto, image);
   } catch (error) {
    return {
      success: false,
      message: "ads group create failed",
    }
   }
  }

  @Get()
  async findAll() {
    try {
      return await this.adsGroupService.findAll();
    } catch (error) {
      return {
        success: false,
        message: "ads group retrieve failed",
      }
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.adsGroupService.findOne(id);
    } catch (error) {
      return {
        success: false,
        message: "ads group retrieve failed",
      }
    }
  }

  @UseInterceptors(FileInterceptor('image'))
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAdsGroupDto: UpdateAdsGroupDto) {
    try {
      return await this.adsGroupService.update(id, updateAdsGroupDto);
    } catch (error) {
      return { 
        success: false,
        message: "ads group update failed",
      }
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.adsGroupService.remove(id);
    } catch (error) {
      return {
        success: false,
        message: "ads group delete failed",
      }
    }
  }
}
