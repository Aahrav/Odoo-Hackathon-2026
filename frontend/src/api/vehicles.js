import { fetchApi } from './client';

export const vehiclesApi = {
  async getVehicles() {
    const res = await fetchApi('/vehicles');
    return res.data.map(v => ({
      id: v.id,
      registrationNumber: v.registration_number,
      name: v.name,
      model: v.model,
      type: 'Van', // Static map since DB uses UUIDs for type
      maxLoadCapacityKg: v.max_load_capacity_kg,
      acquisitionCost: v.acquisition_cost,
      odometer: v.odometer_km,
      status: v.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }));
  },
  
  async addVehicle(form) {
    const res = await fetchApi('/vehicles', {
      method: 'POST',
      body: JSON.stringify({
        registrationNumber: form.registrationNumber,
        name: form.name,
        model: form.model,
        maxLoadCapacityKg: Number(form.maxLoadCapacityKg),
        acquisitionCost: Number(form.acquisitionCost),
        odometerKm: Number(form.odometer)
      })
    });
    return res.data;
  },

  async retireVehicle(id) {
    const res = await fetchApi(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'retired' })
    });
    return res.data;
  },

  // Stubs for history/documents until integrated in future phases
  getTrips() { return []; },
  getMaintenanceLogs() { return []; },
  getFuelExpenses() { return []; },
  addVehicleDocument(id, doc) { return doc; },
  deleteVehicleDocument(id, docId) { return true; }
};
