import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tradeService } from '../services/api';
import { priceService } from '../services/priceService';

function TradeList() {
  const [trades, setTrades] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  // Fetch live prices when trades change
  useEffect(() => {
    if (trades.length > 0) {
      fetchLivePrices();
      // Auto-refresh prices every 30 seconds
      const interval = setInterval(fetchLivePrices, 30000);
      return () => clearInterval(interval);
    }
  }, [trades]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const data = await tradeService.getAllTrades();
      // Sort by date - newest first
      const sortedData = data.sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate));
      setTrades(sortedData);
    } catch (err) {
      setError('Failed to fetch trades. Make sure the backend is running.');
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

  const handleRefreshPrices = () => {
    priceService.clearCache();
    fetchLivePrices();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trade? This will recalculate all portfolio stats.')) {
      try {
        await tradeService.deleteTrade(id);
        // Refresh all trades to get updated stats
        await fetchTrades();
      } catch (err) {
        alert('Failed to delete trade: ' + (err.response?.data?.message || err.message));
        console.error(err);
      }
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Calculate current value based on price movement and leverage
  const calculateCurrentValue = (trade, livePrice) => {
    if (!trade.positionSize || !trade.entryPrice) return null;
    
    // Use live price first, then exit price (if closed), then stored current price, then entry price
    const currentPrice = livePrice || trade.exitPrice || trade.currentPrice || trade.entryPrice;
    const priceChange = trade.tradeType === 'LONG' 
      ? (currentPrice - trade.entryPrice) / trade.entryPrice
      : (trade.entryPrice - currentPrice) / trade.entryPrice;
    
    const leveragedChange = priceChange * trade.leverage;
    return trade.positionSize * (1 + leveragedChange);
  };

  // Get live price for a coin
  const getLivePrice = (coin) => {
    return livePrices[coin?.toUpperCase()]?.price || null;
  };

  // Get 24h change for a coin
  const get24hChange = (coin) => {
    return livePrices[coin?.toUpperCase()]?.change24h || null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading">Loading trades...</div>;
  }

  return (
    <div className="trade-list-page">
      <div className="page-header">
        <h2>All Trades</h2>
        <div className="header-actions">
          {lastUpdated && (
            <span className="text-secondary" style={{ fontSize: '0.75rem', marginRight: '1rem' }}>
              Prices updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={handleRefreshPrices} className="btn btn-secondary">
            🔄 Refresh Prices
          </button>
          <Link to="/add-trade" className="btn btn-primary">
            + Add New Trade
          </Link>
        </div>
      </div>

      {error && <p className="loss">{error}</p>}

      {trades.length === 0 ? (
        <div className="empty-state">
          <h3>No trades yet</h3>
          <p>Start by adding your first trade!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="trades-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Coin</th>
                <th>Type</th>
                <th>Exchange</th>
                <th>Entry</th>
                <th>Current Price</th>
                <th>Principal</th>
                <th>Current Value</th>
                <th>P&L</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const livePrice = getLivePrice(trade.coin);
                const change24h = get24hChange(trade.coin);
                const displayPrice = trade.status === 'CLOSED' ? trade.exitPrice : (livePrice || trade.currentPrice);
                const currentValue = calculateCurrentValue(trade, displayPrice);
                const pnl = currentValue ? currentValue - trade.positionSize : null;
                
                return (
                  <tr key={trade.id}>
                    <td>{formatDate(trade.tradeDate)}</td>
                    <td><strong>{trade.coin}</strong></td>
                    <td>
                      <span className={`badge ${trade.tradeType?.toLowerCase()}`}>
                        {trade.tradeType}
                      </span>
                    </td>
                    <td>{trade.exchange || '-'}</td>
                    <td>{formatCurrency(trade.entryPrice)}</td>
                    <td>
                      {displayPrice ? (
                        <div>
                          <span>{formatCurrency(displayPrice)}</span>
                          {change24h && trade.status === 'OPEN' && (
                            <div style={{ fontSize: '0.7rem' }} className={change24h >= 0 ? 'profit' : 'loss'}>
                              {change24h >= 0 ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
                            </div>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td>{formatCurrency(trade.positionSize)}</td>
                    <td className={currentValue > trade.positionSize ? 'profit' : currentValue < trade.positionSize ? 'loss' : ''}>
                      {currentValue ? formatCurrency(currentValue) : '-'}
                    </td>
                    <td className={pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : ''}>
                      {pnl !== null ? formatCurrency(pnl) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${trade.status?.toLowerCase()}`}>
                        {trade.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/trade/${trade.id}`} className="btn btn-primary btn-sm">
                          View
                        </Link>
                        {trade.status !== 'CLOSED' ? (
                          <Link to={`/edit-trade/${trade.id}`} className="btn btn-secondary btn-sm">
                            Edit
                          </Link>
                        ) : (
                          <span className="btn btn-secondary btn-sm" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            Edit
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(trade.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TradeList;
