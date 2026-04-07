import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

let io: Server;

// Track online users: userId -> Set<socketId>
const onlineUsers = new Map<string, Set<string>>();
// Track typing: roomId -> Set<userId>
const typingUsers = new Map<string, Set<string>>();

export function initSocketIO(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; walletAddress: string };
      (socket as any).userId = decoded.id;
      (socket as any).walletAddress = decoded.walletAddress;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    const walletAddress = (socket as any).walletAddress as string;

    // Track online
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);
    io.emit('user:online', { userId, walletAddress });
    logger.info(`Socket connected: ${userId} (${socket.id})`);

    // Send current online users
    socket.emit('users:online', Array.from(onlineUsers.keys()));

    // ── Join Room ──
    socket.on('room:join', async (roomId: string) => {
      socket.join(`room:${roomId}`);
      logger.info(`${userId} joined room:${roomId}`);

      // Ensure DB membership
      try {
        await prisma.chatRoomMember.upsert({
          where: { roomId_userId: { roomId, userId } },
          update: {},
          create: { roomId, userId },
        });
      } catch (e) { /* room might not exist yet */ }

      socket.to(`room:${roomId}`).emit('room:user_joined', { roomId, userId });
    });

    // ── Leave Room ──
    socket.on('room:leave', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('room:user_left', { roomId, userId });
    });

    // ── Send Message (Room) ──
    socket.on('message:send', async (data: {
      roomId: string;
      text: string;
      replyToId?: string;
    }) => {
      if (!data.text?.trim()) return;

      try {
        const message = await prisma.chatMessage.create({
          data: {
            roomId: data.roomId,
            userId,
            text: data.text.trim(),
            replyToId: data.replyToId || null,
          },
          include: {
            user: { select: { id: true, walletAddress: true, name: true } },
          },
        });

        io.to(`room:${data.roomId}`).emit('message:new', message);

        // Clear typing
        typingUsers.get(data.roomId)?.delete(userId);
        socket.to(`room:${data.roomId}`).emit('typing:stop', { roomId: data.roomId, userId });
      } catch (err) {
        logger.error('Message send error', { error: (err as Error).message });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Send DM ──
    socket.on('dm:send', async (data: {
      receiverId: string;
      text: string;
    }) => {
      if (!data.text?.trim()) return;

      try {
        const dm = await prisma.directMessage.create({
          data: {
            senderId: userId,
            receiverId: data.receiverId,
            text: data.text.trim(),
          },
          include: {
            sender: { select: { id: true, walletAddress: true, name: true } },
          },
        });

        // Send to both sender and receiver
        const receiverSockets = onlineUsers.get(data.receiverId);
        if (receiverSockets) {
          receiverSockets.forEach((sid) => io.to(sid).emit('dm:new', dm));
        }
        socket.emit('dm:new', dm);
      } catch (err) {
        logger.error('DM send error', { error: (err as Error).message });
        socket.emit('error', { message: 'Failed to send DM' });
      }
    });

    // ── Typing Indicators ──
    socket.on('typing:start', (roomId: string) => {
      if (!typingUsers.has(roomId)) typingUsers.set(roomId, new Set());
      typingUsers.get(roomId)!.add(userId);
      socket.to(`room:${roomId}`).emit('typing:start', { roomId, userId });
    });

    socket.on('typing:stop', (roomId: string) => {
      typingUsers.get(roomId)?.delete(userId);
      socket.to(`room:${roomId}`).emit('typing:stop', { roomId, userId });
    });

    // ── Reactions ──
    socket.on('message:react', async (data: { messageId: string; emoji: string }) => {
      try {
        const existing = await prisma.messageReaction.findFirst({
          where: { messageId: data.messageId, userId, emoji: data.emoji },
        });

        if (existing) {
          await prisma.messageReaction.delete({ where: { id: existing.id } });
        } else {
          await prisma.messageReaction.create({
            data: { messageId: data.messageId, userId, emoji: data.emoji },
          });
        }

        // Get updated reactions
        const reactions = await prisma.messageReaction.findMany({
          where: { messageId: data.messageId },
        });

        // Find the message to get its roomId
        const msg = await prisma.chatMessage.findUnique({ where: { id: data.messageId } });
        if (msg) {
          io.to(`room:${msg.roomId}`).emit('message:reactions_updated', {
            messageId: data.messageId,
            reactions,
          });
        }
      } catch (err) {
        logger.error('Reaction error', { error: (err as Error).message });
      }
    });

    // ── Delete Message ──
    socket.on('message:delete', async (messageId: string) => {
      try {
        const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
        if (msg && msg.userId === userId) {
          await prisma.chatMessage.update({
            where: { id: messageId },
            data: { isDeleted: true, text: '[Message deleted]' },
          });
          io.to(`room:${msg.roomId}`).emit('message:deleted', { messageId, roomId: msg.roomId });
        }
      } catch (err) {
        logger.error('Delete message error', { error: (err as Error).message });
      }
    });

    // ── Pin Message ──
    socket.on('message:pin', async (messageId: string) => {
      try {
        const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
        if (msg) {
          const updated = await prisma.chatMessage.update({
            where: { id: messageId },
            data: { isPinned: !msg.isPinned },
          });
          io.to(`room:${msg.roomId}`).emit('message:pinned', {
            messageId,
            roomId: msg.roomId,
            isPinned: updated.isPinned,
          });
        }
      } catch (err) {
        logger.error('Pin message error', { error: (err as Error).message });
      }
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user:offline', { userId });
        }
      }
      // Clear all typing for this user
      typingUsers.forEach((users, roomId) => {
        if (users.delete(userId)) {
          io.to(`room:${roomId}`).emit('typing:stop', { roomId, userId });
        }
      });
      logger.info(`Socket disconnected: ${userId} (${socket.id})`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
