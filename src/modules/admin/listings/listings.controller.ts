import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { ListingsQueryDto } from './dto/get-flagged-listing.dto';


@Controller('admin/listings')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // @Post()
  // async create(@Body() createListingDto: CreateListingDto) {
  //   try {
  //     return await this.listingsService.create(createListingDto);;
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: 'Failed to create listing',
  //     }
  //   }
  // }

  // @Get()
  // findAll() {
  //   return this.listingsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.listingsService.findOne(+id);
  // }

  @Get('flagged-listings')
  async getFlaggedListings(listingsQueryDto: ListingsQueryDto) {
    try {
      return await this.listingsService.getFlaggedListings(listingsQueryDto);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get flagged listings',
      }
    }
  }

  @Get('usa-listings')
  async getUsaListings(listingsQueryDto: ListingsQueryDto) {
    try {
      return await this.listingsService.getUsaListings(listingsQueryDto);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get listings',
      }
    }
  }

  // get flagged listings history
  @Get('flagged-listings-history')
  async getFlaggedListingsHistory(listingsHitoryDto: ListingsQueryDto) {
    try {
      return await this.listingsService.getFlaggedListingsHitory(listingsHitoryDto);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get listings',
      }
    }
  }


  // get flagged listings history
  @Get('usa-listings-history')
  async getUsaListingsHistory(listingsHitoryDto: ListingsQueryDto) {
    try {
      return await this.listingsService.getUsaListingsHitory(listingsHitoryDto);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get listings',
      }
    }
  }



  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
    try {
      return await this.listingsService.update(id, updateListingDto);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update listing',
      }
    }
  }

  

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.listingsService.remove(+id);
  // }
}
