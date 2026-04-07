import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

type SocketUser = {
  id: string;
  name: string;
  walletAddress?: string;
};

class CommunitySocketClient {
  private socket: Socket | null = null;
  public typingUsers = new Map<string, Set<string>>();
  private connectionListeners = new Set<(connected: boolean) => void>();

  get isConnected() {
    return !!this.socket?.connected;
  }

  connect(user: SocketUser) {
    const alreadyConnectedForSameUser =
      this.socket?.connected && this.socket.auth?.user?.id === user.id;

    if (alreadyConnectedForSameUser) return;

    this.disconnect();

    this.socket = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: { user },
    });

    this.socket.on('connect', () => {
      this.notifyConnectionChange(true);
    });

    this.socket.on('disconnect', () => {
      this.typingUsers.clear();
      this.notifyConnectionChange(false);
    });

    this.socket.on('typing_start', ({ roomId, userId }: { roomId: string; userId: string }) => {
      if (!roomId || !userId) return;
      const current = this.typingUsers.get(roomId) || new Set<string>();
      current.add(userId);
      this.typingUsers.set(roomId, current);
    });

    this.socket.on('typing_stop', ({ roomId, userId }: { roomId: string; userId: string }) => {
      if (!roomId || !userId) return;
      const current = this.typingUsers.get(roomId);
      if (!current) return;
      current.delete(userId);
      if (current.size === 0) {
        this.typingUsers.delete(roomId);
      } else {
        this.typingUsers.set(roomId, current);
      }
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.typingUsers.clear();
    this.notifyConnectionChange(false);
  }

  onConnectionChange(cb: (connected: boolean) => void) {
    this.connectionListeners.add(cb);
    cb(this.isConnected);
    return () => {
      this.connectionListeners.delete(cb);
    };
  }

  joinRoom(roomId: string) {
    this.socket?.emit('join_room', { roomId });
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave_room', { roomId });
  }

  sendMessage(roomId: string, text: string, replyToId?: string) {
    this.socket?.emit('send_message', { roomId, text, replyToId });
  }

  sendDM(receiverId: string, text: string) {
    this.socket?.emit('send_dm', { receiverId, text });
  }

  startTyping(roomId: string) {
    this.socket?.emit('typing_start', { roomId });
  }

  stopTyping(roomId: string) {
    this.socket?.emit('typing_stop', { roomId });
  }

  onMessage(cb: (message: any) => void) {
    if (!this.socket) return () => {};
    this.socket.on('message_created', cb);
    return () => this.socket?.off('message_created', cb);
  }

  onDM(cb: (dm: any) => void) {
    if (!this.socket) return () => {};
    this.socket.on('dm_created', cb);
    return () => this.socket?.off('dm_created', cb);
  }

  onDelete(cb: (payload: { messageId: string }) => void) {
    if (!this.socket) return () => {};
    this.socket.on('message_deleted', cb);
    return () => this.socket?.off('message_deleted', cb);
  }

  onPin(cb: (payload: { messageId: string; isPinned: boolean }) => void) {
    if (!this.socket) return () => {};
    this.socket.on('message_pinned', cb);
    return () => this.socket?.off('message_pinned', cb);
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionListeners.forEach((listener) => listener(connected));
  }
}

export const communitySocket = new CommunitySocketClient();
