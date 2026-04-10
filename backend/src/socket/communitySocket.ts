import { Server, Socket } from "socket.io";
import { addMessage, DEFAULT_ROOM, deleteMessage, pinMessage, roomExists, saveDm } from "../services/communityStore";

interface ConnectedUser {
  id: string;
  name: string;
  walletAddress?: string;
}

const MAX_MESSAGE_LENGTH = 2000;
const userSocketMap = new Map<string, Set<string>>();

function markUserOnline(userId: string, socketId: string): string[] {
  const userSockets = userSocketMap.get(userId) ?? new Set<string>();
  userSockets.add(socketId);
  userSocketMap.set(userId, userSockets);
  return Array.from(userSocketMap.keys());
}

function markUserOffline(userId: string, socketId: string): { onlineUserIds: string[]; isNowOffline: boolean } {
  const userSockets = userSocketMap.get(userId);
  if (userSockets) {
    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      userSocketMap.delete(userId);
      return { onlineUserIds: Array.from(userSocketMap.keys()), isNowOffline: true };
    }
  }
  return { onlineUserIds: Array.from(userSocketMap.keys()), isNowOffline: false };
}

function getSocketUser(socket: Socket): ConnectedUser {
  const authUser = socket.handshake.auth?.user;
  const id = typeof authUser?.id === "string" && authUser.id.trim() ? authUser.id : socket.id;
  const name =
    typeof authUser?.name === "string" && authUser.name.trim()
      ? authUser.name.trim()
      : typeof authUser?.walletAddress === "string" && authUser.walletAddress
        ? authUser.walletAddress.slice(0, 8)
        : `User-${id.slice(0, 5)}`;

  return {
    id,
    name,
    walletAddress: typeof authUser?.walletAddress === "string" ? authUser.walletAddress : undefined,
  };
}

export function initCommunitySocket(io: Server): void {
  io.on("connection", (socket) => {
    const connectedUser = getSocketUser(socket);

    socket.join(DEFAULT_ROOM);
    socket.join(`user:${connectedUser.id}`);
    const onlineUserIds = markUserOnline(connectedUser.id, socket.id);
    socket.emit("presence_state", { onlineUserIds });
    io.emit("presence_update", { userId: connectedUser.id, online: true });

    socket.on("join_room", async ({ roomId }: { roomId: string }) => {
      try {
        if (!roomId || !(await roomExists(roomId))) return;
        socket.join(roomId);
      } catch (err) {
        console.error("[communitySocket] join_room error:", err);
      }
    });

    socket.on("leave_room", ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      socket.leave(roomId);
    });

    socket.on("send_message", async ({ roomId, text, replyToId }: { roomId: string; text: string; replyToId?: string }) => {
      try {
        const normalizedText = String(text || "").trim();
        if (!roomId || !normalizedText) return;
        if (!(await roomExists(roomId))) return;

        const message = await addMessage({
          roomId,
          text: normalizedText.slice(0, MAX_MESSAGE_LENGTH),
          userId: connectedUser.id,
          userName: connectedUser.name,
          walletAddress: connectedUser.walletAddress,
          replyToId,
        });

        io.to(roomId).emit("message_created", message);
      } catch (err) {
        console.error("[communitySocket] send_message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("send_dm", async ({ receiverId, text }: { receiverId: string; text: string }) => {
      try {
        const normalizedText = String(text || "").trim();
        if (!receiverId || !normalizedText) return;

        const dmPayload = await saveDm({
          senderId: connectedUser.id,
          senderName: connectedUser.name,
          senderWallet: connectedUser.walletAddress,
          receiverId,
          text: normalizedText.slice(0, MAX_MESSAGE_LENGTH),
        });

        io.to(`user:${receiverId}`).emit("dm_created", dmPayload);
        socket.emit("dm_created", dmPayload);
      } catch (err) {
        console.error("[communitySocket] send_dm error:", err);
        socket.emit("error", { message: "Failed to send direct message" });
      }
    });

    socket.on("typing_start", async ({ roomId }: { roomId: string }) => {
      try {
        if (!roomId || !(await roomExists(roomId))) return;
        socket.to(roomId).emit("typing_start", {
          roomId,
          userId: connectedUser.id,
          userName: connectedUser.name,
        });
      } catch (err) {
        console.error("[communitySocket] typing_start error:", err);
      }
    });

    socket.on("typing_stop", async ({ roomId }: { roomId: string }) => {
      try {
        if (!roomId || !(await roomExists(roomId))) return;
        socket.to(roomId).emit("typing_stop", {
          roomId,
          userId: connectedUser.id,
        });
      } catch (err) {
        console.error("[communitySocket] typing_stop error:", err);
      }
    });

    socket.on("delete_message", async ({ messageId }: { messageId: string }) => {
      try {
        if (!messageId) return;
        const deleted = await deleteMessage(messageId);
        if (!deleted) return;
        io.emit("message_deleted", { messageId });
      } catch (err) {
        console.error("[communitySocket] delete_message error:", err);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    socket.on("pin_message", async ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
      try {
        if (!messageId) return;
        const updated = await pinMessage(messageId, !!isPinned);
        if (!updated) return;
        io.emit("message_pinned", { messageId, isPinned: !!updated.isPinned });
      } catch (err) {
        console.error("[communitySocket] pin_message error:", err);
        socket.emit("error", { message: "Failed to pin message" });
      }
    });

    socket.on("disconnect", () => {
      const { isNowOffline } = markUserOffline(connectedUser.id, socket.id);
      if (isNowOffline) {
        io.emit("presence_update", {
          userId: connectedUser.id,
          online: false,
          lastSeen: new Date().toISOString(),
        });
      }
    });
  });
}
