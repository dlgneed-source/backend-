import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response';
import { ValidationError, NotFoundError } from '../utils/errors';

// GET /api/rooms
export const getRooms = asyncHandler(async (_req: Request, res: Response) => {
  const rooms = await prisma.chatRoom.findMany({
    orderBy: { isPinned: 'desc' },
    include: { _count: { select: { members: true, messages: true } } },
  });
  successResponse(res, rooms, 'Rooms fetched');
});

// POST /api/rooms
export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;
  const { name, description, isVip } = req.body;
  if (!name?.trim()) throw new ValidationError('Room name required');

  const room = await prisma.chatRoom.create({
    data: {
      name: name.trim(),
      description: description || '',
      isVip: !!isVip,
      createdBy: userId,
      members: { create: { userId, role: 'OWNER' } },
    },
  });
  successResponse(res, room, 'Room created', 201);
});

// POST /api/rooms/:roomId/join
export const joinRoom = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;
  const { roomId } = req.params;

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) throw new NotFoundError('Room not found');

  const existing = await prisma.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (existing) return successResponse(res, existing, 'Already a member');

  const member = await prisma.chatRoomMember.create({
    data: { roomId, userId },
  });
  successResponse(res, member, 'Joined room');
});

// GET /api/rooms/:roomId/messages
export const getRoomMessages = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const before = req.query.before as string | undefined;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

  const where: any = { roomId };
  if (before) where.createdAt = { lt: new Date(before) };

  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, walletAddress: true, name: true } },
      reactions: true,
    },
  });

  successResponse(res, messages.reverse(), 'Messages fetched');
});

// GET /api/dm/:targetUserId/messages
export const getDMMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;
  const { targetUserId } = req.params;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: { select: { id: true, walletAddress: true, name: true } },
    },
  });

  successResponse(res, messages.reverse(), 'DM messages fetched');
});
