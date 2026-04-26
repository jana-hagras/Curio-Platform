import api from './api';

export const chatService = {
  getConversations: (userId) => api.get(`/chat/conversations?user_id=${userId}`),
  getMessages: (conversationId) => api.get(`/chat/messages?conversation_id=${conversationId}`),
  sendMessage: (data) => api.post('/chat/messages', data),
  createConversation: (data) => api.post('/chat/conversations', data),
};
