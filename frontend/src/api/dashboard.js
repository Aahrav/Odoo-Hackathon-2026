import { fetchApi } from './client';

export const dashboardApi = {
  getKPIs: () => fetchApi('/reports/kpis'),
  getFinancialReports: () => fetchApi('/reports/roi'),
  exportCsv: (reportType) => fetchApi(`/reports/export?type=csv&report=${reportType}`)
};
