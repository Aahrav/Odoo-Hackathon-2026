import { useState, useEffect } from 'react'
import { apiMock } from '../api/apiMock'
import { useAuth } from '../context/AuthContext'

export default function TripPage() {
  const { user } = useAuth()
  
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState(null)
  
  // Create Form State
  const [tripForm, setTripForm] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    plannedDistance: '',
  })

  // Complete Form State
  const [completeForm, setCompleteForm] = useState({
    finalOdometer: '',
    fuelLiters: '',
    fuelCost: '',
  })

  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setTrips(apiMock.getTrips())
    setVehicles(apiMock.getVehicles())
    setDrivers(apiMock.getDrivers())
  }

  const handleCreateTrip = (e) => {
    e.preventDefault()
    setError('')
    try {
      apiMock.createTrip(tripForm)
      loadData()
      setShowCreateModal(false)
      setTripForm({
        source: '',
        destination: '',
        vehicleId: '',
        driverId: '',
        cargoWeight: '',
        plannedDistance: '',
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDispatch = (id) => {
    try {
      apiMock.dispatchTrip(id)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCompleteInit = (trip) => {
    setSelectedTrip(trip)
    const vehicle = vehicles.find(v => v.id === trip.vehicleId)
    setCompleteForm({
      finalOdometer: vehicle ? String(vehicle.odometer + trip.plannedDistance) : '',
      fuelLiters: '',
      fuelCost: '',
    })
    setShowCompleteModal(true)
  }

  const handleCompleteSubmit = (e) => {
    e.preventDefault()
    setError('')
    try {
      apiMock.completeTrip(
        selectedTrip.id,
        completeForm.finalOdometer,
        completeForm.fuelLiters,
        completeForm.fuelCost
      )
      loadData()
      setShowCompleteModal(false)
      setSelectedTrip(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancel = (id) => {
    if (confirm('Are you sure you want to cancel this trip?')) {
      apiMock.cancelTrip(id)
      loadData()
    }
  }

  // Filter selection lists for creating trip
  const todayStr = new Date().toISOString().split('T')[0]
  
  const dispatchableVehicles = vehicles.filter(v => v.status === 'Available')
  
  const dispatchableDrivers = drivers.filter(d => 
    d.status === 'Available' && 
    d.licenseExpiryDate >= todayStr
  )

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.name || 'Unknown Vehicle'
  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || 'Unknown Driver'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trip Dispatcher</h1>
          <p className="text-sm text-slate-500">Create, schedule, dispatch, and track cargo journeys.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          Create Dispatch Draft
        </button>
      </div>

      {/* Trips list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="p-4">Route</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Driver</th>
              <th className="p-4">Cargo / Distance</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {trips.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  No trips dispatched or drafted yet.
                </td>
              </tr>
            ) : (
              [...trips].reverse().map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-semibold text-slate-900">
                    {t.source} → {t.destination}
                    <p className="text-[10px] font-normal text-slate-400 font-mono mt-0.5">Created: {t.dateCreated}</p>
                  </td>
                  <td className="p-4 text-slate-700">{getVehicleName(t.vehicleId)}</td>
                  <td className="p-4 text-slate-700">{getDriverName(t.driverId)}</td>
                  <td className="p-4">
                    <p className="text-slate-800">{t.cargoWeight} kg</p>
                    <p className="text-xs text-slate-400">{t.plannedDistance} km</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.status === 'Draft' ? 'bg-slate-100 text-slate-800' :
                      t.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                      t.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {t.status === 'Draft' && (
                        <>
                          <button
                            onClick={() => handleDispatch(t.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1.5 rounded-lg transition"
                          >
                            Dispatch
                          </button>
                          <button
                            onClick={() => handleCancel(t.id)}
                            className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {t.status === 'Dispatched' && (
                        <>
                          <button
                            onClick={() => handleCompleteInit(t)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1.5 rounded-lg transition"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancel(t.id)}
                            className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Create Trip Draft</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-semibold">×</button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Source</span>
                  <input
                    type="text"
                    required
                    placeholder="Vadodara"
                    value={tripForm.source}
                    onChange={e => setTripForm({ ...tripForm, source: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Destination</span>
                  <input
                    type="text"
                    required
                    placeholder="Ahmedabad"
                    value={tripForm.destination}
                    onChange={e => setTripForm({ ...tripForm, destination: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Select Vehicle</span>
                <select
                  required
                  value={tripForm.vehicleId}
                  onChange={e => setTripForm({ ...tripForm, vehicleId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 bg-white focus:border-teal-500 outline-none"
                >
                  <option value="">-- Choose available vehicle --</option>
                  {dispatchableVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationNumber}) - Capacity: {v.maxLoadCapacityKg}kg
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Select Driver</span>
                <select
                  required
                  value={tripForm.driverId}
                  onChange={e => setTripForm({ ...tripForm, driverId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 bg-white focus:border-teal-500 outline-none"
                >
                  <option value="">-- Choose available driver --</option>
                  {dispatchableDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} (License Class: {d.licenseCategory})
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Cargo Weight (kg)</span>
                  <input
                    type="number"
                    required
                    placeholder="450"
                    value={tripForm.cargoWeight}
                    onChange={e => setTripForm({ ...tripForm, cargoWeight: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Distance (km)</span>
                  <input
                    type="number"
                    required
                    placeholder="120"
                    value={tripForm.plannedDistance}
                    onChange={e => setTripForm({ ...tripForm, plannedDistance: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Draft Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Complete Dispatched Trip</h2>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-semibold">×</button>
            </div>

            <p className="text-xs text-slate-500">Record final vehicle mileage and fuel consumption for trip completion.</p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Final Odometer Reading (km)</span>
                <input
                  type="number"
                  required
                  value={completeForm.finalOdometer}
                  onChange={e => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Fuel Consumed (Liters) - Optional</span>
                  <input
                    type="number"
                    placeholder="35"
                    value={completeForm.fuelLiters}
                    onChange={e => setCompleteForm({ ...completeForm, fuelLiters: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Fuel Cost (₹) - Optional</span>
                  <input
                    type="number"
                    placeholder="3200"
                    value={completeForm.fuelCost}
                    onChange={e => setCompleteForm({ ...completeForm, fuelCost: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Complete Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
