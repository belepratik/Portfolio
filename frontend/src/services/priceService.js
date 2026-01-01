// Binance Public API - No CORS issues, no API key required
// Using Binance's ticker endpoint which allows cross-origin requests

const BINANCE_API = 'https://api.binance.com/api/v3';

// Commonly used coins for the UI (can be expanded)
const POPULAR_COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'LINK', 'ADA', 'DOT', 'AVAX', 'MATIC', 'UNI'];

// Cache for prices
let priceCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const priceService = {
  // Fetch prices for requested coins (defaults to popular ones)
  getPrices: async (symbols = POPULAR_COINS) => {
    const now = Date.now();
    
    // Check cache
    if ((now - lastFetchTime) < CACHE_DURATION && Object.keys(priceCache).length > 0) {
      const result = {};
      symbols.forEach(s => {
        const upper = s?.toUpperCase();
        if (priceCache[upper]) result[upper] = priceCache[upper];
      });
      if (Object.keys(result).length > 0) return result;
    }

    try {
      // Fetch 24hr ticker for all symbols - single API call
      const response = await fetch(`${BINANCE_API}/ticker/24hr`);
      
      if (!response.ok) throw new Error('Failed to fetch prices');

      const data = await response.json();
      const result = {};
      
      // Filter for USDT pairs of our supported coins
      const targetPairs = symbols.map(s => `${s?.toUpperCase()}USDT`);
      
      data.forEach(ticker => {
        if (targetPairs.includes(ticker.symbol)) {
          const coin = ticker.symbol.replace('USDT', '');
          const priceData = {
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent),
          };
          priceCache[coin] = priceData;
          result[coin] = priceData;
        }
      });
      
      lastFetchTime = now;
      return result;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return {};
    }
  },

  // Fetch single coin price
  getPrice: async (symbol) => {
    const upper = symbol?.toUpperCase();
    
    // Check cache first
    const now = Date.now();
    if (priceCache[upper] && (now - lastFetchTime) < CACHE_DURATION) {
      return priceCache[upper];
    }
    
    try {
      const response = await fetch(`${BINANCE_API}/ticker/24hr?symbol=${upper}USDT`);
      
      if (!response.ok) return null;

      const ticker = await response.json();
      const priceData = {
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChangePercent),
      };
      priceCache[upper] = priceData;
      lastFetchTime = now;
      return priceData;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  },

  // Clear cache
  clearCache: () => {
    priceCache = {};
    lastFetchTime = 0;
  },

  // Get popular coins list
  getPopularCoins: () => POPULAR_COINS,
};

export default priceService;
