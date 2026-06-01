const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7000';
import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatService } from '../services/chatService';
import { useAuth } from '../hooks/useAuth';

export const ChatContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || '${API_BASE}';

export function ChatProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [typingUsers, setTypingUsers] = useState({}); // { chatId: Set<userId> }
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeChatRef = useRef(null);

  // Keep activeChatRef in sync
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // ─── Socket.IO Connection ───
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // Clean up socket if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      query: { userId: user.id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Chat socket connected');
      socket.emit('join_chats');
    });

    socket.on('chats_joined', ({ chatIds }) => {
      console.log(`Joined ${chatIds.length} chat rooms`);
    });

    // ─── New message received ───
    socket.on('new_message', (message) => {
      // Update messages list if we're viewing this chat
      if (activeChatRef.current?.chat_id === message.chat_id) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.message_id === message.message_id)) return prev;
          return [...prev, message];
        });

        // Auto mark as read if the chat is active
        if (message.sender_id !== user.id) {
          socket.emit('mark_read', { chatId: message.chat_id });
        }
      }

      // Update chat list with new last message
      setChats(prev => {
        const updated = prev.map(c => {
          if (c.chat_id === message.chat_id) {
            return {
              ...c,
              last_message_content: message.content,
              last_message_type: message.message_type,
              last_message_sender_id: message.sender_id,
              last_message_at: message.sent_at,
              unread_count: activeChatRef.current?.chat_id === message.chat_id && message.sender_id !== user.id
                ? 0
                : message.sender_id !== user.id
                  ? (c.unread_count || 0) + 1
                  : c.unread_count,
            };
          }
          return c;
        });
        // Sort by last_message_at descending
        return updated.sort((a, b) =>
          new Date(b.last_message_at || b.created_at) - new Date(a.last_message_at || a.created_at)
        );
      });
    });

    // ─── Unread badge update ───
    socket.on('unread_update', ({ chatId }) => {
      if (activeChatRef.current?.chat_id !== chatId) {
        setTotalUnread(prev => prev + 1);
      }
    });

    // ─── Typing indicators ───
    socket.on('user_typing', ({ chatId, userId: typingUserId, typing }) => {
      setTypingUsers(prev => {
        const chatTyping = new Set(prev[chatId] || []);
        if (typing) {
          chatTyping.add(typingUserId);
        } else {
          chatTyping.delete(typingUserId);
        }
        return { ...prev, [chatId]: chatTyping };
      });
    });

    // ─── Messages read by other user ───
    socket.on('messages_read', ({ chatId, userId: readerId }) => {
      // Could update read receipts UI here
    });

    // ─── Chat created (e.g., someone started a private chat with us) ───
    socket.on('chat_created', () => {
      fetchChats();
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Chat socket disconnected:', reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);


  // ─── Fetch all chats ───
  const fetchChats = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await chatService.getMyChats();
      setChats(res.data || []);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);


  // ─── Fetch unread count ───
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatService.getUnreadCount();
      setTotalUnread(res.data?.totalUnread || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [isAuthenticated]);


  // ─── Initial load ───
  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
      fetchUnreadCount();
    } else {
      setChats([]);
      setMessages([]);
      setTotalUnread(0);
      setActiveChat(null);
    }
  }, [isAuthenticated, fetchChats, fetchUnreadCount]);


  // ─── Load messages for a chat ───
  const loadMessages = useCallback(async (chatId) => {
    setMessagesLoading(true);
    setHasMoreMessages(true);
    try {
      const res = await chatService.getMessages(chatId);
      setMessages(res.data || []);
      if ((res.data || []).length < 50) {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);


  // ─── Load older messages (infinite scroll) ───
  const loadMoreMessages = useCallback(async (chatId) => {
    if (!hasMoreMessages || messages.length === 0) return;
    const oldestId = messages[0]?.message_id;
    try {
      const res = await chatService.getMessages(chatId, { before: oldestId });
      const older = res.data || [];
      if (older.length < 50) {
        setHasMoreMessages(false);
      }
      setMessages(prev => [...older, ...prev]);
    } catch (err) {
      console.error('Failed to load more messages:', err);
    }
  }, [hasMoreMessages, messages]);


  // ─── Open a chat (set as active, load messages, mark read) ───
  const openChat = useCallback(async (chat) => {
    setActiveChat(chat);

    // Join socket room
    if (socketRef.current) {
      socketRef.current.emit('join_chat', chat.chat_id);
    }

    // Load messages
    await loadMessages(chat.chat_id);

    // Mark as read
    try {
      await chatService.markAsRead(chat.chat_id);
      if (socketRef.current) {
        socketRef.current.emit('mark_read', { chatId: chat.chat_id });
      }
      // Update local unread
      setChats(prev =>
        prev.map(c =>
          c.chat_id === chat.chat_id ? { ...c, unread_count: 0 } : c
        )
      );
      // Recalculate total unread
      setTotalUnread(prev => {
        const chatUnread = chats.find(c => c.chat_id === chat.chat_id)?.unread_count || 0;
        return Math.max(0, prev - chatUnread);
      });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [loadMessages, chats]);


  // ─── Send a message ───
  const sendMessage = useCallback(async (content, messageType = 'text') => {
    if (!activeChat) return;

    const socket = socketRef.current;
    if (socket && socket.connected) {
      // Primary path: socket
      socket.emit('send_message', {
        chatId: activeChat.chat_id,
        content,
        messageType,
      });
    } else {
      // Fallback: REST
      try {
        const res = await chatService.sendMessage(activeChat.chat_id, { content, messageType });
        setMessages(prev => [...prev, res.data]);
      } catch (err) {
        console.error('Failed to send message:', err);
        throw err;
      }
    }
  }, [activeChat]);


  // ─── Open or create private chat ───
  const openPrivateChat = useCallback(async (otherUserId) => {
    try {
      const res = await chatService.getOrCreatePrivateChat(otherUserId);
      const chat = res.data;

      // Join socket room
      if (socketRef.current) {
        socketRef.current.emit('join_chat', chat.chat_id);
      }

      // Refresh chat list
      await fetchChats();

      setActiveChat(chat);
      await loadMessages(chat.chat_id);

      return chat;
    } catch (err) {
      console.error('Failed to open private chat:', err);
      throw err;
    }
  }, [fetchChats, loadMessages]);


  // ─── Typing indicators ───
  const emitTyping = useCallback((chatId) => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;

    socket.emit('typing_start', { chatId });

    // Auto-stop after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { chatId });
    }, 3000);
  }, []);

  const stopTyping = useCallback((chatId) => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;
    socket.emit('typing_stop', { chatId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, []);


  const value = {
    chats,
    activeChat,
    setActiveChat,
    messages,
    totalUnread,
    typingUsers,
    loading,
    messagesLoading,
    hasMoreMessages,
    fetchChats,
    fetchUnreadCount,
    openChat,
    sendMessage,
    openPrivateChat,
    loadMoreMessages,
    emitTyping,
    stopTyping,
    socket: socketRef.current,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
