import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface SocketMessage {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  replyToId?: string;
  isPinned?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  user: { id: string; walletAddress: string; name?: string };
  reactions?: { id: string; emoji: string; userId: string }[];
}

interface SocketDM {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  sender: { id: string; walletAddress: string; name?: string };
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());

  // Message callbacks
  const messageCallbackRef = useRef<((msg: SocketMessage) => void) | null>(null);
  const dmCallbackRef = useRef<((dm: SocketDM) => void) | null>(null);
  const reactionCallbackRef = useRef<((data: { messageId: string; reactions: any[] }) => void) | null>(null);
  const deleteCallbackRef = useRef<((data: { messageId: string; roomId: string }) => void) | null>(null);
  const pinCallbackRef = useRef<((data: { messageId: string; roomId: string; isPinned: boolean }) => void) | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('eakhuwat_token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socket.on('users:online', (users: string[]) => setOnlineUsers(users));
    socket.on('user:online', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
    });
    socket.on('user:offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    // Messages
    socket.on('message:new', (msg: SocketMessage) => {
      messageCallbackRef.current?.(msg);
    });
    socket.on('dm:new', (dm: SocketDM) => {
      dmCallbackRef.current?.(dm);
    });
    socket.on('message:reactions_updated', (data: any) => {
      reactionCallbackRef.current?.(data);
    });
    socket.on('message:deleted', (data: any) => {
      deleteCallbackRef.current?.(data);
    });
    socket.on('message:pinned', (data: any) => {
      pinCallbackRef.current?.(data);
    });

    // Typing
    socket.on('typing:start', ({ roomId, userId }: { roomId: string; userId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        if (!next.has(roomId)) next.set(roomId, new Set());
        next.get(roomId)!.add(userId);
        return next;
      });
    });
    socket.on('typing:stop', ({ roomId, userId }: { roomId: string; userId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.get(roomId)?.delete(userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('room:join', roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('room:leave', roomId);
  }, []);

  const sendMessage = useCallback((roomId: string, text: string, replyToId?: string) => {
    socketRef.current?.emit('message:send', { roomId, text, replyToId });
  }, []);

  const sendDM = useCallback((receiverId: string, text: string) => {
    socketRef.current?.emit('dm:send', { receiverId, text });
  }, []);

  const startTyping = useCallback((roomId: string) => {
    socketRef.current?.emit('typing:start', roomId);
  }, []);

  const stopTyping = useCallback((roomId: string) => {
    socketRef.current?.emit('typing:stop', roomId);
  }, []);

  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    socketRef.current?.emit('message:react', { messageId, emoji });
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    socketRef.current?.emit('message:delete', messageId);
  }, []);

  const pinMessage = useCallback((messageId: string) => {
    socketRef.current?.emit('message:pin', messageId);
  }, []);

  const onMessage = useCallback((cb: (msg: SocketMessage) => void) => {
    messageCallbackRef.current = cb;
  }, []);

  const onDM = useCallback((cb: (dm: SocketDM) => void) => {
    dmCallbackRef.current = cb;
  }, []);

  const onReaction = useCallback((cb: (data: { messageId: string; reactions: any[] }) => void) => {
    reactionCallbackRef.current = cb;
  }, []);

  const onDelete = useCallback((cb: (data: { messageId: string; roomId: string }) => void) => {
    deleteCallbackRef.current = cb;
  }, []);

  const onPin = useCallback((cb: (data: { messageId: string; roomId: string; isPinned: boolean }) => void) => {
    pinCallbackRef.current = cb;
  }, []);

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendDM,
    startTyping,
    stopTyping,
    reactToMessage,
    deleteMessage,
    pinMessage,
    onMessage,
    onDM,
    onReaction,
    onDelete,
    onPin,
  };
}
