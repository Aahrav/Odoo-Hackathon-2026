import { useState, useEffect } from 'react'
import { apiMock } from '../api/apiMock'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  
  // Data lists
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [trips, setTrips] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [fuelExpenses, setFuelExpenses] = useState([])

  // Dashboard Filters
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  useEffect(() => {
    // Inject mock regions for demo if not present
    const rawVehicles = apiMock.getVehicles()
    const updated = rawVehicles.map((v, i) => ({
      ...v,
      region: i % 2 === 0 ? 'Vadodara' : 'Ahmedabad',
    }))
    setVehicles(updated)
    setDrivers(apiMock.getDrivers())
    setTrips(apiMock.getTrips())
    setMaintenance(apiMock.getMaintenanceLogs())
    setFuelExpenses(apiMock.getFuelExpenses())
  }, [])

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchType = typeFilter ? v.type === typeFilter : true
    const matchRegion = regionFilter ? v.region === regionFilter : true
    return matchType && matchRegion
  })

  // Filter trips based on filtered vehicles
  const filteredTrips = trips.filter(t => 
    filteredVehicles.some(v => v.id === t.vehicleId)
  )

  // Calculations
  const totalVehiclesCount = filteredVehicles.filter(v => v.status !== 'Retired').length
  const activeVehiclesCount = filteredVehicles.filter(v => v.status === 'On Trip').length
  const availableVehiclesCount = filteredVehicles.filter(v => v.status === 'Available').length
  const maintenanceVehiclesCount = filteredVehicles.filter(v => v.status === 'In Shop').length

  const activeTripsCount = filteredTrips.filter(t => t.status === 'Dispatched').length
  const pendingTripsCount = filteredTrips.filter(t => t.status === 'Draft').length
  const completedTripsCount = filteredTrips.filter(t => t.status === 'Completed').length

  const driversOnDutyCount = drivers.filter(d => d.status === 'On Trip').length

  // Utilization Rate (%) = Active Vehicles / Total Active Vehicles (not retired) * 100
  const utilizationRate = totalVehiclesCount > 0 
    ? ((activeVehiclesCount / totalVehiclesCount) * 100).toFixed(0) 
    : '0'

  // Cost calculation
  const totalFuelCost = fuelExpenses
    .filter(f => f.type === 'Fuel' && filteredVehicles.some(v => v.id === f.vehicleId))
    .reduce((sum, f) => sum + f.cost, 0)

  const totalMaintCost = maintenance
    .filter(m => filteredVehicles.some(v => v.id === m.vehicleId))
    .reduce((sum, m) => sum + m.cost, 0)

  const types = [...new Set(vehicles.map(v => v.type))]
  const regions = [...new Set(vehicles.map(v => v.region || 'Vadodara'))]

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {user?.name}. Here's your operations overview.
          </p>
        </div>

        {/* Dashboard Filters */}
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm transition-shadow"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Vehicle Types</option>
            {types.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t}</option>)}
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-md text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm transition-shadow"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Regions</option>
            {regions.map(r => <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{r}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Fleet Utilization</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2">{utilizationRate}%</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="font-medium text-slate-700 dark:text-slate-300">{activeVehiclesCount}</span> of {totalVehiclesCount} active
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Available Vehicles</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2">{availableVehiclesCount}</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{maintenanceVehiclesCount}</span> in workshop
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Trips</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2">{activeTripsCount}</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{pendingTripsCount}</span> draft requests
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Drivers On Duty</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2">{driversOnDutyCount}</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
            Real-time synchronization
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Cost Summary Widget */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">Operations Cost Breakdown</h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">YTD 2026</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Total Fuel Cost</span>
              <span className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">₹{totalFuelCost.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Total Maintenance</span>
              <span className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">₹{totalMaintCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cost Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Fuel</span>
                  <span className="text-slate-900 dark:text-white font-medium">{((totalFuelCost / (totalFuelCost + totalMaintCost || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 dark:bg-teal-600 h-full rounded-full transition-all duration-500" style={{ width: `${(totalFuelCost / (totalFuelCost + totalMaintCost || 1)) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Maintenance</span>
                  <span className="text-slate-900 dark:text-white font-medium">{((totalMaintCost / (totalFuelCost + totalMaintCost || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 dark:bg-amber-600 h-full rounded-full transition-all duration-500" style={{ width: `${(totalMaintCost / (totalFuelCost + totalMaintCost || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Activity Feed */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6 h-full min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">Recent Activity</h2>
          </div>
          
          <div className="flex-1">
            <ul className="space-y-6">
              {filteredTrips.slice(0, 4).map((t, idx) => (
                <li key={t.id} className="relative">
                  {idx !== filteredTrips.slice(0, 4).length - 1 && (
                    <span className="absolute top-6 left-[11px] -ml-px h-full w-[2px] bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                  )}
                  <div className="relative flex items-start space-x-4">
                    <div className="relative pt-1">
                      <span className={`h-[22px] w-[22px] rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${
                        t.status === 'Completed' ? 'bg-emerald-500' :
                        t.status === 'Dispatched' ? 'bg-blue-500' :
                        'bg-slate-400'
                      }`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Trip <span className="font-medium text-slate-900 dark:text-white">{t.source} → {t.destination}</span>
                      </p>
                      <p className="text-sm mt-0.5">
                        <span className="text-slate-500 dark:text-slate-400">Updated to </span>
                        <span className={`font-medium ${
                          t.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' :
                          t.status === 'Dispatched' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                        }`}>{t.status}</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Just now</p>
                    </div>
                  </div>
                </li>
              ))}
              {filteredTrips.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No recent activities found.</p>
                </div>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
