const API_BASE = 'http://localhost:5172/api';

export const checkStatus = async () => {
    const response = await fetch(`${API_BASE}/status`);
    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
};

export const getData = async () => {
    const response = await fetch(`${API_BASE}/data`);
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
};

export const refreshData = async () => {
    const response = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to refresh data');
    }
    return response.json();
};

export const login = async (email, password) => {
    const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
    }
    return response.json();
};

export const setSecurity = async (password, enabled) => {
    const response = await fetch(`${API_BASE}/security/set`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, enabled }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update security settings');
    }
    return response.json();
};

export const verifySecurity = async (password) => {
    const response = await fetch(`${API_BASE}/security/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Verification failed');
    }
    return response.json();
};
