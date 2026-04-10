/**
 * Messages Controller
 * Direct Messages (DMs) between users
 */

import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";
import type { Server as SocketIOServer } from "socket.io";

const prisma = new PrismaClient();

/**
 * GET /api/messages/dm/:userId
 * Get DM conversation history between current user and another user
 */
export async function getDmHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user!.id;
  const otherUserId = req.params.userId;

  try {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    // Fetch sender info for messages where we are the receiver
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, walletAddress: true, avatarUrl: true, memberId: true },
    });

    res.json({
      success: true,
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
        isOwn: m.senderId === currentUserId,
      })),
      otherUser: otherUser
        ? {
            id: otherUser.id,
            memberId: otherUser.memberId,
            name: otherUser.name,
            walletAddress: otherUser.walletAddress,
            avatarUrl: otherUser.avatarUrl,
          }
        : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch DM history" });
  }
}

/**
 * POST /api/messages/dm
 * Send a direct message to another user
 */
export async function sendDm(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user!.id;
  const { receiverId, text } = req.body;

  if (!receiverId || !text || !text.trim()) {
    res.status(400).json({ success: false, message: "receiverId and text are required" });
    return;
  }

  try {
    const sender = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, name: true, walletAddress: true },
    });

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiver) {
      res.status(404).json({ success: false, message: "Recipient not found" });
      return;
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId: currentUserId,
        senderName: sender?.name || sender?.walletAddress?.slice(0, 8) || "User",
        senderWallet: sender?.walletAddress ?? null,
        receiverId,
        text: text.trim(),
      },
    });

    const dmPayload = {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: sender?.id || currentUserId,
        name: sender?.name || sender?.walletAddress?.slice(0, 8) || "User",
        walletAddress: sender?.walletAddress || undefined,
      },
    };

    const io = req.app.get("io") as SocketIOServer | undefined;
    io?.to(`user:${receiverId}`).emit("dm_created", dmPayload);
    io?.to(`user:${currentUserId}`).emit("dm_created", dmPayload);

    res.json({
      success: true,
      message: {
        id: dmPayload.id,
        senderId: dmPayload.senderId,
        receiverId: dmPayload.receiverId,
        text: dmPayload.text,
        createdAt: dmPayload.createdAt,
        isOwn: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
}
