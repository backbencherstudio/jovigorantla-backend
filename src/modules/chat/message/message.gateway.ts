import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

import appConfig from '../../../config/app.config';
import { ChatRepository } from 'src/common/repository/chat/chat.repository';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessageGateway
  implements
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor() { }

  // Map to store connected clients
  public clients = new Map<string, string>(); // userId -> socketId
  private activeUsers = new Map<string, string>(); // username -> socketId

  onModuleInit() { }

  afterInit(server: Server) {
    console.log('Websocket server started');
  }

  // implement jwt token validation
  // async handleConnection(client: Socket, ...args: any[]) {
  //   try {
  //     // const token = client.handshake.headers.authorization?.split(' ')[1];
  //     const token = client.handshake.auth.token;
  //     if (!token) {
  //       client.disconnect();
  //       console.log('No token provided');
  //       return;
  //     }

  //     const decoded: any = jwt.verify(token, appConfig().jwt.secret);
  //     // const decoded: any = this.jwtService.verify(token);
  //     // const userId = client.handshake.query.userId as string;
  //     const userId = decoded.sub;
  //     if (!userId) {
  //       client.disconnect();
  //       console.log('Invalid token');
  //       return;
  //     }

  //     this.clients.set(userId, client.id);
  //     // console.log(`User ${userId} connected with socket ${client.id}`);
  //     await ChatRepository.updateUserStatus(userId, 'online');
  //     // notify the user that the user is online
  //     this.server.emit('userStatusChange', {
  //       user_id: userId,
  //       status: 'online',
  //     });

  //     console.log(`User ${userId} connected`);
  //   } catch (error) {
  //     client.disconnect();
  //     console.error('Error handling connection:', error);
  //   }
  // }

  async handleConnection(client: Socket) {
    const rawCookie = client.handshake.headers.cookie;

    if (!rawCookie) {
      client.disconnect();
      return;
    }

    const cookies = cookie.parse(rawCookie);
    const token = cookies['jwt']; // e.g., access_token

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const decoded: any = jwt.verify(token, appConfig().jwt.secret, {
        ignoreExpiration: true,
      });
      const userId = decoded.sub;

      this.clients.set(userId, client.id);
      // console.log(`WebSocket authenticated as user ${userId}`);
      // Continue setting online status, etc.

      await ChatRepository.updateUserStatus(userId, 'online');
      // notify the user that the user is online
      this.server.emit('userStatusChange', {
        user_id: userId,
        status: 'online',
      });

      // console.log(`User ${userId} connected`);
    } catch (err) {
      console.error('Invalid JWT in socket:', err);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = [...this.clients.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];
    if (userId) {
      this.clients.delete(userId);
      await ChatRepository.updateUserStatus(userId, 'offline');
      // notify the user that the user is offline
      this.server.emit('userStatusChange', {
        user_id: userId,
        status: 'offline',
      });

      // console.log(`User ${userId} disconnected`);
    }

    // console.log(`sojeb User ${userId} disconnected`);

  }

  @SubscribeMessage('read_messages')
  async handleReadMessages(
    client: Socket,
    @MessageBody() body: { conversationId: string; userId: string }
  ) {
    const unreadMessages = await ChatRepository.markMessagesAsRead(
      body.conversationId,
      body.userId,
    );

    // Notify each message sender
    for (const msg of unreadMessages) {
      this.emitMessageRead(msg.sender_id, {
        conversationId: body.conversationId,
        messageId: msg.id,
      });
    }
  }

  @SubscribeMessage('joinRoom')
  handleRoomJoin(client: Socket, body: { room_id: string }) {
    const roomId = body.room_id;
    // console.log(`User ${client.id} joined room ${roomId}`);
    client.join(roomId); // join the room using user_id
    client.emit('joinedRoom', { room_id: roomId });
  }

  @SubscribeMessage('sendMessage')
  async listenForMessages(
    client: Socket,
    @MessageBody() body: { to: string; data: any },
  ) {
    const recipientSocketId = this.clients.get(body.to);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('message', {
        from: body.data.sender.id,
        data: body.data,
      });
    }
  }

  @SubscribeMessage('updateMessageStatus')
  async updateMessageStatus(
    client: Socket,
    @MessageBody() body: { message_id: string; status: MessageStatus },
  ) {
    await ChatRepository.updateMessageStatus(body.message_id, body.status);
    // notify the sender that the message has been sent
    this.server.emit('messageStatusUpdated', {
      message_id: body.message_id,
      status: body.status,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, @MessageBody() body: { to: string; data: any }) {
    const recipientSocketId = this.clients.get(body.to);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('userTyping', {
        from: client.id,
        data: body.data,
      });
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    client: Socket,
    @MessageBody() body: { to: string; data: any },
  ) {
    const recipientSocketId = this.clients.get(body.to);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('userStoppedTyping', {
        from: client.id,
        data: body.data,
      });
    }
  }

  // for calling
  @SubscribeMessage('join')
  handleJoin(client: Socket, { username }: { username: string }) {
    this.activeUsers.set(username, client.id);
    console.log(`${username} joined`);
  }

  @SubscribeMessage('call')
  handleCall(
    client: Socket,
    {
      caller,
      receiver,
      offer,
    }: { caller: string; receiver: string; offer: any },
  ) {
    const receiverSocketId = this.activeUsers.get(receiver);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('incomingCall', { caller, offer });
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(
    client: Socket,
    {
      caller,
      receiver,
      answer,
    }: { caller: string; receiver: string; answer: any },
  ) {
    const callerSocketId = this.activeUsers.get(caller);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('callAccepted', { answer });
    }
  }

  @SubscribeMessage('iceCandidate')
  handleICECandidate(
    client: Socket,
    { receiver, candidate }: { receiver: string; candidate: any },
  ) {
    const receiverSocketId = this.activeUsers.get(receiver);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('iceCandidate', { candidate });
    }
  }

  @SubscribeMessage('endCall')
  handleEndCall(client: Socket, { receiver }: { receiver: string }) {
    const receiverSocketId = this.activeUsers.get(receiver);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('callEnded');
    }
  }

  emitMessageRead(toUserId: string, data: { conversationId: string; messageId: string }) {
    const socketId = this.clients.get(toUserId);
    if (socketId) {
      this.server.to(socketId).emit('message_read', data);
    }
  }
}

// import {
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { Logger } from '@nestjs/common';

// @WebSocketGateway({
//   cors: {
//     origin: '*', // Update with frontend origin in production
//   },
// })
// export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server;

//   private logger: Logger = new Logger('MessageGateway');
//   private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

//   handleConnection(client: Socket) {
//     const userId = client.handshake.query.userId as string;
//     if (userId) {
//       this.connectedUsers.set(userId, client.id);
//       this.logger.log(`User connected: ${userId}`);
//     }
//   }

//   handleDisconnect(client: Socket) {
//     for (const [userId, socketId] of this.connectedUsers) {
//       if (socketId === client.id) {
//         this.connectedUsers.delete(userId);
//         this.logger.log(`User disconnected: ${userId}`);
//         break;
//       }
//     }
//   }

//   emitMessageRead(toUserId: string, data: { conversationId: string; messageId: string }) {
//     const socketId = this.connectedUsers.get(toUserId);
//     if (socketId) {
//       this.server.to(socketId).emit('message_read', data);
//     }
//   }
// }
