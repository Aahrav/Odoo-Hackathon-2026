import { useState, useEffect } from 'react'
import { apiMock } from '../api/apiMock'
import { useAuth } from '../context/AuthContext'
import CustomSelect from '../components/CustomSelect'

export default function MaintenancePage() {
  const { user } = useAuth()
  
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    vehicleId: '',
    description: '',
    cost: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLogs(apiMock.getMaintenanceLogs())
    setVehicles(apiMock.getVehicles())
  }

  const handleCreateLog = (e) => {
    e.preventDefault()
    setError('')
    try {
      if (!form.vehicleId) {
        throw new Error('Please select a vehicle')
      }
      apiMock.createMaintenanceLog(form)
      loadData()
      setShowModal(false)
      setForm({
        vehicleId: '',
        description: '',
        cost: '',
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCloseLog = (id) => {
    if (confirm('Are you sure you want to close this maintenance log? The vehicle will be returned to Available status.')) {
      apiMock.closeMaintenanceLog(id)
      loadData()
    }
  }

  // Filter vehicles that can go into maintenance (Available status or On Trip status but usually available ones are best)
  // Let's filter to vehicles that are NOT Retired and NOT currently In Shop
  const maintenanceEligibleVehicles = vehicles.filter(v => v.status !== 'Retired' && v.status !== 'In Shop')
  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.name || 'Unknown Vehicle'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Logs</h1>
          <p className="text-sm text-slate-500">Track and schedule vehicle repairs, servicing, and shop stays.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          Schedule Maintenance
        </button>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="p-4">Vehicle</th>
              <th className="p-4">Description</th>
              <th className="p-4">Cost (₹)</th>
              <th className="p-4">Status</th>
              <th className="p-4">Timeline</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  No maintenance records logged.
                </td>
              </tr>
            ) : (
              [...logs].reverse().map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-semibold text-slate-900">
                    {getVehicleName(l.vehicleId)}
                  </td>
                  <td className="p-4 text-slate-700">{l.description}</td>
                  <td className="p-4 font-medium text-slate-800">₹{l.cost?.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      l.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    <p>Opened: {l.openDate}</p>
                    {l.closeDate && <p className="text-green-600 font-medium">Closed: {l.closeDate}</p>}
                  </td>
                  <td className="p-4 text-right">
                    {l.status === 'Open' && (
                      <button
                        onClick={() => handleCloseLog(l.id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1.5 rounded-lg transition"
                      >
                        Mark Completed / Close
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Schedule Vehicle Servicing</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-semibold">×</button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Select Vehicle</span>
                <div className="mt-1">
                  <CustomSelect
                    required
                    value={form.vehicleId}
                    onChange={e => setForm({ ...form, vehicleId: e.target.value })}
                    placeholder="-- Choose eligible vehicle --"
                    options={maintenanceEligibleVehicles.map(v => ({
                      value: v.id,
                      label: `${v.name} (${v.registrationNumber}) - Status: ${v.status}`
                    }))}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Description / Issue details</span>
                <textarea
                  required
                  placeholder="e.g. Engine Oil Change & Filter Replacement"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none h-24 resize-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Estimated / Actual Cost (₹)</span>
                <input
                  type="number"
                  required
                  placeholder="4500"
                  value={form.cost}
                  onChange={e => setForm({ ...form, cost: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                />
              </label>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold"
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
