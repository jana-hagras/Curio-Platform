import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { FiSend, FiSearch, FiMessageCircle, FiMoreVertical } from 'react-icons/fi';
import Spinner from '../../components/ui/Spinner';

export default function ChatPage() {
  const { user, isBuyer, isArtisan } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load users of opposite type as potential contacts
    userService.getAll()
      .then(res => {
        const allUsers = res.data?.users || [];
        const filtered = allUsers.filter(u => {
          if (isBuyer) return u.type === 'Artisan';
          if (isArtisan) return u.type === 'Buyer';
          return false;
        });
        setContacts(filtered);
        // Initialize empty message arrays from localStorage
        const storedMessages = JSON.parse(localStorage.getItem(`curio_chat_${user.id}`) || '{}');
        setMessages(storedMessages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id, isBuyer, isArtisan]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact]);

  const saveMessages = (updated) => {
    setMessages(updated);
    localStorage.setItem(`curio_chat_${user.id}`, JSON.stringify(updated));
  };

  const handleSend = () => {
    if (!newMessage.trim() || !selectedContact) return;

    const contactId = selectedContact.id;
    const msg = {
      id: Date.now(),
      senderId: user.id,
      receiverId: contactId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = { ...messages };
    if (!updated[contactId]) updated[contactId] = [];
    updated[contactId] = [...updated[contactId], msg];
    saveMessages(updated);
    setNewMessage('');

    // Simulate auto-reply after a short delay
    setTimeout(() => {
      setMessages(prevMessages => {
        const currentMsgs = prevMessages[contactId] || [];
        // Only reply if this is the very first message sent by the user in this conversation
        if (currentMsgs.length > 1) return prevMessages;
        
        const replyText = "thanks for reaching out I will respond as soon as possible";
        
        const reply = {
          id: Date.now() + 1,
          senderId: contactId,
          receiverId: user.id,
          text: replyText,
          timestamp: new Date().toISOString(),
        };
        const updatedWithReply = { ...prevMessages };
        if (!updatedWithReply[contactId]) updatedWithReply[contactId] = [];
        updatedWithReply[contactId] = [...updatedWithReply[contactId], reply];
        localStorage.setItem(`curio_chat_${user.id}`, JSON.stringify(updatedWithReply));
        return updatedWithReply;
      });
    }, 1500);
  };

  const getContactMessages = (contactId) => messages[contactId] || [];
  const getLastMessage = (contactId) => {
    const msgs = getContactMessages(contactId);
    return msgs[msgs.length - 1];
  };

  const filteredContacts = contacts.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <Spinner />;

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 68px - 64px)',
      background: 'var(--surface-primary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--surface-border)',
      overflow: 'hidden',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Contacts Sidebar */}
      <div style={{
        width: 320,
        borderRight: '1px solid var(--surface-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '20px 16px 12px',
          borderBottom: '1px solid var(--surface-border)',
        }}>
          <h3 style={{ fontSize: 20, fontFamily: 'var(--font-body)', fontWeight: 700, marginBottom: 16 }}>Messages</h3>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface-secondary)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
          }}>
            <FiSearch style={{ color: 'var(--text-tertiary)', fontSize: 16 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 14, width: '100%', color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredContacts.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FiMessageCircle style={{ fontSize: 40, marginBottom: 12, color: 'var(--surface-border)' }} />
              <p style={{ fontSize: 14 }}>No contacts found</p>
            </div>
          ) : (
            filteredContacts.map(contact => {
              const lastMsg = getLastMessage(contact.id);
              const isSelected = selectedContact?.id === contact.id;
              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(212, 168, 67, 0.08)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--gold-primary)' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                  onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--gold-primary)',
                    color: 'var(--black-deep)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {contact.profileImage ? (
                      <img src={contact.profileImage.startsWith('/') ? `http://localhost:3000${contact.profileImage}` : contact.profileImage}
                        alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : `${contact.firstName?.charAt(0)}${contact.lastName?.charAt(0)}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{contact.firstName} {contact.lastName}</p>
                      {lastMsg && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatTime(lastMsg.timestamp)}</span>}
                    </div>
                    <p style={{
                      fontSize: 13, color: 'var(--text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {lastMsg ? (lastMsg.senderId === user.id ? 'You: ' : '') + lastMsg.text : contact.type}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedContact ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Chat Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--surface-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--gold-primary)',
                color: 'var(--black-deep)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, overflow: 'hidden',
              }}>
                {selectedContact.profileImage ? (
                  <img src={selectedContact.profileImage.startsWith('/') ? `http://localhost:3000${selectedContact.profileImage}` : selectedContact.profileImage}
                    alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : `${selectedContact.firstName?.charAt(0)}${selectedContact.lastName?.charAt(0)}`}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15 }}>{selectedContact.firstName} {selectedContact.lastName}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedContact.type}</p>
              </div>
            </div>
            <button style={{ color: 'var(--text-secondary)', fontSize: 20, padding: 4 }}>
              <FiMoreVertical />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 12,
            background: 'var(--surface-secondary)',
          }}>
            {getContactMessages(selectedContact.id).length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-tertiary)',
              }}>
                <FiMessageCircle style={{ fontSize: 48, marginBottom: 16, color: 'var(--surface-border)' }} />
                <p style={{ fontSize: 15, fontWeight: 500 }}>Start a conversation</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Say hello to {selectedContact.firstName}!</p>
              </div>
            ) : (
              getContactMessages(selectedContact.id).map(msg => {
                const isMine = msg.senderId === user.id;
                return (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    animation: 'slideUp 0.2s ease',
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMine ? 'var(--gold-primary)' : 'var(--surface-primary)',
                      color: isMine ? 'var(--black-deep)' : 'var(--text-primary)',
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      <p style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.text}</p>
                      <p style={{
                        fontSize: 11, marginTop: 6,
                        opacity: 0.7,
                        textAlign: 'right',
                      }}>{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--surface-border)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              style={{
                flex: 1, padding: '12px 18px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-secondary)',
                outline: 'none', fontSize: 14,
                color: 'var(--text-primary)',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--surface-border)'}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: newMessage.trim() ? 'var(--gold-primary)' : 'var(--surface-tertiary)',
                color: newMessage.trim() ? 'var(--black-deep)' : 'var(--text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
                transition: 'all 0.2s',
                cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              <FiSend />
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-tertiary)',
        }}>
          <FiMessageCircle style={{ fontSize: 64, marginBottom: 20, color: 'var(--surface-border)' }} />
          <h3 style={{ fontSize: 20, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
            Your Messages
          </h3>
          <p style={{ fontSize: 14 }}>Select a contact to start chatting</p>
        </div>
      )}
    </div>
  );
}
