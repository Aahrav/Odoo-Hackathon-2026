// localStorage mock database for TransitOps
const KEYS = {
  USERS: 'transitops_mock_users',
  VEHICLES: 'transitops_mock_vehicles',
  DRIVERS: 'transitops_mock_drivers',
  TRIPS: 'transitops_mock_trips',
  MAINTENANCE: 'transitops_mock_maintenance',
  FUEL_EXPENSES: 'transitops_mock_fuel_expenses',
}

const DEFAULT_USERS = [
  {
    id: 'u1',
    email: 'Raven.k@transitops.in',
    password: 'TransitOps@2026',
    name: 'Raven K.',
    role: 'Fleet Manager',
    permissions: ['Manage Fleet', 'Create Trips', 'Record Maintenance', 'Manage Expenses', 'Reports'],
    navigation: [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/fleet', label: 'Vehicle Registry' },
      { path: '/drivers', label: 'Drivers & Safety' },
      { path: '/trips', label: 'Trip Dispatcher' },
      { path: '/maintenance', label: 'Maintenance Logs' },
      { path: '/fuel-expenses', label: 'Fuel & Expenses' },
      { path: '/analytics', label: 'Reports & Analytics' }
    ]
  },
  {
    id: 'u2',
    email: 'driver@transitops.in',
    password: 'password123',
    name: 'Alex D.',
    role: 'Driver',
    permissions: ['Create Trips', 'Manage Expenses'],
    navigation: [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/trips', label: 'My Trips' },
      { path: '/fuel-expenses', label: 'Log Expenses' }
    ]
  },
  {
    id: 'u3',
    email: 'safety@transitops.in',
    password: 'safetypassword',
    name: 'Sarah Connor',
    role: 'Safety Officer',
    permissions: ['Manage Drivers', 'Compliance Reports'],
    navigation: [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/drivers', label: 'Drivers & Safety' },
      { path: '/compliance', label: 'Compliance Reports' }
    ]
  },
  {
    id: 'u4',
    email: 'finance@transitops.in',
    password: 'financepassword',
    name: 'John Doe',
    role: 'Financial Analyst',
    permissions: ['Reports', 'Manage Expenses'],
    navigation: [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/fuel-expenses', label: 'Expenses Summary' },
      { path: '/analytics', label: 'Reports & Analytics' }
    ]
  }
]

const DEFAULT_VEHICLES = [
  {
    id: 'v1',
    registrationNumber: 'GJ-06-AB-1234',
    name: 'Van-05',
    model: 'Tata Ace',
    type: 'Van',
    maxLoadCapacityKg: 500,
    acquisitionCost: 650000,
    odometer: 15200,
    status: 'Available' // Available, On Trip, In Shop, Retired
  },
  {
    id: 'v2',
    registrationNumber: 'MH-12-XY-5678',
    name: 'Truck-02',
    model: 'BharatBenz 1918R',
    type: 'Heavy Truck',
    maxLoadCapacityKg: 10000,
    acquisitionCost: 2800000,
    odometer: 48900,
    status: 'Available'
  }
]

const DEFAULT_DRIVERS = [
  {
    id: 'd1',
    name: 'Alex',
    licenseNumber: 'DL-0420261122',
    licenseCategory: 'Heavy Vehicle',
    licenseExpiryDate: '2027-12-31',
    contactNumber: '+91 98765 43210',
    safetyScore: 95,
    status: 'Available' // Available, On Trip, Off Duty, Suspended
  },
  {
    id: 'd2',
    name: 'Bob Marley',
    licenseNumber: 'DL-0920259988',
    licenseCategory: 'Light Vehicle',
    licenseExpiryDate: '2026-08-15', // Expiring soon
    contactNumber: '+91 87654 32109',
    safetyScore: 82,
    status: 'Available'
  }
]

function getStored(key, defaults) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaults))
      return defaults
    }
    return JSON.parse(raw)
  } catch {
    return defaults
  }
}

function setStored(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const apiMock = {
  // --- AUTHENTICATION ---
  signup(name, email, password, role) {
    const users = getStored(KEYS.USERS, DEFAULT_USERS)
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('User already exists with this email')
    }

    // Assign appropriate permissions and navigation based on role
    let permissions = []
    let navigation = []

    if (role === 'Fleet Manager') {
      permissions = ['Manage Fleet', 'Create Trips', 'Record Maintenance', 'Manage Expenses', 'Reports']
      navigation = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/fleet', label: 'Vehicle Registry' },
        { path: '/drivers', label: 'Drivers & Safety' },
        { path: '/trips', label: 'Trip Dispatcher' },
        { path: '/maintenance', label: 'Maintenance Logs' },
        { path: '/fuel-expenses', label: 'Fuel & Expenses' },
        { path: '/analytics', label: 'Reports & Analytics' }
      ]
    } else if (role === 'Driver') {
      permissions = ['Create Trips', 'Manage Expenses']
      navigation = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/trips', label: 'My Trips' },
        { path: '/fuel-expenses', label: 'Log Expenses' }
      ]
    } else if (role === 'Safety Officer') {
      permissions = ['Manage Drivers', 'Compliance Reports']
      navigation = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/drivers', label: 'Drivers & Safety' },
        { path: '/compliance', label: 'Compliance Reports' }
      ]
    } else {
      // Financial Analyst
      permissions = ['Reports', 'Manage Expenses']
      navigation = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/fuel-expenses', label: 'Expenses Summary' },
        { path: '/analytics', label: 'Reports & Analytics' }
      ]
    }

    const newUser = {
      id: 'u_' + Date.now(),
      email,
      password,
      name,
      role,
      permissions,
      navigation
    }

    users.push(newUser)
    setStored(KEYS.USERS, users)
    return { token: 'mock-jwt-' + newUser.id, user: newUser }
  },

  login(email, password, role) {
    const users = getStored(KEYS.USERS, DEFAULT_USERS)
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() &&
           u.password === password &&
           u.role === role
    )

    if (!user) {
      throw new Error('Invalid credentials or role selection')
    }

    return { token: 'mock-jwt-' + user.id, user }
  },

  getMe(token) {
    const userId = token.replace('mock-jwt-', '')
    const users = getStored(KEYS.USERS, DEFAULT_USERS)
    const user = users.find(u => u.id === userId)
    if (!user) {
      throw new Error('Session expired')
    }
    return { user }
  },

  // --- VEHICLES ---
  getVehicles() {
    const vehicles = getStored(KEYS.VEHICLES, DEFAULT_VEHICLES)
    // Ensure all vehicles have a documents array
    return vehicles.map(v => ({ ...v, documents: v.documents || [] }))
  },

  addVehicle(vehicle) {
    const vehicles = this.getVehicles()
    if (vehicles.some(v => v.registrationNumber.toUpperCase() === vehicle.registrationNumber.toUpperCase())) {
      throw new Error('Registration number must be unique')
    }

    const newVehicle = {
      id: 'v_' + Date.now(),
      ...vehicle,
      odometer: Number(vehicle.odometer) || 0,
      maxLoadCapacityKg: Number(vehicle.maxLoadCapacityKg) || 0,
      acquisitionCost: Number(vehicle.acquisitionCost) || 0,
      status: 'Available',
      documents: []
    }

    vehicles.push(newVehicle)
    setStored(KEYS.VEHICLES, vehicles)
    return newVehicle
  },

  updateVehicleStatus(id, status) {
    const vehicles = this.getVehicles()
    const index = vehicles.findIndex(v => v.id === id)
    if (index !== -1) {
      vehicles[index].status = status
      setStored(KEYS.VEHICLES, vehicles)
    }
  },

  retireVehicle(id) {
    this.updateVehicleStatus(id, 'Retired')
  },

  addVehicleDocument(vehicleId, document) {
    const vehicles = this.getVehicles()
    const index = vehicles.findIndex(v => v.id === vehicleId)
    if (index !== -1) {
      if (!vehicles[index].documents) {
        vehicles[index].documents = []
      }
      const newDoc = {
        id: 'doc_' + Date.now(),
        ...document,
        uploadDate: new Date().toISOString().split('T')[0]
      }
      vehicles[index].documents.push(newDoc)
      setStored(KEYS.VEHICLES, vehicles)
      return newDoc
    }
  },

  deleteVehicleDocument(vehicleId, docId) {
    const vehicles = this.getVehicles()
    const index = vehicles.findIndex(v => v.id === vehicleId)
    if (index !== -1 && vehicles[index].documents) {
      vehicles[index].documents = vehicles[index].documents.filter(d => d.id !== docId)
      setStored(KEYS.VEHICLES, vehicles)
    }
  },

  // --- DRIVERS ---
  getDrivers() {
    return getStored(KEYS.DRIVERS, DEFAULT_DRIVERS)
  },

  addDriver(driver) {
    const drivers = this.getDrivers()
    const newDriver = {
      id: 'd_' + Date.now(),
      ...driver,
      safetyScore: Number(driver.safetyScore) || 100,
      status: 'Available'
    }
    drivers.push(newDriver)
    setStored(KEYS.DRIVERS, drivers)
    return newDriver
  },

  updateDriverStatus(id, status) {
    const drivers = this.getDrivers()
    const index = drivers.findIndex(d => d.id === id)
    if (index !== -1) {
      drivers[index].status = status
      setStored(KEYS.DRIVERS, drivers)
    }
  },

  updateSafetyScore(id, score) {
    const drivers = this.getDrivers()
    const index = drivers.findIndex(d => d.id === id)
    if (index !== -1) {
      drivers[index].safetyScore = Number(score)
      setStored(KEYS.DRIVERS, drivers)
    }
  },

  // --- TRIPS ---
  getTrips() {
    return getStored(KEYS.TRIPS, [])
  },

  createTrip(trip) {
    const trips = this.getTrips()
    const vehicles = this.getVehicles()
    const vehicle = vehicles.find(v => v.id === trip.vehicleId)

    if (!vehicle) throw new Error('Vehicle not found')
    if (Number(trip.cargoWeight) > vehicle.maxLoadCapacityKg) {
      throw new Error(`Cargo weight (${trip.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoadCapacityKg} kg)`)
    }

    const newTrip = {
      id: 't_' + Date.now(),
      ...trip,
      cargoWeight: Number(trip.cargoWeight),
      plannedDistance: Number(trip.plannedDistance),
      status: 'Draft', // Draft, Dispatched, Completed, Cancelled
      dateCreated: new Date().toISOString().split('T')[0]
    }

    trips.push(newTrip)
    setStored(KEYS.TRIPS, trips)
    return newTrip
  },

  dispatchTrip(tripId) {
    const trips = this.getTrips()
    const tripIndex = trips.findIndex(t => t.id === tripId)
    if (tripIndex === -1) throw new Error('Trip not found')

    const trip = trips[tripIndex]

    // Verify driver is available and license valid
    const drivers = this.getDrivers()
    const driver = drivers.find(d => d.id === trip.driverId)
    if (!driver) throw new Error('Driver not found')

    const today = new Date().toISOString().split('T')[0]
    if (driver.status !== 'Available') {
      throw new Error(`Driver ${driver.name} is currently ${driver.status} and cannot be dispatched`)
    }
    if (driver.licenseExpiryDate < today) {
      throw new Error(`Driver ${driver.name} has an expired license (Expired: ${driver.licenseExpiryDate}) and cannot be dispatched`)
    }

    // Verify vehicle is available
    const vehicles = this.getVehicles()
    const vehicle = vehicles.find(v => v.id === trip.vehicleId)
    if (!vehicle) throw new Error('Vehicle not found')
    if (vehicle.status !== 'Available') {
      throw new Error(`Vehicle ${vehicle.name} is currently ${vehicle.status} and cannot be dispatched`)
    }

    // Change status
    trips[tripIndex].status = 'Dispatched'
    setStored(KEYS.TRIPS, trips)

    this.updateVehicleStatus(trip.vehicleId, 'On Trip')
    this.updateDriverStatus(trip.driverId, 'On Trip')
  },

  completeTrip(tripId, finalOdometer, fuelLiters, fuelCost) {
    const trips = this.getTrips()
    const tripIndex = trips.findIndex(t => t.id === tripId)
    if (tripIndex === -1) throw new Error('Trip not found')

    const trip = trips[tripIndex]

    // Update vehicle odometer
    const vehicles = this.getVehicles()
    const vIndex = vehicles.findIndex(v => v.id === trip.vehicleId)
    if (vIndex !== -1) {
      if (Number(finalOdometer) < vehicles[vIndex].odometer) {
        throw new Error(`Final odometer (${finalOdometer} km) cannot be less than current vehicle odometer (${vehicles[vIndex].odometer} km)`)
      }
      vehicles[vIndex].odometer = Number(finalOdometer)
      vehicles[vIndex].status = 'Available'
      setStored(KEYS.VEHICLES, vehicles)
    }

    // Update driver status
    this.updateDriverStatus(trip.driverId, 'Available')

    // Add fuel log
    if (fuelLiters && fuelCost) {
      this.addFuelLog({
        vehicleId: trip.vehicleId,
        tripId: tripId,
        liters: Number(fuelLiters),
        cost: Number(fuelCost),
        logDate: new Date().toISOString().split('T')[0]
      })
    }

    trips[tripIndex].status = 'Completed'
    trips[tripIndex].finalOdometer = Number(finalOdometer)
    setStored(KEYS.TRIPS, trips)
  },

  cancelTrip(tripId) {
    const trips = this.getTrips()
    const tripIndex = trips.findIndex(t => t.id === tripId)
    if (tripIndex === -1) throw new Error('Trip not found')

    const trip = trips[tripIndex]

    trips[tripIndex].status = 'Cancelled'
    setStored(KEYS.TRIPS, trips)

    // Restore vehicle and driver to available if they were on this trip
    this.updateVehicleStatus(trip.vehicleId, 'Available')
    this.updateDriverStatus(trip.driverId, 'Available')
  },

  // --- MAINTENANCE ---
  getMaintenanceLogs() {
    return getStored(KEYS.MAINTENANCE, [])
  },

  createMaintenanceLog(log) {
    const logs = this.getMaintenanceLogs()
    const newLog = {
      id: 'm_' + Date.now(),
      ...log,
      cost: Number(log.cost),
      openDate: new Date().toISOString().split('T')[0],
      closeDate: null,
      status: 'Open' // Open, Closed
    }

    logs.push(newLog)
    setStored(KEYS.MAINTENANCE, logs)

    // Automatically switch vehicle status to 'In Shop'
    this.updateVehicleStatus(log.vehicleId, 'In Shop')
    return newLog
  },

  closeMaintenanceLog(logId) {
    const logs = this.getMaintenanceLogs()
    const index = logs.findIndex(l => l.id === logId)
    if (index !== -1) {
      logs[index].status = 'Closed'
      logs[index].closeDate = new Date().toISOString().split('T')[0]
      setStored(KEYS.MAINTENANCE, logs)

      // Restore vehicle to Available
      this.updateVehicleStatus(logs[index].vehicleId, 'Available')
    }
  },

  // --- FUEL & EXPENSES ---
  getFuelExpenses() {
    return getStored(KEYS.FUEL_EXPENSES, [])
  },

  addFuelLog(log) {
    const data = this.getFuelExpenses()
    const newLog = {
      id: 'f_' + Date.now(),
      type: 'Fuel',
      ...log,
      liters: Number(log.liters),
      cost: Number(log.cost),
      logDate: log.logDate || new Date().toISOString().split('T')[0]
    }
    data.push(newLog)
    setStored(KEYS.FUEL_EXPENSES, data)
    return newLog
  },

  addExpense(expense) {
    const data = this.getFuelExpenses()
    const newExpense = {
      id: 'e_' + Date.now(),
      type: 'Expense',
      ...expense,
      cost: Number(expense.cost),
      logDate: expense.logDate || new Date().toISOString().split('T')[0]
    }
    data.push(newExpense)
    setStored(KEYS.FUEL_EXPENSES, data)
    return newExpense
  }
}
