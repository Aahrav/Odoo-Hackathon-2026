import { fetchApi } from './client';

export const expensesApi = {
  async getExpenses() {
    const res = await fetchApi('/expenses');
    return res.data;
  },
  async getFuelLogs() {
    const res = await fetchApi('/fuel');
    return res.data;
  },
  async addFuelLog(data) {
    const res = await fetchApi('/fuel', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId: data.vehicleId,
        tripId: data.tripId || undefined,
        liters: Number(data.liters),
        costPerLiter: Number(data.cost) / Number(data.liters),
        logDate: data.logDate
      })
    });
    return res.data;
  },
  async addExpense(data) {
    const res = await fetchApi('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId: data.vehicleId,
        tripId: data.tripId || undefined,
        expenseType: data.type.toLowerCase(),
        amount: Number(data.cost),
        description: data.description,
        expenseDate: data.logDate
      })
    });
    return res.data;
  }
};
