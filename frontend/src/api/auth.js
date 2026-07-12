import { apiMock } from './apiMock'

export const authApi = {
  async login(credentials) {
    // Delay slightly to simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 300))
    return apiMock.login(credentials.email, credentials.password, credentials.role)
  },

  async signup(name, email, password, role) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return apiMock.signup(name, email, password, role)
  },

  async getMe(token) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return apiMock.getMe(token)
  },

  async getRoles() {
    return ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']
  },
}

