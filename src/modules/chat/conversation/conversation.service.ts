import { Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import appConfig from '../../../config/app.config';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../../common/helper/date.helper';
import { MessageGateway } from '../message/message.gateway';

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
  ) { }

  test() {
    this.messageGateway.server.to("").emit('sojeb', {
      name: "sojeb"
    });

    return {
      success: true,
      message: 'test',
    };
  }

  async create(createConversationDto: CreateConversationDto) {
    try {
      const data: any = {};

      if (createConversationDto.creator_id) {
        data.creator_id = createConversationDto.creator_id;
      }
      if (createConversationDto.participant_id) {
        data.participant_id = createConversationDto.participant_id;
      }

      if (createConversationDto.listing_id) {
        data.listing_id = createConversationDto.listing_id;
      }

      // check if conversation exists
      let conversation = await this.prisma.conversation.findFirst({
        select: {
          id: true,
          creator_id: true,
          participant_id: true,
          created_at: true,
          updated_at: true,
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          participant: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
            }
          },
          messages: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
            select: {
              id: true,
              message: true,
              created_at: true,
            },
          },
        },
        where: {
          listing_id: createConversationDto.listing_id,
          OR: [
            {
              creator_id: createConversationDto.creator_id,
              participant_id: createConversationDto.participant_id,
            },
            {
              creator_id: createConversationDto.participant_id,
              participant_id: createConversationDto.creator_id,
            },
          ],
        },
        // where: {
        //   creator_id: data.creator_id,
        //   participant_id: data.participant_id,
        // },
      });

      if (conversation) {
        return {
          success: true,
          message: 'Conversation already exists',
          data: conversation,
        };
      }
      

      conversation = await this.prisma.conversation.create({
        select: {
          id: true,
          creator_id: true,
          participant_id: true,
          created_at: true,
          updated_at: true,
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          participant: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
            }
          },
          messages: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
            select: {
              id: true,
              message: true,
              created_at: true,
            },
          },
        },
        data: {
          ...data,
        },
      });

      // add image url
      if (conversation.creator.avatar) {
        conversation.creator['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + conversation.creator.avatar,
        );
      }
      if (conversation.participant.avatar) {
        conversation.participant['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + conversation.participant.avatar,
        );
      }


      // trigger socket event
      this.messageGateway.server.to(data.creator_id).emit('conversation', {
      // this.messageGateway.server.emit('conversation', {
        from: data.creator_id,
        data: conversation,
      });
      this.messageGateway.server.to(data.participant_id).emit('conversation', {
      // this.messageGateway.server.emit('conversation', {
        from: data.participant_id,
        data: conversation,
      });

      return {
        success: true,
        message: 'Conversation created successfully',
        data: conversation,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // async findAll(user_id: string) {
  //   try {
  //     const conversations = await this.prisma.conversation.findMany({
  //       where: {
  //         OR: [
  //           { creator_id: user_id },
  //           { participant_id: user_id },
  //         ],
  //       },
  //       orderBy: {
  //         updated_at: 'desc',
  //       },
  //       select: {
  //         id: true,
  //         creator_id: true,
  //         participant_id: true,
  //         created_at: true,
  //         updated_at: true,
  //         creator: {
  //           select: {
  //             id: true,
  //             name: true,
  //             avatar: true,
  //           },
  //         },
  //         participant: {
  //           select: {
  //             id: true,
  //             name: true,
  //             avatar: true,
  //           },
  //         },
  //         listing: {
  //           select: {
  //             id: true,
  //             title: true,
  //           }
  //         },
  //         messages: {
  //           orderBy: {
  //             created_at: 'desc',
  //           },
  //           take: 1,
  //           select: {
  //             id: true,
  //             message: true,
  //             created_at: true,
  //           },
  //         },
  //       },
  //     });

  //     // add image url
  //     for (const conversation of conversations) {
  //       if (conversation.creator.avatar) {
  //         conversation.creator['avatar_url'] = SojebStorage.url(
  //           appConfig().storageUrl.avatar + conversation.creator.avatar,
  //         );
  //       }
  //       if (conversation.participant.avatar) {
  //         conversation.participant['avatar_url'] = SojebStorage.url(
  //           appConfig().storageUrl.avatar + conversation.participant.avatar,
  //         );
  //       }
  //     }

  //     return {
  //       success: true,
  //       data: conversations,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: error.message,
  //     };
  //   }
  // }

  async findAll(user_id: string) {
    try {
      console.log(user_id)
      const conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [
            { creator_id: user_id },
            { participant_id: user_id },
          ],
        },
        orderBy: {
          updated_at: 'desc',
        },
        select: {
          id: true,
          creator_id: true,
          participant_id: true,
          created_at: true,
          updated_at: true,
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          participant: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
          messages: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
            select: {
              id: true,
              message: true,
              created_at: true,
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  is_read: false,
                  receiver_id: user_id, // only unread messages for the logged-in user
                },
              },
            },
          },
        },
      });

      console.log(conversations);

      // Add avatar URLs and format response
      const data = conversations.map((conversation) => {
        const creator = {
          ...conversation.creator,
          avatar_url: conversation.creator?.avatar
            ? SojebStorage.url(appConfig().storageUrl.avatar + conversation.creator.avatar)
            : null,
        };

        const participant = {
          ...conversation.participant,
          avatar_url: conversation.participant?.avatar
            ? SojebStorage.url(appConfig().storageUrl.avatar + conversation.participant.avatar)
            : null,
        };

        return {
          ...conversation,
          creator,
          participant,
          unread_count: conversation._count.messages,
        };
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string, user_id: string) {
    try {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id,
          OR: [
            { creator_id: user_id },
            { participant_id: user_id },
          ],
        },
        select: {
          id: true,
          creator_id: true,
          participant_id: true,
          created_at: true,
          updated_at: true,
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          participant: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
            }
          },
        },
      });


      if (!conversation) {
        return {
          success: false,
          message: 'Conversation not found',
        };
      }

      // add image url
      if (conversation.creator.avatar) {
        conversation.creator['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + conversation.creator.avatar,
        );
      }

      return {
        success: true,
        data: conversation,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateConversationDto: UpdateConversationDto) {
    try {
      const data = {};
      if (updateConversationDto.creator_id) {
        data['creator_id'] = updateConversationDto.creator_id;
      }
      if (updateConversationDto.participant_id) {
        data['participant_id'] = updateConversationDto.participant_id;
      }

      await this.prisma.conversation.update({
        where: { id },
        data: {
          ...data,
          updated_at: DateHelper.now(),
        },
      });

      return {
        success: true,
        message: 'Conversation updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string, user_id: string) {
    try {

      // check if conversation exists
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id,
          OR: [
            { creator_id: user_id },
            { participant_id: user_id },
          ],
        },
      });

      if (!conversation) {
        return {
          success: false,
          message: 'Conversation not found',
        };
      }

      await this.prisma.conversation.delete({
        where: { id },
      });

      // trigger socket event
      this.messageGateway.server.to(conversation.creator_id).emit('delete-conversation', {
        from: conversation.creator_id,
        data: conversation,
      });

      this.messageGateway.server.to(conversation.participant_id).emit('delete-conversation', {
        from: conversation.participant_id,
        data: conversation,
      });

      return {
        success: true,
        message: 'Conversation deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async markConversationAsRead(conversationId: string, userId: string) {
    try {
      await this.prisma.message.updateMany({
        where: {
          conversation_id: conversationId,
          receiver_id: userId,
          is_read: false,
        },
        data: {
          is_read: true,
        },
      });

      return {
        success: true,
        message: "Conversation marked as read",
        data: {
          conversation_id: conversationId,
          user_id: userId,
        }
      }

    } catch (error) {
      return {
        success: false,
        message: "Error marking conversation as read",
      }
    }
  }

}
