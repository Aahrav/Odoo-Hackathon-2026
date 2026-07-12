import { useState, useEffect } from 'react'
import { vehiclesApi } from '../api/vehicles'
import { useAuth } from '../context/AuthContext'

export default function VehiclePage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [order, setOrder] = useState('asc')

  // History states
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [vehicleHistory, setVehicleHistory] = useState({ trips: [], maintenance: [], fuel: [] })
  const [activeTab, setActiveTab] = useState('history') // history, documents

  // Form states
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    registrationNumber: '',
    name: '',
    model: '',
    type: 'Van',
    maxLoadCapacityKg: '',
    acquisitionCost: '',
    odometer: '',
  })
  const [error, setError] = useState('')

  // Document Upload form state
  const [docForm, setDocForm] = useState({
    name: '',
    type: 'Insurance',
    expiryDate: '',
  })
  const [docError, setDocError] = useState('')

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    setVehicles(await vehiclesApi.getVehicles())
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await vehiclesApi.addVehicle(form)
      await loadVehicles()
      setShowModal(false)
      setForm({
        registrationNumber: '',
        name: '',
        model: '',
        type: 'Van',
        maxLoadCapacityKg: '',
        acquisitionCost: '',
        odometer: '',
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRetire = async (id) => {
    if (confirm('Are you sure you want to retire this vehicle?')) {
      await vehiclesApi.retireVehicle(id)
      await loadVehicles()
      if (selectedVehicle?.id === id) {
        const found = (await vehiclesApi.getVehicles()).find(v => v.id === id)
        loadHistory(found)
      }
    }
  }

  const loadHistory = (vehicle) => {
    setSelectedVehicle(vehicle)
    const allTrips = vehiclesApi.getTrips().filter(t => t.vehicleId === vehicle.id)
    const allMaintenance = vehiclesApi.getMaintenanceLogs().filter(m => m.vehicleId === vehicle.id)
    const allFuel = vehiclesApi.getFuelExpenses().filter(f => f.vehicleId === vehicle.id)
    setVehicleHistory({ trips: allTrips, maintenance: allMaintenance, fuel: allFuel })
  }

  const handleAddDoc = async (e) => {
    e.preventDefault()
    setDocError('')
    if (!docForm.name.trim()) {
      setDocError('Document name is required')
      return
    }
    vehiclesApi.addVehicleDocument(selectedVehicle.id, docForm)
    // Reload vehicle to get updated docs list
    const updated = (await vehiclesApi.getVehicles()).find(v => v.id === selectedVehicle.id)
    setSelectedVehicle(updated)
    setDocForm({ name: '', type: 'Insurance', expiryDate: '' })
    await loadVehicles()
  }

  const handleDeleteDoc = async (docId) => {
    if (confirm('Are you sure you want to delete this document?')) {
      vehiclesApi.deleteVehicleDocument(selectedVehicle.id, docId)
      const updated = (await vehiclesApi.getVehicles()).find(v => v.id === selectedVehicle.id)
      setSelectedVehicle(updated)
      await loadVehicles()
    }
  }

  // Filter and sort logic
  const filteredVehicles = vehicles
    .filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter ? v.status === statusFilter : true
      const matchType = typeFilter ? v.type === typeFilter : true
      return matchSearch && matchStatus && matchType
    })
    .sort((a, b) => {
      let valA = a[sortBy]
      let valB = b[sortBy]
      if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }
      if (valA < valB) return order === 'asc' ? -1 : 1
      if (valA > valB) return order === 'asc' ? 1 : -1
      return 0
    })

  const types = [...new Set(vehicles.map((v) => v.type))]

  const canManage = user?.role === 'Fleet Manager' || user?.role === 'Admin'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicle Registry</h1>
          <p className="text-sm text-slate-500">Manage organizational transport fleet assets and configurations.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Register Vehicle
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-center">
        <input
          type="text"
          placeholder="Search registration, model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none focus:border-teal-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none focus:border-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none focus:border-teal-500"
        >
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none focus:border-teal-500 flex-1"
          >
            <option value="name">Sort by Name</option>
            <option value="registrationNumber">Sort by Reg No</option>
            <option value="odometer">Sort by Odometer</option>
            <option value="maxLoadCapacityKg">Sort by Capacity</option>
          </select>
          <button
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            className="bg-white border border-slate-200 p-2 rounded-xl text-sm hover:bg-slate-100"
          >
            {order === 'asc' ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vehicles List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Vehicle Details</th>
                  <th className="p-4">Type & Capacity</th>
                  <th className="p-4">Odometer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      No vehicles found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => loadHistory(v)}
                      className={`hover:bg-slate-50 cursor-pointer transition ${selectedVehicle?.id === v.id ? 'bg-teal-50/40' : ''}`}
                    >
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{v.name}</p>
                        <p className="text-xs font-mono text-slate-500">{v.registrationNumber}</p>
                        <p className="text-xs text-slate-400">{v.model}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-800 font-medium">{v.type}</p>
                        <p className="text-xs text-slate-500">{v.maxLoadCapacityKg} kg max capacity</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-700">{v.odometer.toLocaleString()} km</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          v.status === 'Available' ? 'bg-green-100 text-green-800' :
                          v.status === 'On Trip' ? 'bg-blue-100 text-blue-800' :
                          v.status === 'In Shop' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => loadHistory(v)}
                            className="text-xs font-medium text-teal-700 hover:text-teal-900"
                          >
                            Details
                          </button>
                          {canManage && v.status !== 'Retired' && (
                            <button
                              onClick={() => handleRetire(v.id)}
                              className="text-xs font-medium text-red-600 hover:text-red-900"
                            >
                              Retire
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details & History/Documents Panel */}
        <div className="space-y-4">
          {selectedVehicle ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Selected Vehicle</span>
                <h2 className="text-xl font-bold text-slate-900">{selectedVehicle.name}</h2>
                <p className="text-sm text-slate-500 font-mono">{selectedVehicle.registrationNumber}</p>
                <p className="text-xs text-slate-400 mt-1">Cost: ₹{selectedVehicle.acquisitionCost?.toLocaleString()}</p>
              </div>

              {/* Tab selector */}
              <div className="flex border-b border-slate-200 text-sm">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 pb-2 font-medium text-center ${activeTab === 'history' ? 'border-b-2 border-teal-700 text-teal-700' : 'text-slate-500'}`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex-1 pb-2 font-medium text-center ${activeTab === 'documents' ? 'border-b-2 border-teal-700 text-teal-700' : 'text-slate-500'}`}
                >
                  Documents ({selectedVehicle.documents?.length || 0})
                </button>
              </div>

              {activeTab === 'history' ? (
                <div className="space-y-4">
                  {/* Maintenance History */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">Maintenance History ({vehicleHistory.maintenance.length})</h3>
                    {vehicleHistory.maintenance.length === 0 ? (
                      <p className="text-xs text-slate-400">No maintenance records logged.</p>
                    ) : (
                      <ul className="space-y-2">
                        {vehicleHistory.maintenance.map((m) => (
                          <li key={m.id} className="p-2 bg-slate-50 rounded-lg text-xs">
                            <div className="flex justify-between font-semibold">
                              <span>{m.description}</span>
                              <span className="text-teal-700">₹{m.cost}</span>
                            </div>
                            <p className="text-slate-500 text-[10px] mt-1">Opened: {m.openDate} {m.closeDate ? `| Closed: ${m.closeDate}` : '| In Progress'}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Trips History */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">Trip logs ({vehicleHistory.trips.length})</h3>
                    {vehicleHistory.trips.length === 0 ? (
                      <p className="text-xs text-slate-400">No trips dispatched.</p>
                    ) : (
                      <ul className="space-y-2">
                        {vehicleHistory.trips.map((t) => (
                          <li key={t.id} className="p-2 bg-slate-50 rounded-lg text-xs">
                            <div className="flex justify-between font-semibold">
                              <span>{t.source} → {t.destination}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                t.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                              }`}>{t.status}</span>
                            </div>
                            <p className="text-slate-500 text-[10px] mt-1">Cargo: {t.cargoWeight} kg | Distance: {t.plannedDistance} km</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Documents Management */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">Attached Documents</h3>
                    {(!selectedVehicle.documents || selectedVehicle.documents.length === 0) ? (
                      <p className="text-xs text-slate-400">No uploaded/registered documents.</p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedVehicle.documents.map((doc) => (
                          <li key={doc.id} className="p-2.5 bg-slate-50 rounded-xl text-xs flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-800">{doc.name}</p>
                              <p className="text-[10px] text-slate-500">Category: {doc.type} | Uploaded: {doc.uploadDate}</p>
                              {doc.expiryDate && (
                                <p className={`text-[10px] font-medium mt-0.5 ${new Date(doc.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-600'}`}>
                                  Expiry: {doc.expiryDate}
                                </p>
                              )}
                            </div>
                            {canManage && (
                              <button
                                onClick={() => handleDeleteDoc(doc.id)}
                                className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
                              >
                                Delete
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {canManage && (
                    <form onSubmit={handleAddDoc} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-slate-700 uppercase">Attach Document Receipt</p>
                      
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Doc Name</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. National Permit Certificate"
                          value={docForm.name}
                          onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-xs mt-1 outline-none bg-white"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Category</span>
                          <select
                            value={docForm.type}
                            onChange={e => setDocForm({ ...docForm, type: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg p-1.5 text-xs mt-1 bg-white outline-none"
                          >
                            <option value="Insurance">Insurance</option>
                            <option value="Registration">Registration</option>
                            <option value="Pollution Certificate">Pollution Certificate</option>
                            <option value="Permit">Permit</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Expiry Date</span>
                          <input
                            type="date"
                            value={docForm.expiryDate}
                            onChange={e => setDocForm({ ...docForm, expiryDate: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg p-1.5 text-xs mt-1 bg-white outline-none"
                          />
                        </label>
                      </div>

                      {docError && <p className="text-[10px] text-red-600 font-semibold">{docError}</p>}

                      <button
                        type="submit"
                        className="w-full bg-teal-700 hover:bg-teal-800 text-white p-2 rounded-lg text-xs font-bold transition"
                      >
                        Upload Mock Document
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 border-dashed bg-slate-50/50 p-8 text-center text-slate-400">
              Select a vehicle to view its operational timeline and maintenance logs.
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Register New Vehicle</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-semibold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Reg Number</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GJ-06-AB-1234"
                    value={form.registrationNumber}
                    onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Vehicle Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Van-05"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Model</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Ace"
                    value={form.model}
                    onChange={e => setForm({ ...form, model: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Vehicle Type</span>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 bg-white focus:border-teal-500 outline-none"
                  >
                    <option value="Van">Van</option>
                    <option value="Light Truck">Light Truck</option>
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Container">Container</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Capacity (kg)</span>
                  <input
                    type="number"
                    required
                    placeholder="500"
                    value={form.maxLoadCapacityKg}
                    onChange={e => setForm({ ...form, maxLoadCapacityKg: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Odometer (km)</span>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={form.odometer}
                    onChange={e => setForm({ ...form, odometer: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Cost (₹)</span>
                  <input
                    type="number"
                    required
                    placeholder="650000"
                    value={form.acquisitionCost}
                    onChange={e => setForm({ ...form, acquisitionCost: e.target.value })}
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
                  onClick={() => setShowModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
