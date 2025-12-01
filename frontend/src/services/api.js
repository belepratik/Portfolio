import axios from 'axios';

// Use relative URL for Docker, absolute for local development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

  // Close trade with reason (TP_HIT, LIQUIDATED, MANUAL)
  closeTrade: async (id, exitPrice, closeReason) => {
    const response = await api.patch(`/trades/${id}/close`, { exitPrice, closeReason });
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

// Exchange Wallet API services
export const walletService = {
  // Get all wallets
  getAllWallets: async () => {
    const response = await api.get('/wallets');
    return response.data;
  },

  // Get wallet by ID
  getWalletById: async (id) => {
    const response = await api.get(`/wallets/${id}`);
    return response.data;
  },

  // Get wallet by exchange name
  getWalletByExchange: async (exchangeName) => {
    const response = await api.get(`/wallets/exchange/${exchangeName}`);
    return response.data;
  },

  // Create wallet
  createWallet: async (wallet) => {
    const response = await api.post('/wallets', wallet);
    return response.data;
  },

  // Update wallet
  updateWallet: async (id, wallet) => {
    const response = await api.put(`/wallets/${id}`, wallet);
    return response.data;
  },

  // Delete wallet
  deleteWallet: async (id) => {
    const response = await api.delete(`/wallets/${id}`);
    return response.data;
  },

  // Get wallet summary (with used/available balance)
  getWalletSummary: async (id) => {
    const response = await api.get(`/wallets/${id}/summary`);
    return response.data;
  },

  // Get all wallet summaries
  getAllWalletSummaries: async () => {
    const response = await api.get('/wallets/summaries');
    return response.data;
  },

  // Get total balance across all exchanges
  getTotalBalance: async () => {
    const response = await api.get('/wallets/total-balance');
    return response.data;
  },
};

export default api;
