export async function fetchApi(endpoint, options = {}) {
  const { headers, ...restOptions } = options;
  const authStorage = localStorage.getItem('transitops_auth');
  let token = null;
  
  if (authStorage) {
    try {
      token = JSON.parse(authStorage).token;
    } catch (e) {
      console.error('Failed to parse auth token from storage');
    }
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api/v1${endpoint}`, {
    ...restOptions,
    headers: { ...defaultHeaders, ...headers },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Global 401 interception: if unauthorized, clear session and redirect
    if (response.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('transitops_auth');
      window.location.href = '/login';
    }
    
    const errorMessage = data?.error?.message || data?.message || 'API request failed';
    throw new Error(errorMessage);
  }

  return data;
}
