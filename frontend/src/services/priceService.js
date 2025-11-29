// CoinGecko API service for fetching live crypto prices
// Free API - no key required (rate limited to ~10-30 calls/min)

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map common trading symbols to CoinGecko IDs
const COIN_ID_MAP = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'SHIB': 'shiba-inu',
  'LTC': 'litecoin',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
  'ETC': 'ethereum-classic',
  'FIL': 'filecoin',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'INJ': 'injective-protocol',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'TIA': 'celestia',
  'NEAR': 'near',
  'FTM': 'fantom',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AXS': 'axie-infinity',
  'AAVE': 'aave',
  'CRV': 'curve-dao-token',
  'MKR': 'maker',
  'SNX': 'havven',
  'COMP': 'compound-governance-token',
  'LDO': 'lido-dao',
  'RPL': 'rocket-pool',
  'GMX': 'gmx',
  'DYDX': 'dydx',
  'PEPE': 'pepe',
  'WIF': 'dogwifcoin',
  'BONK': 'bonk',
  'FLOKI': 'floki',
  'WLD': 'worldcoin-wld',
  'BLUR': 'blur',
  'JTO': 'jito-governance-token',
  'JUP': 'jupiter-exchange-solana',
  'ONDO': 'ondo-finance',
  'ENA': 'ethena',
  'BNB': 'binancecoin',
  'TRX': 'tron',
  'TON': 'the-open-network',
  'BCH': 'bitcoin-cash',
  'LEO': 'leo-token',
  'OKB': 'okb',
  'KAS': 'kaspa',
  'RENDER': 'render-token',
  'TAO': 'bittensor',
  'VET': 'vechain',
  'ALGO': 'algorand',
  'RUNE': 'thorchain',
  'STX': 'blockstack',
  'FET': 'fetch-ai',
  'GRT': 'the-graph',
  'THETA': 'theta-token',
  'AR': 'arweave',
  'FLOW': 'flow',
  'GALA': 'gala',
  'NEO': 'neo',
  'KAVA': 'kava',
  'XTZ': 'tezos',
  'EOS': 'eos',
  'IOTA': 'iota',
  'XDC': 'xdce-crowd-sale',
  'EGLD': 'elrond-erd-2',
  'HNT': 'helium',
  'CAKE': 'pancakeswap-token',
  '1INCH': '1inch',
  'SUSHI': 'sushi',
  'YFI': 'yearn-finance',
  'BAL': 'balancer',
  'ZRX': '0x',
  'ENS': 'ethereum-name-service',
  'MASK': 'mask-network',
  'OCEAN': 'ocean-protocol',
  'AGIX': 'singularitynet',
  'RNDR': 'render-token',
  'IMX': 'immutable-x',
  'MINA': 'mina-protocol',
  'CFX': 'conflux-token',
  'ZIL': 'zilliqa',
  'QTUM': 'qtum',
  'WAVES': 'waves',
  'ICX': 'icon',
  'ZEC': 'zcash',
  'DASH': 'dash',
  'XMR': 'monero',
};

// Cache for prices (to avoid too many API calls)
let priceCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const priceService = {
  // Get CoinGecko ID from symbol
  getCoinId: (symbol) => {
    const upperSymbol = symbol.toUpperCase();
    return COIN_ID_MAP[upperSymbol] || upperSymbol.toLowerCase();
  },

  // Fetch price for a single coin
  getPrice: async (symbol) => {
    const coinId = priceService.getCoinId(symbol);
    
    // Check cache first
    const now = Date.now();
    if (priceCache[coinId] && (now - lastFetchTime) < CACHE_DURATION) {
      return priceCache[coinId];
    }

    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch price');
      }

      const data = await response.json();
      
      if (data[coinId]) {
        const priceData = {
          price: data[coinId].usd,
          change24h: data[coinId].usd_24h_change,
        };
        priceCache[coinId] = priceData;
        lastFetchTime = now;
        return priceData;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  },

  // Fetch prices for multiple coins at once
  getPrices: async (symbols) => {
    if (!symbols || symbols.length === 0) return {};

    const coinIds = [...new Set(symbols.map(s => priceService.getCoinId(s)))];
    
    // Check cache
    const now = Date.now();
    if ((now - lastFetchTime) < CACHE_DURATION && coinIds.every(id => priceCache[id])) {
      const result = {};
      symbols.forEach(symbol => {
        const coinId = priceService.getCoinId(symbol);
        result[symbol.toUpperCase()] = priceCache[coinId];
      });
      return result;
    }

    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }

      const data = await response.json();
      
      // Update cache and build result
      const result = {};
      symbols.forEach(symbol => {
        const coinId = priceService.getCoinId(symbol);
        if (data[coinId]) {
          const priceData = {
            price: data[coinId].usd,
            change24h: data[coinId].usd_24h_change,
          };
          priceCache[coinId] = priceData;
          result[symbol.toUpperCase()] = priceData;
        }
      });
      
      lastFetchTime = now;
      return result;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return {};
    }
  },

  // Clear cache (useful for manual refresh)
  clearCache: () => {
    priceCache = {};
    lastFetchTime = 0;
  },

  // Get list of supported coins
  getSupportedCoins: () => Object.keys(COIN_ID_MAP),
};

export default priceService;
