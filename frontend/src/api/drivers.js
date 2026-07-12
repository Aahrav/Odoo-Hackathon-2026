import { fetchApi } from './client';

export const driversApi = {
  async getDrivers() {
    const res = await fetchApi('/drivers');
    return res.data.map(d => ({
      id: d.id,
      name: d.name,
      licenseNumber: d.license_number,
      licenseCategory: d.license_category,
      licenseExpiryDate: d.license_expiry_date?.split('T')[0],
      contactNumber: d.contact_number,
      safetyScore: d.safety_score,
      status: d.status.charAt(0).toUpperCase() + d.status.slice(1) // off_duty -> Off duty (UI uses 'Available', 'Off Duty' etc. we can map accurately)
    })).map(d => {
      // Map DB snake case statuses to UI Pascal Case
      if (d.status.toLowerCase() === 'available') d.status = 'Available';
      if (d.status.toLowerCase() === 'on_trip') d.status = 'On Trip';
      if (d.status.toLowerCase() === 'off_duty') d.status = 'Off Duty';
      if (d.status.toLowerCase() === 'suspended') d.status = 'Suspended';
      return d;
    });
  },

  async addDriver(form) {
    const res = await fetchApi('/drivers', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        licenseNumber: form.licenseNumber,
        licenseCategory: form.licenseCategory === 'Heavy Vehicle' ? 'HMV' : (form.licenseCategory === 'Commercial' ? 'CMV' : 'LMV'),
        licenseExpiryDate: form.licenseExpiryDate,
        contactNumber: form.contactNumber
      })
    });
    return res.data;
  },

  async updateSafetyScore(id, safetyScore) {
    const res = await fetchApi(`/drivers/${id}/safety-score`, {
      method: 'PATCH',
      body: JSON.stringify({ safetyScore: Number(safetyScore) })
    });
    return res.data;
  },

  async updateDriverStatus(id, status) {
    let dbStatus = status.toLowerCase().replace(' ', '_'); // "Off Duty" -> "off_duty"
    const res = await fetchApi(`/drivers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: dbStatus })
    });
    return res.data;
  }
};
