import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { ListingsQueryDto } from './dto/get-flagged-listing.dto';
import { PrismaService } from 'src/prisma/prisma.service';


@Controller('admin/listings')
@Roles(Role.ADMIN, Role.CO_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) { }

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
  async getFlaggedListings(@Query() listingsQueryDto: ListingsQueryDto) {
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
  async getUsaListings(@Query() listingsQueryDto: ListingsQueryDto) {
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
  async getFlaggedListingsHistory(@Query() listingsHitoryDto: ListingsQueryDto) {
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
  async getUsaListingsHistory(@Query() listingsHitoryDto: ListingsQueryDto) {
    try {
      return await this.listingsService.getUsaListingsHitory(listingsHitoryDto);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get listings',
      }
    }
  }

  @Patch('flagged-listings/:id/approved')
  async approveFlaggedListing(@Param('id') id: string) {
    try {
      return await this.listingsService.updateReportStatus(id, 'APPROVED');
    } catch (error) {
      return {
        success: false,
        message: 'Failed to approve flagged listing',
      }
    }
  }

  @Patch('flagged-listings/:id/blocked')
  async blockFlaggedListing(@Param('id') id: string) {
    try {
      return await this.listingsService.updateReportStatus(id, 'BLOCKED');
    } catch (error) {
      return {
        success: false,
        message: 'Failed to block flagged listing',
      }
    }
  }

  @Patch('flagged-listings/:id/deleted')
  async deleteFlaggedListing(@Param('id') id: string) {
    try {
      return await this.listingsService.updateReportStatus(id, 'DELETED');
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete flagged listing',
      }
    }
  }

  @Patch('flagged-listings/:id/reverse')
  async reverseFlaggedListing(@Param('id') id: string) {
    try {
      return await this.listingsService.reverseUpdateReportStatus(id);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reverse flagged listing',
      };
    }
  }


  @Patch('usa-listings/:id/approved')
  async approveUsaListing(@Param('id') id: string) {
    try {
      return await this.listingsService.updateUsaListingStatus(id, 'APPROVED');
    } catch (error) {
      return {
        success: false,
        message: 'Failed to approve USA listing',
      }
    }
  }

  @Patch('usa-listings/:id/blocked')
  async blockUsaListing(@Param('id') id: string) {
    try {
      return await this.listingsService.updateUsaListingStatus(id, 'BLOCKED');
    } catch (error) {
      return {
        success: false,
        message: 'Failed to block USA listing',
      }
    }
  }

  @Patch('usa-listings/:id/deleted')
  async deleteUsaListing(@Param('id') id: string) {
    try {
      return await this.listingsService.updateUsaListingStatus(id, 'DELETED');
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete USA listing',
      }
    }
  }


  @Patch('usa-listings/:id/reverse')
  async reverseUsaListing(@Param('id') id: string) {
    try {
      return await this.listingsService.reverseUpdateUsaListingStatus(id);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete USA listing',
      }
    }
  }



  






  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
  //   try {
  //     return await this.listingsService.update(id, updateListingDto);
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: 'Failed to update listing',
  //     }
  //   }
  // }



  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.listingsService.remove(+id);
  // }
}
