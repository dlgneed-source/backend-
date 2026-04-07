import { randomUUID } from "crypto";

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

const rooms: CommunityRoom[] = [
  { id: "announcements", name: "announcements", unread: 0, isVip: false, description: "Official updates and releases", icon: "pin", memberCount: 12450, isPinned: true },
  { id: "general", name: "general", unread: 0, isVip: false, description: "Community talk and support", icon: "hash", memberCount: 8932 },
  { id: "dev-talk", name: "dev-talk", unread: 0, isVip: false, description: "Engineering & integrations", icon: "hash", memberCount: 2341 },
  { id: "trading-signals", name: "trading-signals", unread: 0, isVip: false, description: "Market discussion & alerts", icon: "hash", memberCount: 5678 },
  { id: "alpha-signals", name: "alpha-signals", unread: 0, isVip: true, description: "VIP alpha access only", icon: "lock", memberCount: 420 },
  { id: "nft-alpha", name: "nft-alpha", unread: 0, isVip: true, description: "NFT drops & whitelists", icon: "star", memberCount: 380 },
];

const messages: CommunityMessage[] = [
  {
    id: randomUUID(),
    roomId: "announcements",
    userId: "admin",
    user: { id: "admin", name: "Web3Wizard", walletAddress: "0x99B...1C3d" },
    text: "🎉 Welcome to the new E@Akhuwat Premium Lounge! Experience the future of community.",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isPinned: true,
  },
];

export function listRooms(): CommunityRoom[] {
  return rooms;
}

export function roomExists(roomId: string): boolean {
  return rooms.some((room) => room.id === roomId);
}

export function listRecentMessages(limit = 200): CommunityMessage[] {
  return messages.slice(-limit);
}

export function addMessage(input: {
  roomId: string;
  text: string;
  userId: string;
  userName: string;
  walletAddress?: string;
  replyToId?: string;
}): CommunityMessage {
  const message: CommunityMessage = {
    id: randomUUID(),
    roomId: input.roomId,
    text: input.text,
    createdAt: new Date().toISOString(),
    userId: input.userId,
    user: {
      id: input.userId,
      name: input.userName,
      walletAddress: input.walletAddress,
    },
    replyToId: input.replyToId,
    isPinned: false,
  };
  messages.push(message);
  return message;
}

export function deleteMessage(messageId: string): boolean {
  const index = messages.findIndex((message) => message.id === messageId);
  if (index === -1) return false;
  messages.splice(index, 1);
  return true;
}

export function pinMessage(messageId: string, isPinned: boolean): CommunityMessage | null {
  const message = messages.find((item) => item.id === messageId);
  if (!message) return null;
  message.isPinned = isPinned;
  return message;
}
