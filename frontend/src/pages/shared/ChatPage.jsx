import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiSearch, FiSend, FiMessageSquare, FiArrowLeft,
  FiUsers, FiChevronUp
} from 'react-icons/fi';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import './Chat.css';

// ═══════════════════════════════════════════
// HELPER: Format timestamps
// ═══════════════════════════════════════════

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;

  // Today: show time
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth()) {
    return 'Yesterday';
  }
  // This week: day name
  if (diff < 604800000) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  // Older: date
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;

  if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth()) return 'Yesterday';

  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function getChatName(chat) {
  if (chat.type === 'workshop') return chat.workshop_title || 'Workshop Chat';
  if (chat.type === 'mentorship') return chat.mentorship_title || 'Mentorship Chat';
  if (chat.type === 'private') {
    if (chat.other_user) return `${chat.other_user.FName} ${chat.other_user.LName}`;
    if (chat.other_user_fname) return `${chat.other_user_fname} ${chat.other_user_lname}`;
    return 'Private Chat';
  }
  return 'Chat';
}

function getChatInitials(chat) {
  if (chat.type === 'workshop') return '🔨';
  if (chat.type === 'mentorship') return '📚';
  if (chat.type === 'private') {
    const fname = chat.other_user?.FName || chat.other_user_fname || '';
    const lname = chat.other_user?.LName || chat.other_user_lname || '';
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase();
  }
  return '💬';
}

function getChatImage(chat) {
  if (chat.type === 'private') {
    return chat.other_user?.ProfileImage || chat.other_user_image || null;
  }
  return null;
}

const API_BASE = import.meta.env.VITE_API_URL || '${API_BASE}';

function getImageUrl(img) {
  if (!img) return null;
  return img.startsWith('/') ? `${API_BASE}${img}` : img;
}


// ═══════════════════════════════════════════
// MAIN CHAT PAGE
// ═══════════════════════════════════════════

export default function ChatPage() {
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    chats, activeChat, messages, typingUsers,
    loading, messagesLoading, hasMoreMessages,
    openChat, sendMessage, emitTyping, stopTyping,
    loadMoreMessages, setActiveChat, fetchChats,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const shouldScrollRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const justSentRef = useRef(false);

  // ─── Open chat from URL param ───
  useEffect(() => {
    if (urlChatId && chats.length > 0) {
      const chat = chats.find(c => c.chat_id === Number(urlChatId));
      if (chat && chat.chat_id !== activeChat?.chat_id) {
        openChat(chat);
        setMobileOpen(true);
      }
    }
  }, [urlChatId, chats]);

  // ─── Auto-scroll to bottom on new messages ───
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;
    prevMessageCountRef.current = newCount;

    // Only scroll when a new message was actually appended
    if (newCount > prevCount && newCount > 0) {
      if (justSentRef.current) {
        // Instant scroll after sending own message
        container.scrollTop = container.scrollHeight;
        justSentRef.current = false;
      } else if (shouldScrollRef.current) {
        // Smooth-ish scroll for incoming messages when user is near bottom
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  // ─── Scroll handler for detecting user scroll position ───
  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    // If user is near bottom (within 100px), auto-scroll on new messages
    shouldScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // ─── Filter chats by search ───
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(c => {
      const name = getChatName(c).toLowerCase();
      return name.includes(q);
    });
  }, [chats, searchQuery]);

  // ─── Handle chat selection ───
  const handleSelectChat = useCallback((chat) => {
    openChat(chat);
    setMobileOpen(true);
    shouldScrollRef.current = true;
    navigate(`/dashboard/chat/${chat.chat_id}`, { replace: true });
  }, [openChat, navigate]);

  // ─── Handle back to list (mobile) ───
  const handleBack = useCallback(() => {
    setMobileOpen(false);
    setActiveChat(null);
    navigate('/dashboard/chat', { replace: true });
  }, [setActiveChat, navigate]);

  // ─── Send message ───
  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text) return;

    setMessageText('');
    shouldScrollRef.current = true;
    justSentRef.current = true;

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await sendMessage(text);
      stopTyping(activeChat?.chat_id);
    } catch (err) {
      console.error('Send failed:', err);
      setMessageText(text);
    }
  }, [messageText, sendMessage, activeChat, stopTyping]);

  // ─── Keyboard handling ───
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ─── Textarea auto-resize + typing ───
  const handleInputChange = useCallback((e) => {
    setMessageText(e.target.value);

    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';

    // Typing indicator
    if (activeChat) {
      emitTyping(activeChat.chat_id);
    }
  }, [activeChat, emitTyping]);

  // ─── Load more messages ───
  const handleLoadMore = useCallback(() => {
    if (activeChat) {
      shouldScrollRef.current = false;
      loadMoreMessages(activeChat.chat_id);
    }
  }, [activeChat, loadMoreMessages]);

  // ─── Group messages by date ───
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;

    for (const msg of messages) {
      const msgDate = new Date(msg.sent_at).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', date: msg.sent_at });
      }
      groups.push({ type: 'message', data: msg });
    }
    return groups;
  }, [messages]);

  // ─── Typing users for active chat ───
  const activeTyping = useMemo(() => {
    if (!activeChat) return [];
    const typingSet = typingUsers[activeChat.chat_id];
    if (!typingSet || typingSet.size === 0) return [];
    return [...typingSet].filter(id => id !== user?.id);
  }, [activeChat, typingUsers, user?.id]);


  return (
    <div className={`chat-page ${mobileOpen ? 'chat-open' : ''}`} id="chat-page">

      {/* ═══ SIDEBAR ═══ */}
      <div className="chat-sidebar" id="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Messages</h3>
          <div className="chat-search">
            <FiSearch className="chat-search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="chat-search-input"
            />
          </div>
        </div>

        <div className="chat-list" id="chat-list">
          {loading ? (
            <div className="chat-messages-loading">
              <div className="spinner" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="chat-list-empty">
              <FiMessageSquare className="chat-list-empty-icon" />
              <h4>{searchQuery ? 'No conversations found' : 'No conversations yet'}</h4>
              <p>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start a conversation by messaging an artisan from their profile page'
                }
              </p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div
                key={chat.chat_id}
                className={`chat-item ${activeChat?.chat_id === chat.chat_id ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat)}
                id={`chat-item-${chat.chat_id}`}
              >
                <div className={`chat-item-avatar ${chat.type !== 'private' ? 'group' : ''}`}>
                  {getChatImage(chat) ? (
                    <img src={getImageUrl(getChatImage(chat))} alt="" />
                  ) : (
                    getChatInitials(chat)
                  )}
                </div>
                <div className="chat-item-info">
                  {chat.type !== 'private' && (
                    <span className={`chat-item-type-badge ${chat.type}`}>
                      {chat.type === 'workshop' ? '🔨 Workshop' : '📚 Mentorship'}
                    </span>
                  )}
                  <div className="chat-item-top">
                    <span className="chat-item-name">{getChatName(chat)}</span>
                    <span className="chat-item-time">
                      {formatTime(chat.last_message_at || chat.created_at)}
                    </span>
                  </div>
                  <div className="chat-item-bottom">
                    <span className="chat-item-preview">
                      {chat.last_message_type === 'system'
                        ? `📌 ${chat.last_message_content || ''}`
                        : chat.last_message_content || 'No messages yet'
                      }
                    </span>
                    {(chat.unread_count > 0) && (
                      <span className="chat-item-badge">
                        {chat.unread_count > 9 ? '9+' : chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══ CHAT WINDOW ═══ */}
      <div className="chat-window" id="chat-window">
        {!activeChat ? (
          <div className="chat-window-empty">
            <div className="chat-window-empty-icon">
              <FiMessageSquare />
            </div>
            <h3>Select a conversation</h3>
            <p>Choose a chat from the sidebar or start a new conversation from an artisan's profile.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-header" id="chat-header">
              <button className="chat-header-back" onClick={handleBack}>
                <FiArrowLeft />
              </button>
              <div className={`chat-header-avatar ${activeChat.type !== 'private' ? 'group' : ''}`}>
                {getChatImage(activeChat) ? (
                  <img src={getImageUrl(getChatImage(activeChat))} alt="" />
                ) : (
                  getChatInitials(activeChat)
                )}
              </div>
              <div className="chat-header-info">
                <div className="chat-header-name">{getChatName(activeChat)}</div>
                {activeTyping.length > 0 ? (
                  <div className="chat-header-status">
                    <span className="typing-text">typing...</span>
                  </div>
                ) : activeChat.type !== 'private' ? (
                  <div className="chat-header-members">
                    <FiUsers style={{ fontSize: 12, marginRight: 4 }} />
                    {activeChat.member_count || activeChat.members?.length || 0} members
                  </div>
                ) : (
                  <div className="chat-header-status">
                    {activeChat.other_user?.Type || activeChat.other_user_type || ''}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              className="chat-messages"
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              id="chat-messages"
            >
              {hasMoreMessages && messages.length >= 50 && (
                <div className="chat-load-more">
                  <button onClick={handleLoadMore}>
                    <FiChevronUp style={{ marginRight: 4 }} />
                    Load older messages
                  </button>
                </div>
              )}

              {messagesLoading ? (
                <div className="chat-messages-loading">
                  <div className="spinner" />
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-window-empty" style={{ paddingTop: 60 }}>
                  <FiMessageSquare style={{ fontSize: 32, color: 'var(--text-tertiary)', opacity: 0.4 }} />
                  <p>No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                groupedMessages.map((item, idx) => {
                  if (item.type === 'date') {
                    return (
                      <div key={`date-${idx}`} className="chat-date-divider">
                        <span>{formatDateDivider(item.date)}</span>
                      </div>
                    );
                  }

                  const msg = item.data;

                  // System messages
                  if (msg.message_type === 'system') {
                    return (
                      <div key={msg.message_id} className="message-system">
                        <span>{msg.content || 'System message'}</span>
                      </div>
                    );
                  }

                  const isSent = msg.sender_id === user?.id;
                  const isDeleted = !!msg.deleted_at;
                  const isEdited = !!msg.edited_at && !isDeleted;
                  const showSenderName = activeChat.type !== 'private' && !isSent;

                  return (
                    <div key={msg.message_id} className={`message-row ${isSent ? 'sent' : 'received'}`}>
                      {showSenderName && (
                        <span className="message-sender-name">
                          {msg.sender_fname} {msg.sender_lname}
                        </span>
                      )}
                      <div className={`message-bubble ${isDeleted ? 'deleted' : ''} ${isEdited ? 'edited' : ''}`}>
                        {isDeleted
                          ? '🚫 This message was deleted'
                          : msg.content
                        }
                      </div>
                      <div className="message-meta">
                        <span className="message-time">{formatMessageTime(msg.sent_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}

              {activeTyping.length > 0 && (
                <div className="chat-typing-indicator">
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                  typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-area" id="chat-input-area">
              <div className="chat-input-container">
                <textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  id="chat-message-input"
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSend}
                  disabled={!messageText.trim()}
                  id="chat-send-btn"
                  title="Send message"
                >
                  <FiSend />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
