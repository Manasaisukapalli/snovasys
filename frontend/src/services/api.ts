const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('bv_token');
export const setAuthToken = (token: string) => localStorage.setItem('bv_token', token);
export const removeAuthToken = () => localStorage.removeItem('bv_token');

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  getBootstrapStatus: () => apiRequest('/auth/bootstrap-status'),
  bootstrapAdmin: (payload: any) => apiRequest('/auth/bootstrap-admin', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/auth/me'),

  // Transactions
  deposit: (payload: { amount: number; description?: string }) =>
    apiRequest('/transactions/deposit', { method: 'POST', body: JSON.stringify(payload) }),
  transfer: (payload: { recipientAccountNumber: string; amount: number; description?: string }) =>
    apiRequest('/transactions/transfer', { method: 'POST', body: JSON.stringify(payload) }),
  getHistory: () => apiRequest('/transactions/history'),

  // Admin
  getStats: () => apiRequest('/admin/stats'),
  getUsers: () => apiRequest('/admin/users'),
  updateUserStatus: (userId: string, status: string) =>
    apiRequest(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateUserRole: (userId: string, role: string) =>
    apiRequest(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  // Ledger & Audit
  verifyLedger: () => apiRequest('/audit/ledger/verify'),
  getLedgerEntries: (limit = 50) => apiRequest(`/audit/ledger/entries?limit=${limit}`),
  getAuditLogs: (params: any = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/audit/logs${qs ? `?${qs}` : ''}`);
  },

  // Health
  getHealth: () => apiRequest('/health'),
  getReadiness: () => apiRequest('/ready')
};

