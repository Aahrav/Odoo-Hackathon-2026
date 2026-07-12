import { fetchApi } from './client';

export const maintenanceApi = {
  async getMaintenanceLogs() {
    const res = await fetchApi('/maintenance');
    return res.data;
  },
  async createMaintenanceLog(data) {
    const res = await fetchApi('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async closeMaintenanceLog(id, cost) {
    const res = await fetchApi(`/maintenance/${id}/close`, {
      method: 'PATCH',
      body: JSON.stringify({ cost })
    });
    return res.data;
  }
};
