import { useState, useEffect } from 'react'
import { apiMock } from '../api/apiMock'
import { useAuth } from '../context/AuthContext'

export default function FuelExpensePage() {
  const { user } = useAuth()
  
  const [data, setData] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])

  const [showFuelModal, setShowFuelModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)

  // Fuel Form
  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    tripId: '',
    liters: '',
    cost: '',
    logDate: new Date().toISOString().split('T')[0],
  })

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({
    vehicleId: '',
    description: '',
    cost: '',
    type: 'Toll', // Toll, Misc
    logDate: new Date().toISOString().split('T')[0],
  })

  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setData(apiMock.getFuelExpenses())
    setVehicles(apiMock.getVehicles())
    setTrips(apiMock.getTrips())
  }

  const handleFuelSubmit = (e) => {
    e.preventDefault()
    setError('')
    try {
      if (!fuelForm.vehicleId) throw new Error('Please select a vehicle')
      apiMock.addFuelLog(fuelForm)
      loadData()
      setShowFuelModal(false)
      setFuelForm({
        vehicleId: '',
        tripId: '',
        liters: '',
        cost: '',
        logDate: new Date().toISOString().split('T')[0],
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleExpenseSubmit = (e) => {
    e.preventDefault()
    setError('')
    try {
      if (!expenseForm.vehicleId) throw new Error('Please select a vehicle')
      apiMock.addExpense(expenseForm)
      loadData()
      setShowExpenseModal(false)
      setExpenseForm({
        vehicleId: '',
        description: '',
        cost: '',
        type: 'Toll',
        logDate: new Date().toISOString().split('T')[0],
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.name || 'Unknown'
  const getTripLabel = (id) => {
    const trip = trips.find(t => t.id === id)
    return trip ? `${trip.source} → ${trip.destination}` : 'Standalone Log'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fuel & Expenses</h1>
          <p className="text-sm text-slate-500">Record fuel additions, highway tolls, and incidental transport costs.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFuelModal(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Log Fuel
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Log Expense
          </button>
        </div>
      </div>

      {/* Expense ledger list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="p-4">Date</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Type</th>
              <th className="p-4">Description / Associated Trip</th>
              <th className="p-4">Details</th>
              <th className="p-4 text-right">Cost (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  No fuel logs or expense receipts recorded.
                </td>
              </tr>
            ) : (
              [...data].reverse().map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600 font-medium">{item.logDate}</td>
                  <td className="p-4 font-semibold text-slate-900">{getVehicleName(item.vehicleId)}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.type === 'Fuel' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700">
                    {item.type === 'Fuel' ? (
                      <span className="text-xs text-slate-500">Trip: {getTripLabel(item.tripId)}</span>
                    ) : (
                      <>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{item.type}</p>
                      </>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">
                    {item.type === 'Fuel' ? `${item.liters} Liters` : 'Receipt logged'}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">₹{item.cost?.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Fuel Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Log Fuel Addition</h2>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-semibold">×</button>
            </div>

            <form onSubmit={handleFuelSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Select Vehicle</span>
                <select
                  required
                  value={fuelForm.vehicleId}
                  onChange={e => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 bg-white focus:border-teal-500 outline-none"
                >
                  <option value="">-- Select vehicle --</option>
                  {vehicles.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Select Trip (Optional)</span>
                <select
                  value={fuelForm.tripId}
                  onChange={e => setFuelForm({ ...fuelForm, tripId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 bg-white focus:border-teal-500 outline-none"
                >
                  <option value="">-- Standalone (No associated active trip) --</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.source} → {t.destination} ({t.status})</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Liters consumed</span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45"
                    value={fuelForm.liters}
                    onChange={e => setForm ? setFuelForm({ ...fuelForm, liters: e.target.value }) : null}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Fuel Cost (₹)</span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 4500"
                    value={fuelForm.cost}
                    onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Log Date</span>
                <input
                  type="date"
                  required
                  value={fuelForm.logDate}
                  onChange={e => setFuelForm({ ...fuelForm, logDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                />
              </label>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Log Fuel Addition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Record Operational Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-semibold">×</button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Select Vehicle</span>
                <select
                  required
                  value={expenseForm.vehicleId}
                  onChange={e => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 bg-white focus:border-teal-500 outline-none"
                >
                  <option value="">-- Select vehicle --</option>
                  {vehicles.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Expense Category</span>
                  <select
                    value={expenseForm.type}
                    onChange={e => setExpenseForm({ ...expenseForm, type: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 bg-white focus:border-teal-500 outline-none"
                  >
                    <option value="Toll">Highway Tolls</option>
                    <option value="Misc">Incidental / Miscellaneous</option>
                    <option value="Parking">Parking Fee</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Cost (₹)</span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 240"
                    value={expenseForm.cost}
                    onChange={e => setExpenseForm({ ...expenseForm, cost: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Description</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. NH-48 Toll plaza payment"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Log Date</span>
                <input
                  type="date"
                  required
                  value={expenseForm.logDate}
                  onChange={e => setExpenseForm({ ...expenseForm, logDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                />
              </label>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
