import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageGateway } from './message.gateway';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Message')
@UseGuards(JwtAuthGuard)
@Controller('chat/message')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly messageGateway: MessageGateway,
  ) {}

  @ApiOperation({ summary: 'Send message' })
  @Post()
  async create(
    @Req() req: Request,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    const user_id = req.user.userId;
    const message = await this.messageService.create(user_id, createMessageDto, req.timezone);
    if (message.success) {
      const messageData = {
        message: {
          id: message.data.id,
          message_id: message.data.id,
          body_text: message.data.message,
          from: message.data.sender_id,
          conversation_id: message.data.conversation_id,
          created_at: message.data.created_at,
          receiver_id: createMessageDto.receiver_id,
        },
      };

      this.messageGateway.server
        .to(message.data.conversation_id)
        .emit('message', {
          from: message.data.sender_id,
          data: messageData,
        });
      
        this.messageGateway.server
        .to(createMessageDto.receiver_id)
        .emit('message', {
            from: message.data.sender_id,
            data: messageData,
          });

          // console.log('emit message', user_id, createMessageDto.receiver_id, messageData)

          

      return {
        success: message.success,
        message: message.message,
        data: messageData.message
      };
    } else {
      return {
        success: message.success,
        message: message.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get all messages' })
  @Get()
  async findAll(
    @Req() req: Request,
    @Query()
    query: { conversation_id: string; limit?: number; cursor?: string },
  ) {
    const user_id = req?.user?.userId;
    const conversation_id = query.conversation_id as string;
    const limit = Number(query.limit) || 20;
    const cursor = query.cursor as string;
    try {
      const messages = await this.messageService.findAll({
        user_id,
        conversation_id,
        limit,
        cursor,
        timezone: req.timezone,
      });
      return messages;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // mark message as read
  @ApiOperation({ summary: 'Mark message as read' })
  @Post('mark-as-read/:message_id')
  async markAsRead(
    @Param('message_id') message_id: string,
  ) {
    try {
      await this.messageService.readMessage(
        message_id,
      );
      return {
        success: true,
        message: 'Message marked as read',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
