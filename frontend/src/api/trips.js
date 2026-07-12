import { fetchApi } from './client';

export const tripsApi = {
  async getTrips() {
    const res = await fetchApi('/trips');
    return res.data.map(t => ({
      id: t.id,
      source: t.source,
      destination: t.destination,
      vehicleId: t.vehicle_id,
      driverId: t.driver_id,
      cargoWeight: t.cargo_weight_kg,
      plannedDistance: t.planned_distance_km,
      status: t.status.charAt(0).toUpperCase() + t.status.slice(1), // draft -> Draft
      dateCreated: t.created_at?.split('T')[0],
      startOdometerKm: t.start_odometer_km,
      finalOdometerKm: t.final_odometer_km
    }));
  },
  
  async createTrip(form) {
    const res = await fetchApi('/trips', {
      method: 'POST',
      body: JSON.stringify({
        source: form.source,
        destination: form.destination,
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        cargoWeightKg: Number(form.cargoWeight),
        plannedDistanceKm: Number(form.plannedDistance)
      })
    });
    return res.data;
  },

  async dispatchTrip(id) {
    const res = await fetchApi(`/trips/${id}/dispatch`, {
      method: 'POST'
    });
    return res.data;
  },

  async completeTrip(id, finalOdometer, fuelLiters, fuelCost) {
    const res = await fetchApi(`/trips/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        finalOdometerKm: Number(finalOdometer),
        fuelConsumedL: fuelLiters ? Number(fuelLiters) : undefined,
        revenue: 0 
      })
    });
    return res.data;
  },

  async cancelTrip(id) {
    const res = await fetchApi(`/trips/${id}/cancel`, {
      method: 'POST'
    });
    return res.data;
  }
};
