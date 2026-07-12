import { fetchApi } from './client';

// Map UI roles to DB enums
const ROLE_MAP = {
  'Fleet Manager': 'fleet_manager',
  'Driver': 'driver',
  'Safety Officer': 'safety_officer',
  'Financial Analyst': 'financial_analyst',
};

// Hydrate the raw DB user with navigation metadata expected by the UI layout
function hydrateUser(backendUser) {
  const role = backendUser.role; // e.g. 'fleet_manager'
  let permissions = [];
  let navigation = [{ path: '/dashboard', label: 'Dashboard' }];
  let displayRole = 'User';

  switch (role) {
    case 'admin':
    case 'fleet_manager':
      displayRole = role === 'admin' ? 'Admin' : 'Fleet Manager';
      permissions = ['Manage Fleet', 'Create Trips', 'Record Maintenance', 'Manage Expenses', 'Reports'];
      navigation.push(
        { path: '/fleet', label: 'Vehicle Registry' },
        { path: '/drivers', label: 'Drivers & Safety' },
        { path: '/trips', label: 'Trip Dispatcher' },
        { path: '/maintenance', label: 'Maintenance Logs' },
        { path: '/fuel-expenses', label: 'Fuel & Expenses' },
        { path: '/analytics', label: 'Reports & Analytics' }
      );
      break;
    case 'driver':
      displayRole = 'Driver';
      permissions = ['Create Trips', 'Manage Expenses'];
      navigation.push(
        { path: '/trips', label: 'My Trips' },
        { path: '/fuel-expenses', label: 'Log Expenses' }
      );
      break;
    case 'safety_officer':
      displayRole = 'Safety Officer';
      permissions = ['Manage Drivers', 'Compliance Reports'];
      navigation.push(
        { path: '/drivers', label: 'Drivers & Safety' },
        // using drivers page as a placeholder since compliance page doesn't exist in the current routes
        { path: '/drivers', label: 'Compliance Reports' }
      );
      break;
    case 'financial_analyst':
      displayRole = 'Financial Analyst';
      permissions = ['Reports', 'Manage Expenses'];
      navigation.push(
        { path: '/fuel-expenses', label: 'Expenses Summary' },
        { path: '/analytics', label: 'Reports & Analytics' }
      );
      break;
  }

  return {
    ...backendUser,
    displayRole,
    permissions,
    navigation
  };
}

export const authApi = {
  async login(credentials) {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });
    return {
      token: res.data.accessToken,
      user: hydrateUser(res.data.user)
    };
  },

  async signup(name, email, password, roleLabel) {
    const dbRole = ROLE_MAP[roleLabel] || 'fleet_manager';
    const res = await fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        role: dbRole,
        organizationId: '00000000-0000-0000-0000-000000000001' // default demo org
      })
    });
    return {
      token: res.data.accessToken,
      user: hydrateUser(res.data.user)
    };
  },

  async getMe(token) {
    const res = await fetchApi('/auth/me', {
      method: 'GET'
    });
    return {
      user: hydrateUser(res.data)
    };
  },

  async getRoles() {
    return ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'];
  },
};
