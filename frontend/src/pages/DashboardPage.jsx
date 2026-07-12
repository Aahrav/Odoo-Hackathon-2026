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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
          <p className="text-sm text-slate-500">Monitor vehicle status, active trip dispatches, and cost metrics.</p>
        </div>

        {/* Dashboard Filters */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-teal-500"
          >
            <option value="">All Vehicle Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-teal-500"
          >
            <option value="">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-teal-50/50 border border-teal-100 p-5 rounded-3xl">
          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Fleet Utilization</p>
          <p className="text-3xl font-black text-teal-950 mt-2">{utilizationRate}%</p>
          <p className="text-[10px] text-teal-700 mt-1">{activeVehiclesCount} of {totalVehiclesCount} vehicles active</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Vehicles</p>
          <p className="text-3xl font-black text-slate-800 mt-2">{availableVehiclesCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">{maintenanceVehiclesCount} currently in workshop</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Trips</p>
          <p className="text-3xl font-black text-slate-800 mt-2">{activeTripsCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">{pendingTripsCount} draft dispatch requests</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Drivers On Duty</p>
          <p className="text-3xl font-black text-slate-800 mt-2">{driversOnDutyCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">Status changes synchronized in real time</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Cost Summary Widget */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 md:col-span-2">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Operations Cost Breakdown</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-teal-50 rounded-2xl">
              <span className="text-xs text-teal-800 font-semibold block">Total Fuel Cost</span>
              <span className="text-lg font-bold text-teal-950">₹{totalFuelCost.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl">
              <span className="text-xs text-amber-800 font-semibold block">Total Maintenance</span>
              <span className="text-lg font-bold text-amber-950">₹{totalMaintCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Interactive Bar Graph Simulation</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Fuel (₹{totalFuelCost.toLocaleString()})</span>
                  <span>{((totalFuelCost / (totalFuelCost + totalMaintCost || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: `${(totalFuelCost / (totalFuelCost + totalMaintCost || 1)) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Maintenance (₹{totalMaintCost.toLocaleString()})</span>
                  <span>{((totalMaintCost / (totalFuelCost + totalMaintCost || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(totalMaintCost / (totalFuelCost + totalMaintCost || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Activity Feed */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Live Activity</h2>
          
          <div className="flow-root">
            <ul className="-mb-8">
              {filteredTrips.slice(0, 3).map((t, idx) => (
                <li key={t.id}>
                  <div className="relative pb-8">
                    {idx !== filteredTrips.slice(0, 3).length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          t.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          t.status === 'Dispatched' ? 'bg-blue-50 text-blue-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          ●
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className="text-xs text-slate-800">
                          Trip <span className="font-semibold">{t.source} → {t.destination}</span> was updated to{' '}
                          <span className="font-semibold text-teal-800">{t.status}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {filteredTrips.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No recent trip activities.</p>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
