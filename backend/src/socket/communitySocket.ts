import { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";
import { addMessage, deleteMessage, pinMessage, roomExists } from "../services/communityStore";

interface ConnectedUser {
  id: string;
  name: string;
  walletAddress?: string;
}

const DEFAULT_ROOM = "announcements";
const MAX_MESSAGE_LENGTH = 2000;

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

    socket.on("join_room", ({ roomId }: { roomId: string }) => {
      if (!roomId || !roomExists(roomId)) return;
      socket.join(roomId);
    });

    socket.on("leave_room", ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      socket.leave(roomId);
    });

    socket.on("send_message", ({ roomId, text, replyToId }: { roomId: string; text: string; replyToId?: string }) => {
      const normalizedText = String(text || "").trim();
      if (!roomId || !roomExists(roomId) || !normalizedText) return;

      const message = addMessage({
        roomId,
        text: normalizedText.slice(0, MAX_MESSAGE_LENGTH),
        userId: connectedUser.id,
        userName: connectedUser.name,
        walletAddress: connectedUser.walletAddress,
        replyToId,
      });

      io.to(roomId).emit("message_created", message);
    });

    socket.on("send_dm", ({ receiverId, text }: { receiverId: string; text: string }) => {
      const normalizedText = String(text || "").trim();
      if (!receiverId || !normalizedText) return;

      const dmPayload = {
        id: randomUUID(),
        senderId: connectedUser.id,
        receiverId,
        text: normalizedText.slice(0, MAX_MESSAGE_LENGTH),
        createdAt: new Date().toISOString(),
        sender: {
          id: connectedUser.id,
          name: connectedUser.name,
          walletAddress: connectedUser.walletAddress,
        },
      };

      io.to(`user:${receiverId}`).emit("dm_created", dmPayload);
      socket.emit("dm_created", dmPayload);
    });

    socket.on("typing_start", ({ roomId }: { roomId: string }) => {
      if (!roomId || !roomExists(roomId)) return;
      socket.to(roomId).emit("typing_start", {
        roomId,
        userId: connectedUser.id,
        userName: connectedUser.name,
      });
    });

    socket.on("typing_stop", ({ roomId }: { roomId: string }) => {
      if (!roomId || !roomExists(roomId)) return;
      socket.to(roomId).emit("typing_stop", {
        roomId,
        userId: connectedUser.id,
      });
    });

    socket.on("delete_message", ({ messageId }: { messageId: string }) => {
      if (!messageId) return;
      if (!deleteMessage(messageId)) return;
      io.emit("message_deleted", { messageId });
    });

    socket.on("pin_message", ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
      if (!messageId) return;
      const updated = pinMessage(messageId, !!isPinned);
      if (!updated) return;
      io.emit("message_pinned", { messageId, isPinned: !!updated.isPinned });
    });
  });
}
