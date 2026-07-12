import { useState, useEffect } from 'react'
import { apiMock } from '../api/apiMock'

export default function AnalyticsPage() {
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [fuelExpenses, setFuelExpenses] = useState([])

  useEffect(() => {
    setVehicles(apiMock.getVehicles())
    setTrips(apiMock.getTrips())
    setMaintenance(apiMock.getMaintenanceLogs())
    setFuelExpenses(apiMock.getFuelExpenses())
  }, [])

  // Calculate stats for each vehicle
  const vehicleStats = vehicles.map((v) => {
    // Maintenance Cost
    const maintCost = maintenance
      .filter((m) => m.vehicleId === v.id)
      .reduce((sum, m) => sum + Number(m.cost || 0), 0)

    // Fuel Cost & Liters
    const vehicleFuelLogs = fuelExpenses.filter((f) => f.vehicleId === v.id && f.type === 'Fuel')
    const fuelCost = vehicleFuelLogs.reduce((sum, f) => sum + Number(f.cost || 0), 0)
    const fuelLiters = vehicleFuelLogs.reduce((sum, f) => sum + Number(f.liters || 0), 0)

    // Other Expenses (tolls etc.)
    const otherCost = fuelExpenses
      .filter((e) => e.vehicleId === v.id && e.type === 'Expense')
      .reduce((sum, e) => sum + Number(e.cost || 0), 0)

    // Completed Trips info
    const completedTrips = trips.filter((t) => t.vehicleId === v.id && t.status === 'Completed')
    const distanceTraveled = completedTrips.reduce((sum, t) => sum + Number(t.plannedDistance || 0), 0)

    // Revenue estimation: ₹100 per km traveled + ₹5 per kg of cargo carried
    const estimatedRevenue = completedTrips.reduce((sum, t) => {
      const tripDistanceRevenue = Number(t.plannedDistance || 0) * 100
      const tripCargoRevenue = Number(t.cargoWeight || 0) * 5
      return sum + tripDistanceRevenue + tripCargoRevenue
    }, 0)

    const totalOperationalCost = maintCost + fuelCost + otherCost
    
    // Fuel Efficiency (km/L)
    const fuelEfficiency = fuelLiters > 0 ? (distanceTraveled / fuelLiters).toFixed(2) : 'N/A'

    // ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
    // In our case, we calculate it as: (estimatedRevenue - totalOperationalCost) / acquisitionCost
    const roiPercentage = v.acquisitionCost > 0
      ? (((estimatedRevenue - totalOperationalCost) / v.acquisitionCost) * 100).toFixed(2)
      : '0.00'

    return {
      ...v,
      maintCost,
      fuelCost,
      otherCost,
      totalOperationalCost,
      distanceTraveled,
      fuelEfficiency,
      estimatedRevenue,
      roi: roiPercentage,
    }
  })

  // Export CSV Function
  const exportToCSV = () => {
    const headers = [
      'Vehicle Name',
      'Reg Number',
      'Type',
      'Max Load Capacity (kg)',
      'Odometer (km)',
      'Acquisition Cost (₹)',
      'Total Maintenance (₹)',
      'Total Fuel Cost (₹)',
      'Total Operational Cost (₹)',
      'Distance Traveled (km)',
      'Estimated Revenue (₹)',
      'ROI (%)',
      'Status'
    ]

    const rows = vehicleStats.map(s => [
      s.name,
      s.registrationNumber,
      s.type,
      s.maxLoadCapacityKg,
      s.odometer,
      s.acquisitionCost,
      s.maintCost,
      s.fuelCost,
      s.totalOperationalCost,
      s.distanceTraveled,
      s.estimatedRevenue,
      `${s.roi}%`,
      s.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `TransitOps_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print PDF Trigger
  const handlePrintPDF = () => {
    window.print()
  }

  // Summary Metrics
  const totalExpensesVal = vehicleStats.reduce((sum, s) => sum + s.totalOperationalCost, 0)
  const totalRevenueVal = vehicleStats.reduce((sum, s) => sum + s.estimatedRevenue, 0)
  const totalDistanceVal = vehicleStats.reduce((sum, s) => sum + s.distanceTraveled, 0)
  const avgRoiVal = (vehicleStats.reduce((sum, s) => sum + parseFloat(s.roi), 0) / (vehicleStats.length || 1)).toFixed(2)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Fleet performance dashboards, fuel metrics, and return on investment ledger.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Export CSV Summary
          </button>
          <button
            onClick={handlePrintPDF}
            className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Print/Save PDF
          </button>
        </div>
      </div>

      {/* Analytical KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl">
          <span className="text-xs uppercase font-bold text-teal-800 tracking-wider">Total Operations Cost</span>
          <p className="text-2xl font-bold text-teal-950 mt-1">₹{totalExpensesVal.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Estimated Revenue</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">₹{totalRevenueVal.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Fleet Distance</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalDistanceVal.toLocaleString()} km</p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Average Fleet ROI</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{avgRoiVal}%</p>
        </div>
      </div>

      {/* ROI & Performance Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="p-4">Vehicle</th>
              <th className="p-4">Distance Traveled</th>
              <th className="p-4">Fuel Efficiency</th>
              <th className="p-4">Total Cost</th>
              <th className="p-4">Est. Revenue</th>
              <th className="p-4 text-right">Estimated ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {vehicleStats.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition">
                <td className="p-4">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{s.registrationNumber}</p>
                </td>
                <td className="p-4 font-medium text-slate-700">{s.distanceTraveled} km</td>
                <td className="p-4 text-slate-600">
                  {s.fuelEfficiency !== 'N/A' ? `${s.fuelEfficiency} km/L` : 'N/A'}
                </td>
                <td className="p-4 text-slate-700">₹{s.totalOperationalCost?.toLocaleString()}</td>
                <td className="p-4 text-teal-800 font-semibold">₹{s.estimatedRevenue?.toLocaleString()}</td>
                <td className="p-4 text-right">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${
                    parseFloat(s.roi) >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {s.roi}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
