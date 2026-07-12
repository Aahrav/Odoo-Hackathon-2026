import { useState, useEffect } from 'react'
import { maintenanceApi } from '../api/maintenance'
import { vehiclesApi } from '../api/vehicles'
import { useAuth } from '../context/AuthContext'
import CustomSelect from '../components/CustomSelect'
import LoadingSpinner from '../components/LoadingSpinner'

export default function MaintenancePage() {
  const { user } = useAuth()
  
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    vehicleId: '',
    maintenanceType: 'repair',
    description: '',
    cost: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [maintenanceData, vehiclesData] = await Promise.all([
        maintenanceApi.getMaintenanceLogs(),
        vehiclesApi.getVehicles()
      ])
      
      const mappedLogs = maintenanceData.map(l => ({
        id: l.id,
        vehicleId: l.vehicle_id,
        description: l.description || l.maintenance_type,
        cost: Number(l.cost),
        status: l.status.charAt(0).toUpperCase() + l.status.slice(1), // open -> Open
        openDate: new Date(l.opened_at).toLocaleDateString(),
        closeDate: l.closed_at ? new Date(l.closed_at).toLocaleDateString() : null
      }))

      setLogs(mappedLogs)
      setVehicles(vehiclesData)
    } catch (err) {
      console.error("Failed to load maintenance data", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLog = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (!form.vehicleId) {
        throw new Error('Please select a vehicle')
      }
      await maintenanceApi.createMaintenanceLog({
        vehicleId: form.vehicleId,
        maintenanceType: form.maintenanceType,
        description: form.description
      })
      await loadData()
      setShowModal(false)
      setForm({
        vehicleId: '',
        maintenanceType: 'repair',
        description: '',
        cost: '',
      })
    } catch (err) {
      setError(err.message || 'Failed to create log')
    }
  }

  const handleCloseLog = async (id) => {
    const cost = prompt("Enter final maintenance cost (₹):", "0")
    if (cost !== null) {
      if (isNaN(cost) || Number(cost) < 0) {
        alert("Please enter a valid cost.")
        return
      }
      try {
        await maintenanceApi.closeMaintenanceLog(id, Number(cost))
        await loadData()
      } catch (err) {
        alert("Failed to close log: " + (err.message || "Unknown error"))
      }
    }
  }

  // Filter vehicles that can go into maintenance (Available status or On Trip status but usually available ones are best)
  // Let's filter to vehicles that are NOT Retired and NOT currently In Shop
  const maintenanceEligibleVehicles = vehicles.filter(v => v.status !== 'Retired' && v.status !== 'In_shop')
  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.name || 'Unknown Vehicle'

  if (loading) return <LoadingSpinner message="Loading maintenance records..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">Track and schedule vehicle repairs, servicing, and shop stays.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          Schedule Maintenance
        </button>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <th className="p-4">Vehicle</th>
              <th className="p-4">Description</th>
              <th className="p-4">Cost (₹)</th>
              <th className="p-4">Status</th>
              <th className="p-4">Timeline</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  No maintenance records logged.
                </td>
              </tr>
            ) : (
              [...logs].reverse().map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">
                    {getVehicleName(l.vehicleId)}
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-300">{l.description}</td>
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">₹{l.cost?.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      l.status === 'Open' 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    <p>Opened: {l.openDate}</p>
                    {l.closeDate && <p className="text-green-600 dark:text-green-400 font-medium">Closed: {l.closeDate}</p>}
                  </td>
                  <td className="p-4 text-right">
                    {l.status === 'Open' && (
                      <button
                        onClick={() => handleCloseLog(l.id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1.5 rounded-lg transition shadow-sm"
                      >
                        Mark Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Vehicle Servicing</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-lg font-semibold">×</button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Select Vehicle</span>
                <div className="mt-1">
                  <CustomSelect
                    required
                    value={form.vehicleId}
                    onChange={e => setForm({ ...form, vehicleId: e.target.value })}
                    options={[
                      { value: '', label: '-- Choose eligible vehicle --' },
                      ...maintenanceEligibleVehicles.map(v => ({
                        value: v.id,
                        label: `${v.name} (${v.registrationNumber}) - Status: ${v.status}`
                      }))
                    ]}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Maintenance Type</span>
                <div className="mt-1">
                  <CustomSelect
                    required
                    value={form.maintenanceType}
                    onChange={e => setForm({ ...form, maintenanceType: e.target.value })}
                    options={[
                      { value: 'routine', label: 'Routine Servicing' },
                      { value: 'repair', label: 'Repair' },
                      { value: 'oil_change', label: 'Oil Change' },
                      { value: 'inspection', label: 'Inspection' }
                    ]}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Description / Issue details</span>
                <textarea
                  required
                  placeholder="e.g. Engine Oil Change & Filter Replacement"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 dark:focus:border-teal-500 outline-none h-24 resize-none text-slate-900 dark:text-white"
                />
              </label>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg p-2.5">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Record & Put in Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
