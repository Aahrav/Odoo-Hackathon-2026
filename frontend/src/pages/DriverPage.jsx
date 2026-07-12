import { useState, useEffect } from 'react'
import { apiMock } from '../api/apiMock'
import { useAuth } from '../context/AuthContext'

export default function DriverPage() {
  const { user } = useAuth()
  const [drivers, setDrivers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expiringSoonFilter, setExpiringSoonFilter] = useState(false)

  // Notification banners
  const [notification, setNotification] = useState('')

  // Modals / forms
  const [showAddModal, setShowAddModal] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  
  const [addForm, setAddForm] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: 'Heavy Vehicle',
    licenseExpiryDate: '',
    contactNumber: '',
    safetyScore: '100',
  })
  
  const [scoreForm, setScoreForm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = () => {
    setDrivers(apiMock.getDrivers())
  }

  const handleAddDriver = (e) => {
    e.preventDefault()
    setError('')
    try {
      apiMock.addDriver(addForm)
      loadDrivers()
      setShowAddModal(false)
      setAddForm({
        name: '',
        licenseNumber: '',
        licenseCategory: 'Heavy Vehicle',
        licenseExpiryDate: '',
        contactNumber: '',
        safetyScore: '100',
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleScoreUpdate = (e) => {
    e.preventDefault()
    if (!selectedDriver) return
    apiMock.updateSafetyScore(selectedDriver.id, scoreForm)
    loadDrivers()
    setShowScoreModal(false)
    setSelectedDriver(null)
    setScoreForm('')
  }

  const handleStatusChange = (id, newStatus) => {
    apiMock.updateDriverStatus(id, newStatus)
    loadDrivers()
  }

  const handleSendReminder = (driver) => {
    setNotification(`Simulated email compliance notification sent to driver ${driver.name} (${driver.contactNumber}) regarding upcoming license expiry.`)
    setTimeout(() => setNotification(''), 5000)
  }

  // Filter calculation
  const todayStr = new Date().toISOString().split('T')[0]
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const filteredDrivers = drivers.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.contactNumber.toLowerCase().includes(search.toLowerCase())
    
    const matchStatus = statusFilter ? d.status === statusFilter : true

    // Expiring soon: licenseExpiryDate is in the past, or between today and 30 days from now
    const isExpiring = d.licenseExpiryDate <= thirtyDaysLater
    const matchExpiring = expiringSoonFilter ? isExpiring : true

    return matchSearch && matchStatus && matchExpiring
  })

  const isSafetyOfficerOrAdmin = user?.role === 'Safety Officer' || user?.role === 'Admin'
  const isFleetManagerOrAdmin = user?.role === 'Fleet Manager' || user?.role === 'Admin'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Drivers & Safety Profiles</h1>
          <p className="text-sm text-slate-500">Track driver licenses, compliance status, and safety ratings.</p>
        </div>
        {isFleetManagerOrAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Add Driver Profile
          </button>
        )}
      </div>

      {notification && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-850 rounded-2xl text-sm font-medium animate-fade-in flex justify-between items-center">
          <span>{notification}</span>
          <button onClick={() => setNotification('')} className="text-teal-700 hover:text-teal-900 font-bold px-2">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search driver name, license..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none focus:border-teal-500 flex-1 w-full"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none focus:border-teal-500 w-full sm:w-48"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="Off Duty">Off Duty</option>
          <option value="Suspended">Suspended</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={expiringSoonFilter}
            onChange={(e) => setExpiringSoonFilter(e.target.checked)}
            className="rounded border-slate-300 text-teal-700 focus:ring-teal-500"
          />
          Show Licenses Expiring Soon (30 days)
        </label>
      </div>

      {/* Drivers Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="p-4">Driver Name</th>
              <th className="p-4">License Category</th>
              <th className="p-4">Expiry Date</th>
              <th className="p-4">Safety Score</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredDrivers.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  No driver profiles found.
                </td>
              </tr>
            ) : (
              filteredDrivers.map((d) => {
                const isLicenseExpired = d.licenseExpiryDate < todayStr
                const isLicenseWarning = d.licenseExpiryDate <= thirtyDaysLater && !isLicenseExpired

                return (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.contactNumber}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-800 font-medium">{d.licenseCategory}</p>
                      <p className="text-xs font-mono text-slate-400">{d.licenseNumber}</p>
                    </td>
                    <td className="p-4">
                      <p className={`font-medium ${isLicenseExpired ? 'text-red-600 font-bold' : isLicenseWarning ? 'text-amber-600 font-semibold' : 'text-slate-700'}`}>
                        {d.licenseExpiryDate}
                        {isLicenseExpired && ' (EXPIRED)'}
                        {isLicenseWarning && ' (EXPIRING)'}
                      </p>
                      {isLicenseWarning && (
                        <button
                          onClick={() => handleSendReminder(d)}
                          className="mt-1 block text-[10px] font-bold text-teal-700 hover:text-teal-900 underline"
                        >
                          ✉ Send Email Reminder
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-xs ${
                          d.safetyScore >= 90 ? 'bg-green-100 text-green-800' :
                          d.safetyScore >= 80 ? 'bg-blue-100 text-blue-800' :
                          d.safetyScore >= 70 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {d.safetyScore}
                        </span>
                        {isSafetyOfficerOrAdmin && (
                          <button
                            onClick={() => {
                              setSelectedDriver(d)
                              setScoreForm(String(d.safetyScore))
                              setShowScoreModal(true)
                            }}
                            className="text-xs text-teal-700 hover:underline"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        d.status === 'Available' ? 'bg-green-100 text-green-800' :
                        d.status === 'On Trip' ? 'bg-blue-100 text-blue-800' :
                        d.status === 'Off Duty' ? 'bg-slate-100 text-slate-700' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {isFleetManagerOrAdmin && (
                        <select
                          value={d.status}
                          onChange={(e) => handleStatusChange(d.id, e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:border-teal-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Off Duty">Off Duty</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Add Driver Profile</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-semibold">×</button>
            </div>

            <form onSubmit={handleAddDriver} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Driver Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">License Number</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-12345"
                    value={addForm.licenseNumber}
                    onChange={e => setAddForm({ ...addForm, licenseNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">License Class</span>
                  <select
                    value={addForm.licenseCategory}
                    onChange={e => setAddForm({ ...addForm, licenseCategory: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 bg-white focus:border-teal-500 outline-none"
                  >
                    <option value="Light Vehicle">Light Vehicle</option>
                    <option value="Heavy Vehicle">Heavy Vehicle</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Expiry Date</span>
                  <input
                    type="date"
                    required
                    value={addForm.licenseExpiryDate}
                    onChange={e => setAddForm({ ...addForm, licenseExpiryDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Contact Number</span>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={addForm.contactNumber}
                    onChange={e => setAddForm({ ...addForm, contactNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Initial Safety Score (0-100)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={addForm.safetyScore}
                  onChange={e => setAddForm({ ...addForm, safetyScore: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                />
              </label>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Safety Score Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Update Safety Score</h2>
              <button onClick={() => setShowScoreModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-semibold">×</button>
            </div>

            <p className="text-xs text-slate-500">Updating driver safety score for compliance auditing.</p>

            <form onSubmit={handleScoreUpdate} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase">Safety Score (0 - 100)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={scoreForm}
                  onChange={e => setScoreForm(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mt-1 focus:border-teal-500 outline-none"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScoreModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Update Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
