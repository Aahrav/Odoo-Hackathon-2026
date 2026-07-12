import { fetchApi } from './client';

export const chatApi = {
  async sendMessage(message, sessionId) {
    const res = await fetchApi('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId })
    });
    return res.data;
  }
};
