import axios from 'axios';

const API_BASE_URL = 'http://localhost:8083/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Trade API services
export const tradeService = {
  // Get all trades
  getAllTrades: async () => {
    const response = await api.get('/trades');
    return response.data;
  },

  // Get trade by ID
  getTradeById: async (id) => {
    const response = await api.get(`/trades/${id}`);
    return response.data;
  },

  // Create new trade
  createTrade: async (trade) => {
    const response = await api.post('/trades', trade);
    return response.data;
  },

  // Update trade
  updateTrade: async (id, trade) => {
    const response = await api.put(`/trades/${id}`, trade);
    return response.data;
  },

  // Delete trade
  deleteTrade: async (id) => {
    const response = await api.delete(`/trades/${id}`);
    return response.data;
  },

  // Close trade
  closeTrade: async (id, exitPrice, fees = 0) => {
    const response = await api.patch(`/trades/${id}/close`, { exitPrice, fees });
    return response.data;
  },

  // Get trades by coin
  getTradesByCoin: async (coin) => {
    const response = await api.get(`/trades/coin/${coin}`);
    return response.data;
  },

  // Get trades by status
  getTradesByStatus: async (status) => {
    const response = await api.get(`/trades/status/${status}`);
    return response.data;
  },

  // Get trades by date range
  getTradesByDateRange: async (startDate, endDate) => {
    const response = await api.get('/trades/date-range', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Get trade summary/statistics
  getTradeSummary: async () => {
    const response = await api.get('/trades/summary');
    return response.data;
  },

  // Get unique coins
  getUniqueCoins: async () => {
    const response = await api.get('/trades/coins');
    return response.data;
  },

  // Get unique exchanges
  getUniqueExchanges: async () => {
    const response = await api.get('/trades/exchanges');
    return response.data;
  },
};

// Investment API services
export const investmentService = {
  // Get all investments for a trade
  getInvestments: async (tradeId) => {
    const response = await api.get(`/trades/${tradeId}/investments`);
    return response.data;
  },

  // Add investment to a trade
  addInvestment: async (tradeId, investment) => {
    const response = await api.post(`/trades/${tradeId}/investments`, investment);
    return response.data;
  },

  // Update investment
  updateInvestment: async (tradeId, investmentId, investment) => {
    const response = await api.put(`/trades/${tradeId}/investments/${investmentId}`, investment);
    return response.data;
  },

  // Delete investment
  deleteInvestment: async (tradeId, investmentId) => {
    const response = await api.delete(`/trades/${tradeId}/investments/${investmentId}`);
    return response.data;
  },

  // Get total invested
  getTotalInvested: async (tradeId) => {
    const response = await api.get(`/trades/${tradeId}/investments/total`);
    return response.data;
  },
};

export default api;
