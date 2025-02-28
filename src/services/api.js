import axios from 'axios';

// Set the base URL for all API requests
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header to requests if token exists
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  
  getCurrentUser: async () => {
    return api.get('/api/auth/me');
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  }
};

// Game services
export const gameService = {
  createGame: async (gameData) => {
    return api.post('/api/games', gameData);
  },
  
  getAllGames: async () => {
    return api.get('/api/games');
  },
  
  getGameById: async (gameId) => {
    return api.get(`/api/games/${gameId}`);
  },
  
  updateGame: async (gameId, gameData) => {
    return api.put(`/api/games/${gameId}`, gameData);
  },
  
  createTeam: async (gameId, teamData) => {
    return api.post(`/api/games/${gameId}/teams`, teamData);
  },
  
  joinTeam: async (gameId, teamId) => {
    return api.post(`/api/games/${gameId}/join/${teamId}`);
  },
  
  addPub: async (gameId, pubData) => {
    return api.post(`/api/games/${gameId}/pubs`, pubData);
  },
  
  startGame: async (gameId) => {
    return api.post(`/api/games/${gameId}/start`);
  }
};

export default api; 