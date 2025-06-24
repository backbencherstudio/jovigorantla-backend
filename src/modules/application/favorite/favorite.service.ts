import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async toggle(dto: CreateFavoriteDto) {

   try {
       // check if listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listing_id },
    });

    if (!listing) {
      return { success: false, message: 'Listing not found' };
    }
    
    const existing = await this.prisma.favorite.findUnique({
      where: {
        user_id_listing_id: {
          user_id: dto.user_id,
          listing_id: dto.listing_id,
        },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: {
          user_id_listing_id: {
            user_id: dto.user_id,
            listing_id: dto.listing_id,
          },
        },
      });
      return { success: true, message: 'Favorite removed' };
    }

    await this.prisma.favorite.create({
      data: {
        user_id: dto.user_id,
        listing_id: dto.listing_id,
      },
    });
    return { success: true, message: 'Favorite added' };
   } catch (error) {
    return { success: false, message: 'Failed to add favorite' };
   }
  }

  async findAll(user_id: string) {
    try {
      // const favorites = await this.prisma.favorite.findMany({
      //   where: { user_id },
      //   include: { 
      //     listing: true 
      //   },
      // });

      const favorites = await this.prisma.favorite.findMany({
      where: { user_id },
      include: {
        listing: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  
      const listings = favorites.map(fav => fav.listing);

      return {
        success: true,
        message: 'Favorites retrieved',
        data: listings,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get favorites',
      }
    }
  }
}