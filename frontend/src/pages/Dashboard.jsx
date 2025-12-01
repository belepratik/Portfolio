import { useState, useEffect } from 'react';
import { tradeService } from '../services/api';
import { priceService } from '../services/priceService';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trades, setTrades] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch live prices when trades are loaded
  useEffect(() => {
    if (trades.length > 0) {
      fetchLivePrices();
      const interval = setInterval(fetchLivePrices, 30000);
      return () => clearInterval(interval);
    }
  }, [trades]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryData, tradesData] = await Promise.all([
        tradeService.getTradeSummary(),
        tradeService.getAllTrades()
      ]);
      setSummary(summaryData);
      setTrades(tradesData);
    } catch (err) {
      setError('Failed to fetch data. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePrices = async () => {
    try {
      const uniqueCoins = [...new Set(trades.map(t => t.coin))];
      const prices = await priceService.getPrices(uniqueCoins);
      setLivePrices(prices);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch live prices:', err);
    }
  };

  // Calculate live portfolio stats
  const calculateLiveStats = () => {
    const openTrades = trades.filter(t => t.status === 'OPEN');
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    
    let openInvested = 0;
    let closedInvested = 0;
    let unrealizedPnL = 0;
    let openCurrentValue = 0;

    // Calculate open trades
    openTrades.forEach(trade => {
      const positionSize = parseFloat(trade.positionSize) || 0;
      const entryPrice = parseFloat(trade.entryPrice) || 0;
      const leverage = parseInt(trade.leverage) || 1;
      const livePrice = livePrices[trade.coin?.toUpperCase()]?.price || parseFloat(trade.currentPrice) || entryPrice;

      openInvested += positionSize;

      if (entryPrice > 0) {
        // Calculate P&L based on trade type (same logic as TradeList)
        let priceChangePercent;
        if (trade.tradeType === 'LONG') {
          priceChangePercent = (livePrice - entryPrice) / entryPrice;
        } else {
          // SHORT: profit when price drops
          priceChangePercent = (entryPrice - livePrice) / entryPrice;
        }

        // Apply leverage to the price change
        const leveragedChange = priceChangePercent * leverage;
        
        // Current value = position * (1 + leveraged change)
        const tradeCurrentValue = positionSize * (1 + leveragedChange);
        openCurrentValue += tradeCurrentValue;
        
        // P&L = current value - invested
        const tradePnL = tradeCurrentValue - positionSize;
        unrealizedPnL += tradePnL;
      } else {
        openCurrentValue += positionSize;
      }
    });

    // Calculate realized P&L from closed trades
    let realizedPnL = 0;
    closedTrades.forEach(trade => {
      const positionSize = parseFloat(trade.positionSize) || 0;
      const entryPrice = parseFloat(trade.entryPrice) || 0;
      const exitPrice = parseFloat(trade.exitPrice) || entryPrice;
      const leverage = parseInt(trade.leverage) || 1;

      closedInvested += positionSize;

      if (entryPrice > 0 && exitPrice > 0) {
        let priceChangePercent;
        if (trade.tradeType === 'LONG') {
          priceChangePercent = (exitPrice - entryPrice) / entryPrice;
        } else {
          priceChangePercent = (entryPrice - exitPrice) / entryPrice;
        }
        const leveragedChange = priceChangePercent * leverage;
        const tradePnL = positionSize * leveragedChange;
        realizedPnL += tradePnL;
      }
    });

    const totalInvested = openInvested + closedInvested;
    // Current portfolio = open positions current value + closed positions (invested + P&L)
    const currentValue = openCurrentValue + closedInvested + realizedPnL;

    return {
      totalInvested,
      unrealizedPnL,
      currentValue,
      realizedPnL,
      openInvested,
      closedInvested
    };
  };

  const liveStats = trades.length > 0 ? calculateLiveStats() : null;

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0.00';
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${parseFloat(value).toFixed(2)}%`;
  };

  const getValueClass = (value) => {
    if (value === null || value === undefined) return 'neutral';
    const num = parseFloat(value);
    if (num > 0) return 'positive';
    if (num < 0) return 'negative';
    return 'neutral';
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <p className="loss">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Track your futures trading performance</p>
        {lastUpdated && (
          <small style={{ color: '#888' }}>
            Live prices updated: {lastUpdated.toLocaleTimeString()}
            <button onClick={fetchLivePrices} style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} className="btn btn-secondary">
              🔄 Refresh
            </button>
          </small>
        )}
      </div>

      {/* Portfolio Overview - Main Stats */}
      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '2px solid #4ade80' }}>
          <h3>💰 Total Invested</h3>
          <div className="value neutral" style={{ fontSize: '1.8rem' }}>
            {formatCurrency(liveStats?.totalInvested ?? summary?.totalInvested)}
          </div>
          <small style={{ color: '#888' }}>All positions (open + closed)</small>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '2px solid #60a5fa' }}>
          <h3>📊 Current Portfolio Value</h3>
          <div className={`value ${getValueClass((liveStats?.currentValue ?? parseFloat(summary?.currentPortfolioValue)) - (liveStats?.totalInvested ?? parseFloat(summary?.totalInvested)))}`} style={{ fontSize: '1.8rem' }}>
            {formatCurrency(liveStats?.currentValue ?? summary?.currentPortfolioValue)}
          </div>
          <small style={{ color: '#888' }}>Open positions + realized gains</small>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '2px solid #f472b6' }}>
          <h3>📈 Unrealized P&L</h3>
          <div className={`value ${getValueClass(liveStats?.unrealizedPnL ?? summary?.unrealizedPnL)}`} style={{ fontSize: '1.8rem' }}>
            {formatCurrency(liveStats?.unrealizedPnL ?? summary?.unrealizedPnL)}
          </div>
          <small style={{ color: '#888' }}>Open trades P&L (Live)</small>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '2px solid #fbbf24' }}>
          <h3>✅ Realized P&L</h3>
          <div className={`value ${getValueClass(liveStats?.realizedPnL ?? summary?.realizedPnL)}`} style={{ fontSize: '1.8rem' }}>
            {formatCurrency(liveStats?.realizedPnL ?? summary?.realizedPnL)}
          </div>
          <small style={{ color: '#888' }}>Closed trades P&L</small>
        </div>
      </div>

      {/* P&L Breakdown */}
      <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#fff' }}>📅 P&L Breakdown</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total P&L</h3>
          <div className={`value ${getValueClass(summary?.totalProfitLoss)}`}>
            {formatCurrency(summary?.totalProfitLoss)}
          </div>
        </div>

        <div className="stat-card">
          <h3>Today's P&L</h3>
          <div className={`value ${getValueClass(summary?.todayProfitLoss)}`}>
            {formatCurrency(summary?.todayProfitLoss)}
          </div>
        </div>

        <div className="stat-card">
          <h3>This Week</h3>
          <div className={`value ${getValueClass(summary?.weekProfitLoss)}`}>
            {formatCurrency(summary?.weekProfitLoss)}
          </div>
        </div>

        <div className="stat-card">
          <h3>This Month</h3>
          <div className={`value ${getValueClass(summary?.monthProfitLoss)}`}>
            {formatCurrency(summary?.monthProfitLoss)}
          </div>
        </div>
      </div>

      {/* Trade Statistics */}
      <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#fff' }}>📊 Trade Statistics</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Win Rate</h3>
          <div className={`value ${parseFloat(summary?.winRate) >= 50 ? 'positive' : 'negative'}`}>
            {formatPercentage(summary?.winRate)}
          </div>
        </div>

        <div className="stat-card">
          <h3>Total Trades</h3>
          <div className="value neutral">
            {summary?.totalTrades || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Open Trades</h3>
          <div className="value neutral">
            {summary?.openTrades || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Closed Trades</h3>
          <div className="value neutral">
            {summary?.closedTrades || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Winning Trades</h3>
          <div className="value positive">
            {summary?.winningTrades || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Losing Trades</h3>
          <div className="value negative">
            {summary?.losingTrades || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Avg. Profit</h3>
          <div className="value positive">
            {formatCurrency(summary?.averageProfit)}
          </div>
        </div>

        <div className="stat-card">
          <h3>Avg. Loss</h3>
          <div className="value negative">
            {formatCurrency(summary?.averageLoss)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
