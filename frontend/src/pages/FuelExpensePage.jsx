import { useState, useEffect } from 'react'
import { expensesApi } from '../api/expenses'
import { vehiclesApi } from '../api/vehicles'
import { tripsApi } from '../api/trips'
import { useAuth } from '../context/AuthContext'
import CustomSelect from '../components/CustomSelect'
import LoadingSpinner from '../components/LoadingSpinner'

export default function FuelExpensePage() {
  const { user } = useAuth()
  
  const [data, setData] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

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

  const loadData = async () => {
    setLoading(true)
    try {
      const [fuelLogs, expenses, vehiclesData, tripsData] = await Promise.all([
        expensesApi.getFuelLogs(),
        expensesApi.getExpenses(),
        vehiclesApi.getVehicles(),
        tripsApi.getTrips().catch(() => []) // Tripping if empty
      ])

      // Normalize Fuel Logs
      const mappedFuel = fuelLogs.map(f => ({
        id: `fuel-${f.id}`,
        type: 'Fuel',
        vehicleId: f.vehicle_id,
        tripId: f.trip_id,
        logDate: new Date(f.log_date).toLocaleDateString(),
        sortDate: new Date(f.log_date).getTime(),
        liters: Number(f.liters),
        cost: Number(f.liters) * Number(f.cost_per_liter)
      }))

      // Normalize Expenses
      const mappedExpenses = expenses.map(e => ({
        id: `exp-${e.id}`,
        type: e.expense_type.charAt(0).toUpperCase() + e.expense_type.slice(1),
        vehicleId: e.vehicle_id,
        tripId: e.trip_id,
        description: e.description || 'No description',
        logDate: new Date(e.expense_date).toLocaleDateString(),
        sortDate: new Date(e.expense_date).getTime(),
        cost: Number(e.amount)
      }))

      // Combine and sort descending
      const combined = [...mappedFuel, ...mappedExpenses].sort((a, b) => b.sortDate - a.sortDate)

      setData(combined)
      setVehicles(vehiclesData)
      setTrips(tripsData)
    } catch (err) {
      console.error("Failed to load expenses data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFuelSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (!fuelForm.vehicleId) throw new Error('Please select a vehicle')
      await expensesApi.addFuelLog(fuelForm)
      await loadData()
      setShowFuelModal(false)
      setFuelForm({
        vehicleId: '',
        tripId: '',
        liters: '',
        cost: '',
        logDate: new Date().toISOString().split('T')[0],
      })
    } catch (err) {
      setError(err.message || 'Failed to add fuel log')
    }
  }

  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (!expenseForm.vehicleId) throw new Error('Please select a vehicle')
      await expensesApi.addExpense(expenseForm)
      await loadData()
      setShowExpenseModal(false)
      setExpenseForm({
        vehicleId: '',
        description: '',
        cost: '',
        type: 'Toll',
        logDate: new Date().toISOString().split('T')[0],
      })
    } catch (err) {
      setError(err.message || 'Failed to add expense log')
    }
  }

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.name || 'Unknown'
  const getTripLabel = (id) => {
    const trip = trips.find(t => t.id === id)
    return trip ? `${trip.source} → ${trip.destination}` : 'Standalone Log'
  }

  if (loading) return <LoadingSpinner message="Loading fuel & expenses..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fuel & Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">Record fuel additions, highway tolls, and incidental transport costs.</p>
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
            className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Log Expense
          </button>
        </div>
      </div>

      {/* Expense ledger list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <th className="p-4">Date</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Type</th>
              <th className="p-4">Description / Associated Trip</th>
              <th className="p-4">Details</th>
              <th className="p-4 text-right">Cost (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  No fuel logs or expense receipts recorded.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="p-4 text-slate-600 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">{item.logDate}</td>
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">{getVehicleName(item.vehicleId)}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.type === 'Fuel' 
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400' 
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-300">
                    {item.type === 'Fuel' ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">Trip: {getTripLabel(item.tripId)}</span>
                    ) : (
                      <>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.type}</p>
                      </>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    {item.type === 'Fuel' ? `${item.liters} Liters` : 'Receipt logged'}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900 dark:text-white">₹{item.cost?.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Fuel Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Log Fuel Addition</h2>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-lg font-semibold">×</button>
            </div>

            <form onSubmit={handleFuelSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Select Vehicle</span>
                <div className="mt-1 z-40">
                  <CustomSelect
                    required
                    value={fuelForm.vehicleId}
                    onChange={e => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                    options={[
                      { value: '', label: '-- Select vehicle --' },
                      ...vehicles.filter(v => v.status !== 'Retired').map(v => ({
                        value: v.id,
                        label: `${v.name} (${v.registrationNumber})`
                      }))
                    ]}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Select Trip (Optional)</span>
                <div className="mt-1 z-30">
                  <CustomSelect
                    value={fuelForm.tripId}
                    onChange={e => setFuelForm({ ...fuelForm, tripId: e.target.value })}
                    options={[
                      { value: '', label: '-- Standalone (No associated active trip) --' },
                      ...trips.map(t => ({
                        value: t.id,
                        label: `${t.source} → ${t.destination} (${t.status})`
                      }))
                    ]}
                  />
                </div>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Liters consumed</span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45"
                    value={fuelForm.liters}
                    onChange={e => setFuelForm({ ...fuelForm, liters: e.target.value })}
                    className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 dark:focus:border-teal-500 outline-none text-slate-900 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Total Fuel Cost (₹)</span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 4500"
                    value={fuelForm.cost}
                    onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })}
                    className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 dark:focus:border-teal-500 outline-none text-slate-900 dark:text-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Log Date</span>
                <input
                  type="date"
                  required
                  value={fuelForm.logDate}
                  onChange={e => setFuelForm({ ...fuelForm, logDate: e.target.value })}
                  className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 dark:focus:border-teal-500 outline-none text-slate-900 dark:text-white"
                />
              </label>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg p-2.5">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Operational Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-lg font-semibold">×</button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Select Vehicle</span>
                <div className="mt-1 z-40">
                  <CustomSelect
                    required
                    value={expenseForm.vehicleId}
                    onChange={e => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}
                    options={[
                      { value: '', label: '-- Select vehicle --' },
                      ...vehicles.filter(v => v.status !== 'Retired').map(v => ({
                        value: v.id,
                        label: `${v.name} (${v.registrationNumber})`
                      }))
                    ]}
                  />
                </div>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Expense Category</span>
                  <div className="mt-1 z-30">
                    <CustomSelect
                      value={expenseForm.type}
                      onChange={e => setExpenseForm({ ...expenseForm, type: e.target.value })}
                      options={[
                        { value: 'Toll', label: 'Highway Tolls' },
                        { value: 'Misc', label: 'Incidental / Miscellaneous' },
                        { value: 'Parking', label: 'Parking Fee' }
                      ]}
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Cost (₹)</span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 240"
                    value={expenseForm.cost}
                    onChange={e => setExpenseForm({ ...expenseForm, cost: e.target.value })}
                    className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 dark:focus:border-teal-500 outline-none text-slate-900 dark:text-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Description</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. NH-48 Toll plaza payment"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 dark:focus:border-teal-500 outline-none text-slate-900 dark:text-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Log Date</span>
                <input
                  type="date"
                  required
                  value={expenseForm.logDate}
                  onChange={e => setExpenseForm({ ...expenseForm, logDate: e.target.value })}
                  className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 dark:focus:border-teal-500 outline-none text-slate-900 dark:text-white"
                />
              </label>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg p-2.5">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold"
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
