import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DEFAULT_ROOM = "announcements";

export interface CommunityRoom {
  id: string;
  name: string;
  unread: number;
  isVip: boolean;
  description?: string;
  icon?: "hash" | "pin" | "lock" | "star";
  memberCount?: number;
  isPinned?: boolean;
}

export interface CommunityUser {
  id: string;
  name: string;
  walletAddress?: string;
}

export interface CommunityMessage {
  id: string;
  roomId: string;
  text: string;
  createdAt: string;
  userId: string;
  user: CommunityUser;
  replyToId?: string;
  isPinned?: boolean;
}

const DEFAULT_ROOMS: Array<Omit<CommunityRoom, "unread">> = [
  { id: "announcements", name: "announcements", isVip: false, description: "Official updates and releases", icon: "pin", memberCount: 12450, isPinned: true },
  { id: "general", name: "general", isVip: false, description: "Community talk and support", icon: "hash", memberCount: 8932 },
  { id: "dev-talk", name: "dev-talk", isVip: false, description: "Engineering & integrations", icon: "hash", memberCount: 2341 },
  { id: "trading-signals", name: "trading-signals", isVip: false, description: "Market discussion & alerts", icon: "hash", memberCount: 5678 },
  { id: "alpha-signals", name: "alpha-signals", isVip: true, description: "VIP alpha access only", icon: "lock", memberCount: 420 },
  { id: "nft-alpha", name: "nft-alpha", isVip: true, description: "NFT drops & whitelists", icon: "star", memberCount: 380 },
];

/**
 * Seed default rooms into the DB if they don't exist yet.
 * Call once at server startup.
 */
export async function seedRoomsIfNeeded(): Promise<void> {
  for (const room of DEFAULT_ROOMS) {
    await prisma.communityRoom.upsert({
      where: { id: room.id },
      update: {},
      create: {
        id: room.id,
        name: room.name,
        isVip: room.isVip,
        description: room.description ?? null,
        icon: room.icon ?? null,
        memberCount: room.memberCount ?? 0,
        isPinned: room.isPinned ?? false,
        isActive: true,
      },
    });
  }
}

export async function listRooms(): Promise<CommunityRoom[]> {
  const rows = await prisma.communityRoom.findMany({
    where: { isActive: true },
    orderBy: [{ isPinned: "desc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    unread: 0,
    isVip: r.isVip,
    description: r.description ?? undefined,
    icon: (r.icon as CommunityRoom["icon"]) ?? undefined,
    memberCount: r.memberCount,
    isPinned: r.isPinned,
  }));
}

export async function roomExists(roomId: string): Promise<boolean> {
  const room = await prisma.communityRoom.findUnique({ where: { id: roomId, isActive: true } });
  return room !== null;
}

export async function listRecentMessages(roomId: string, limit = 200): Promise<CommunityMessage[]> {
  const rows = await prisma.communityMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.reverse().map(dbMsgToMsg);
}

export async function addMessage(input: {
  roomId: string;
  text: string;
  userId: string;
  userName: string;
  walletAddress?: string;
  replyToId?: string;
}): Promise<CommunityMessage> {
  const row = await prisma.communityMessage.create({
    data: {
      roomId: input.roomId,
      userId: input.userId,
      userName: input.userName,
      walletAddress: input.walletAddress ?? null,
      text: input.text,
      replyToId: input.replyToId ?? null,
      isPinned: false,
    },
  });
  return dbMsgToMsg(row);
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    await prisma.communityMessage.delete({ where: { id: messageId } });
    return true;
  } catch {
    return false;
  }
}

export async function pinMessage(messageId: string, isPinned: boolean): Promise<CommunityMessage | null> {
  try {
    const row = await prisma.communityMessage.update({
      where: { id: messageId },
      data: { isPinned },
    });
    return dbMsgToMsg(row);
  } catch {
    return null;
  }
}

export async function saveDm(input: {
  senderId: string;
  senderName: string;
  senderWallet?: string;
  receiverId: string;
  text: string;
}): Promise<{ id: string; senderId: string; receiverId: string; text: string; createdAt: string; sender: CommunityUser }> {
  const row = await prisma.directMessage.create({
    data: {
      senderId: input.senderId,
      senderName: input.senderName,
      senderWallet: input.senderWallet ?? null,
      receiverId: input.receiverId,
      text: input.text,
    },
  });
  return {
    id: row.id,
    senderId: row.senderId,
    receiverId: row.receiverId,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
    sender: { id: row.senderId, name: row.senderName, walletAddress: row.senderWallet ?? undefined },
  };
}

// =============================================
// HELPERS
// =============================================

function dbMsgToMsg(row: {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  walletAddress: string | null;
  text: string;
  replyToId: string | null;
  isPinned: boolean;
  createdAt: Date;
}): CommunityMessage {
  return {
    id: row.id,
    roomId: row.roomId,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
    userId: row.userId,
    user: { id: row.userId, name: row.userName, walletAddress: row.walletAddress ?? undefined },
    replyToId: row.replyToId ?? undefined,
    isPinned: row.isPinned,
  };
}
