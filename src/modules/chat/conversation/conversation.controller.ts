import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Request } from 'express';
import { ReqUser } from 'src/common/req-user.decorator';

@ApiBearerAuth()
@ApiTags('Conversation')
@UseGuards(JwtAuthGuard)
@Controller('chat/conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) { }

  @Post('test')
  test() {
    this.conversationService.test();
    return 'test';
  }


  @ApiOperation({ summary: 'Create conversation' })
  @Post()
  async create(@Body() createConversationDto: CreateConversationDto, @Req() req: Request) {
    try {
      const conversation = await this.conversationService.create(
        createConversationDto, 
        req.timezone
      );
      return conversation;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all conversations' })
  @Get()
  async findAll(@Req() req: Request) {
    try {
      // console.log(req.timezone)
      const conversations = await this.conversationService.findAll(req?.user?.userId, req.timezone);
      return conversations;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Patch(':id/block')
  async block(@Param('id') id: string, @Req() req: Request) {
   try {
    const userId = req.user.userId;
    return await this.conversationService.blockConversation(id, userId);
   } catch (error) {
    return {
      success: false,
      message: "Failed to block conversation"
    }
   }
  }

  @Patch(':id/unblock')
  async unblock(@Param('id') id: string, @Req() req: Request) {
   try {
    const userId = req.user.userId;
    return await this.conversationService.unblockConversation(id, userId);
   } catch (error) {
    return {
      success: false,
      message: "Failed to unblock conversation"
    }
   }
  }

  @Delete(':id/soft-delete')
  async softDelete(@Param('id') id: string, @Req() req: Request) {
   try {
    const userId = req.user.userId;
    return await this.conversationService.softDeleteConversation(id, userId);
   } catch (error) {
    return {
      success: false,
      message: "Failed to soft delete conversation"
    }
   }
  }


  @Patch(':id/read')
  async markAsRead(
    @Param('id') conversationId: string,
    @Req() req: Request, // Replace with your decorator to get auth user
  ) {
    try {
      const userId = req?.user?.userId; // Replace with your decorator to get auth user
      const conversation = await this.conversationService.markConversationAsRead(
        conversationId,
        userId,
      );
      return conversation;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get a conversation by id' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    try {
      const conversation = await this.conversationService.findOne(id, req?.user?.userId, req.timezone);
      return conversation;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a conversation' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    try {
      const conversation = await this.conversationService.remove(id, req?.user?.userId);
      return conversation;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }



}
