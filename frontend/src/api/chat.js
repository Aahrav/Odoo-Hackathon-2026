import { fetchApi } from './client';

export const chatApi = {
  async sendMessage(message) {
    const res = await fetchApi('/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    return res.data;
  }
};
