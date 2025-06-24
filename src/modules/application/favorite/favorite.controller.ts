import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';


import { Request } from 'express';
import { FavoritesService } from './favorite.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  async toggle(@Body() createFavoriteDto: CreateFavoriteDto, @Req() req: Request) {
   try {
    createFavoriteDto.user_id = req.user.userId;
    return this.favoritesService.toggle(createFavoriteDto);
   } catch (error) {
    return {
      success: false,
      message: 'Failed to toggle favorite',
    }
   }
  }

  @Get()
  async findAll(@Req() req: Request) {
   try {
    return this.favoritesService.findAll(req.user.userId);
   } catch (error) {
    return {
      success: false,
      message: 'Failed to get favorites',
    }
   }
  }
}