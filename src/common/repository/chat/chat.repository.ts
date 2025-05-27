import { PrismaClient, MessageStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatRepository {
  /**
   * Update message status
   * @returns
   */
  static async updateMessageStatus(message_id: string, status: MessageStatus) {
    // if message exist
    const message = await prisma.message.findFirst({
      where: {
        id: message_id,
      },
    });

    if (!message) {
      return;
    }

    await prisma.message.update({
      where: {
        id: message_id,
      },
      data: {
        status,
      },
    });
  }

  /**
   * Update user status
   * @returns
   */
  static async updateUserStatus(user_id: string, status: string) {
    // if user exist
    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });

    if (!user) {
      return;
    }
    return await prisma.user.update({
      where: { id: user_id },
      data: {
        availability: status,
      },
    });
  }


    /**
   * Mark all unread messages in a conversation as read
   */
  static async markMessagesAsRead(conversationId: string, userId: string) {
    // Get unread messages for this user in this conversation
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversation_id: conversationId,
        receiver_id: userId,
        status: MessageStatus.PENDING, // or .SENT if you're using both
      },
      select: {
        id: true,
        sender_id: true,
      },
    });

    if (!unreadMessages.length) {
      return [];
    }

    const messageIds = unreadMessages.map((msg) => msg.id);

    // Update them all as READ
    await prisma.message.updateMany({
      where: {
        id: {
          in: messageIds,
        },
      },
      data: {
        status: MessageStatus.READ,
      },
    });

    return unreadMessages; // Needed for emitting `message_read`
  }

}
