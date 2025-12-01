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
  
  // Close modal states
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingTrade, setClosingTrade] = useState(null);
  const [closeReason, setCloseReason] = useState('MANUAL');
  const [exitPrice, setExitPrice] = useState('');
  const [closing, setClosing] = useState(false);
  
  // "What if still open" tooltip state
  const [whatIfTradeId, setWhatIfTradeId] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCoin, setFilterCoin] = useState('');
  const [filterExchange, setFilterExchange] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Sort states
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

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

  // Open close modal
  const openCloseModal = (trade) => {
    setClosingTrade(trade);
    setCloseReason('MANUAL');
    // Default to live price or current price
    const livePrice = getLivePrice(trade.coin);
    setExitPrice(livePrice || trade.currentPrice || '');
    setShowCloseModal(true);
  };

  // Handle close reason change - auto-fill exit price
  const handleCloseReasonChange = (reason) => {
    setCloseReason(reason);
    if (!closingTrade) return;
    
    if (reason === 'TP_HIT' && closingTrade.takeProfit) {
      setExitPrice(closingTrade.takeProfit);
    } else if (reason === 'LIQUIDATED' && closingTrade.liquidationPrice) {
      setExitPrice(closingTrade.liquidationPrice);
    } else {
      // Manual - use live price
      const livePrice = getLivePrice(closingTrade.coin);
      setExitPrice(livePrice || closingTrade.currentPrice || '');
    }
  };

  // Calculate preview P&L for close modal
  const calculatePreviewPnL = () => {
    if (!closingTrade || !exitPrice) return null;
    
    const exit = parseFloat(exitPrice);
    const entry = parseFloat(closingTrade.entryPrice);
    const size = parseFloat(closingTrade.positionSize);
    const leverage = closingTrade.leverage || 1;
    
    if (!exit || !entry || !size) return null;
    
    const priceChange = closingTrade.tradeType === 'LONG'
      ? (exit - entry) / entry
      : (entry - exit) / entry;
    
    const leveragedChange = priceChange * leverage;
    return size * leveragedChange;
  };

  // Handle close trade submission
  const handleCloseTrade = async () => {
    if (!closingTrade || !exitPrice) return;
    
    setClosing(true);
    try {
      await tradeService.closeTrade(closingTrade.id, parseFloat(exitPrice), closeReason);
      setShowCloseModal(false);
      setClosingTrade(null);
      await fetchTrades();
    } catch (err) {
      alert('Failed to close trade: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setClosing(false);
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

  // Format price compactly (no $ sign, shorter)
  const formatPrice = (value) => {
    if (value === null || value === undefined) return '-';
    if (value >= 1000) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  // Get close reason display text
  const getCloseReasonText = (reason) => {
    switch (reason) {
      case 'TP_HIT': return '🎯 TP';
      case 'LIQUIDATED': return '💀 Liq';
      case 'MANUAL': return '✋';
      default: return '';
    }
  };

  // Calculate "What if still open" P&L for closed trades
  const calculateWhatIfPnL = (trade) => {
    const livePrice = getLivePrice(trade.coin);
    if (!livePrice || !trade.entryPrice || !trade.positionSize) return null;
    
    const priceChange = trade.tradeType === 'LONG'
      ? (livePrice - trade.entryPrice) / trade.entryPrice
      : (trade.entryPrice - livePrice) / trade.entryPrice;
    
    const leveragedChange = priceChange * (trade.leverage || 1);
    return trade.positionSize * leveragedChange;
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

  // Get unique values for filter dropdowns
  const uniqueCoins = [...new Set(trades.map(t => t.coin))].sort();
  const uniqueExchanges = [...new Set(trades.map(t => t.exchange).filter(Boolean))].sort();

  // Filter trades based on all criteria
  const filteredTrades = trades.filter(trade => {
    // Search term - searches coin, exchange, notes
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesCoin = trade.coin?.toLowerCase().includes(search);
      const matchesExchange = trade.exchange?.toLowerCase().includes(search);
      const matchesNotes = trade.notes?.toLowerCase().includes(search);
      if (!matchesCoin && !matchesExchange && !matchesNotes) return false;
    }
    
    // Filter by coin
    if (filterCoin && trade.coin !== filterCoin) return false;
    
    // Filter by exchange
    if (filterExchange && trade.exchange !== filterExchange) return false;
    
    // Filter by status
    if (filterStatus && trade.status !== filterStatus) return false;
    
    // Filter by type (LONG/SHORT)
    if (filterType && trade.tradeType !== filterType) return false;
    
    // Filter by date range
    if (filterDateFrom) {
      const tradeDate = new Date(trade.tradeDate);
      const fromDate = new Date(filterDateFrom);
      if (tradeDate < fromDate) return false;
    }
    
    if (filterDateTo) {
      const tradeDate = new Date(trade.tradeDate);
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      if (tradeDate > toDate) return false;
    }
    
    return true;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCoin('');
    setFilterExchange('');
    setFilterStatus('');
    setFilterType('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || filterCoin || filterExchange || filterStatus || filterType || filterDateFrom || filterDateTo;

  // Sort filtered trades
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'date':
        aVal = new Date(a.tradeDate);
        bVal = new Date(b.tradeDate);
        break;
      case 'coin':
        aVal = a.coin?.toLowerCase() || '';
        bVal = b.coin?.toLowerCase() || '';
        break;
      case 'exchange':
        aVal = a.exchange?.toLowerCase() || '';
        bVal = b.exchange?.toLowerCase() || '';
        break;
      case 'leverage':
        aVal = a.leverage || 0;
        bVal = b.leverage || 0;
        break;
      case 'size':
        aVal = parseFloat(a.positionSize) || 0;
        bVal = parseFloat(b.positionSize) || 0;
        break;
      case 'pnl':
        const aPrice = getLivePrice(a.coin) || a.exitPrice || a.currentPrice || a.entryPrice;
        const bPrice = getLivePrice(b.coin) || b.exitPrice || b.currentPrice || b.entryPrice;
        const aValue = calculateCurrentValue(a, aPrice);
        const bValue = calculateCurrentValue(b, bPrice);
        aVal = aValue ? aValue - a.positionSize : 0;
        bVal = bValue ? bValue - b.positionSize : 0;
        break;
      case 'entry':
        aVal = parseFloat(a.entryPrice) || 0;
        bVal = parseFloat(b.entryPrice) || 0;
        break;
      default:
        aVal = new Date(a.tradeDate);
        bVal = new Date(b.tradeDate);
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Get sort indicator
  const getSortIndicator = (column) => {
    if (sortBy !== column) return '';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
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

      {/* Search and Filter Bar */}
      <div className="filter-bar" style={{ 
        background: 'rgba(255,255,255,0.05)', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '1rem' 
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <input
              type="text"
              placeholder="🔍 Search coin, exchange, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: '1px solid #444',
                background: '#2a2a2a',
                color: '#fff'
              }}
            />
          </div>
          
          {/* Quick Filters */}
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', background: '#2a2a2a', color: '#fff', border: '1px solid #444' }}
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', background: '#2a2a2a', color: '#fff', border: '1px solid #444' }}
          >
            <option value="">All Types</option>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
          
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            🎛️ {showFilters ? 'Hide' : 'More'} Filters
            {hasActiveFilters && <span style={{ 
              background: '#4ade80', 
              color: '#000', 
              borderRadius: '50%', 
              width: '18px', 
              height: '18px', 
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>✓</span>}
          </button>
          
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn btn-danger" style={{ padding: '0.5rem 0.75rem' }}>
              ✕ Clear
            </button>
          )}
        </div>
        
        {/* Extended Filters */}
        {showFilters && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '0.75rem', 
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #444'
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '0.25rem' }}>Coin</label>
              <select 
                value={filterCoin} 
                onChange={(e) => setFilterCoin(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#2a2a2a', color: '#fff', border: '1px solid #444' }}
              >
                <option value="">All Coins</option>
                {uniqueCoins.map(coin => (
                  <option key={coin} value={coin}>{coin}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '0.25rem' }}>Exchange</label>
              <select 
                value={filterExchange} 
                onChange={(e) => setFilterExchange(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#2a2a2a', color: '#fff', border: '1px solid #444' }}
              >
                <option value="">All Exchanges</option>
                {uniqueExchanges.map(exchange => (
                  <option key={exchange} value={exchange}>{exchange}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '0.25rem' }}>From Date</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#2a2a2a', color: '#fff', border: '1px solid #444' }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '0.25rem' }}>To Date</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#2a2a2a', color: '#fff', border: '1px solid #444' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Price Ticker */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1rem',
        padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <span style={{ color: '#888', fontSize: '0.85rem', fontWeight: '500' }}>Live Prices:</span>
        {['BTC', 'ETH', 'SOL'].map(coin => {
          const price = livePrices[coin]?.price;
          const change = livePrices[coin]?.change24h;
          return (
            <div key={coin} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.4rem 0.75rem',
              background: '#1a1a2e',
              borderRadius: '6px',
              border: '1px solid #333'
            }}>
              <span style={{ fontWeight: '600', color: '#fff' }}>{coin}</span>
              <span style={{ color: '#4ade80', fontWeight: '500' }}>
                {price ? `$${price.toLocaleString('en-US', { maximumFractionDigits: price > 100 ? 0 : 2 })}` : '...'}
              </span>
              {change !== null && change !== undefined && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: change >= 0 ? '#4ade80' : '#f87171',
                  fontWeight: '500'
                }}>
                  {change >= 0 ? '▲' : '▼'}{Math.abs(change).toFixed(2)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
          Showing {filteredTrades.length} of {trades.length} trades
        </div>
      )}

      {error && <p className="loss">{error}</p>}

      {trades.length === 0 ? (
        <div className="empty-state">
          <h3>No trades yet</h3>
          <p>Start by adding your first trade!</p>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="empty-state">
          <h3>No trades match your filters</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button onClick={clearFilters} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="trades-table" style={{ minWidth: '1100px' }}>
            <thead>
              <tr>
                <th onClick={() => handleSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Date{getSortIndicator('date')}
                </th>
                <th onClick={() => handleSort('coin')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Coin{getSortIndicator('coin')}
                </th>
                <th>Type</th>
                <th onClick={() => handleSort('exchange')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Exchange{getSortIndicator('exchange')}
                </th>
                <th onClick={() => handleSort('leverage')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Lev{getSortIndicator('leverage')}
                </th>
                <th onClick={() => handleSort('entry')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Entry{getSortIndicator('entry')}
                </th>
                <th>TP</th>
                <th>Liq</th>
                <th onClick={() => handleSort('size')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Size{getSortIndicator('size')}
                </th>
                <th onClick={() => handleSort('pnl')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  P&L{getSortIndicator('pnl')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map((trade) => {
                const livePrice = getLivePrice(trade.coin);
                const displayPrice = trade.status === 'CLOSED' ? trade.exitPrice : (livePrice || trade.currentPrice);
                const currentValue = calculateCurrentValue(trade, displayPrice);
                const pnl = currentValue ? currentValue - trade.positionSize : null;
                
                return (
                  <tr key={trade.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{formatDate(trade.tradeDate)}</td>
                    <td><strong>{trade.coin}</strong></td>
                    <td>
                      <span className={`badge ${trade.tradeType?.toLowerCase()}`}>
                        {trade.tradeType}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{trade.exchange || '-'}</td>
                    <td>{trade.leverage}x</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatPrice(trade.entryPrice)}</td>
                    <td className={trade.tpHit ? 'profit' : ''} style={{ whiteSpace: 'nowrap' }}>
                      {trade.takeProfit ? formatPrice(trade.takeProfit) : '-'}
                      {trade.tpHit && <span style={{ marginLeft: '0.25rem' }}>✓</span>}
                    </td>
                    <td className={trade.liquidated ? 'loss' : ''} style={{ whiteSpace: 'nowrap' }}>
                      {trade.liquidationPrice ? formatPrice(trade.liquidationPrice) : '-'}
                      {trade.liquidated && <span style={{ marginLeft: '0.25rem' }}>✗</span>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>${trade.positionSize}</td>
                    <td className={pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : ''} style={{ whiteSpace: 'nowrap' }}>
                      {pnl !== null ? formatCurrency(pnl) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${trade.status?.toLowerCase()}`}>
                        {trade.status}
                      </span>
                      {trade.status === 'CLOSED' && trade.closeReason && (
                        <div style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                          {getCloseReasonText(trade.closeReason)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons" style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap', alignItems: 'center', position: 'relative' }}>
                        {trade.status === 'OPEN' && (
                          <button
                            onClick={() => openCloseModal(trade)}
                            className="btn btn-sm"
                            style={{ background: '#f59e0b', color: '#000', fontWeight: '600' }}
                          >
                            Close
                          </button>
                        )}
                        {trade.status === 'CLOSED' && getLivePrice(trade.coin) && (
                          <div 
                            style={{ position: 'relative' }}
                            onMouseEnter={() => setWhatIfTradeId(trade.id)}
                            onMouseLeave={() => setWhatIfTradeId(null)}
                          >
                            <button
                              className="btn btn-sm"
                              style={{ 
                                background: '#6366f1', 
                                color: '#fff', 
                                fontWeight: '500',
                                fontSize: '0.7rem',
                                padding: '0.25rem 0.5rem'
                              }}
                              title="What if still open?"
                            >
                              📊 If Open
                            </button>
                            {whatIfTradeId === trade.id && (
                              <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                right: 0,
                                background: '#1e1e2e',
                                border: '1px solid #444',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                zIndex: 100,
                                minWidth: '180px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                whiteSpace: 'nowrap'
                              }}>
                                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
                                  If still open @ ${formatPrice(getLivePrice(trade.coin))}
                                </div>
                                <div style={{ 
                                  fontSize: '1.1rem', 
                                  fontWeight: 'bold',
                                  color: calculateWhatIfPnL(trade) >= 0 ? '#4ade80' : '#f87171'
                                }}>
                                  {calculateWhatIfPnL(trade) >= 0 ? '+' : ''}{formatCurrency(calculateWhatIfPnL(trade))}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.25rem' }}>
                                  vs closed: {formatCurrency(pnl)} ({calculateWhatIfPnL(trade) > pnl ? '📈 missed' : '✅ good exit'})
                                </div>
                                <div style={{ 
                                  fontSize: '0.65rem', 
                                  color: calculateWhatIfPnL(trade) > pnl ? '#f87171' : '#4ade80',
                                  marginTop: '0.25rem'
                                }}>
                                  Diff: {formatCurrency(calculateWhatIfPnL(trade) - pnl)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <Link to={`/trade/${trade.id}`} className="btn btn-primary btn-sm">
                          View
                        </Link>
                        <Link to={`/edit-trade/${trade.id}`} className="btn btn-secondary btn-sm" 
                          style={trade.status === 'CLOSED' ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(trade.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Del
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

      {/* Close Trade Modal */}
      {showCloseModal && closingTrade && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1e1e2e',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '420px',
            border: '1px solid #333'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Close Trade
              <span className={`badge ${closingTrade.tradeType?.toLowerCase()}`} style={{ fontSize: '0.75rem' }}>
                {closingTrade.tradeType}
              </span>
            </h3>
            
            {/* Trade Info */}
            <div style={{ 
              background: '#2a2a3e', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '1rem' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#888' }}>Coin:</span>
                <strong>{closingTrade.coin}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#888' }}>Entry Price:</span>
                <span>${formatPrice(closingTrade.entryPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#888' }}>Position Size:</span>
                <span>${closingTrade.positionSize}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#888' }}>Leverage:</span>
                <span>{closingTrade.leverage}x</span>
              </div>
              {closingTrade.takeProfit && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Take Profit:</span>
                  <span style={{ color: '#4ade80' }}>${formatPrice(closingTrade.takeProfit)}</span>
                </div>
              )}
              {closingTrade.liquidationPrice && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Liquidation:</span>
                  <span style={{ color: '#f87171' }}>${formatPrice(closingTrade.liquidationPrice)}</span>
                </div>
              )}
            </div>
            
            {/* Close Reason Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>
                Close Reason:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleCloseReasonChange('TP_HIT')}
                  disabled={!closingTrade.takeProfit}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: closeReason === 'TP_HIT' ? '2px solid #4ade80' : '1px solid #444',
                    background: closeReason === 'TP_HIT' ? 'rgba(74, 222, 128, 0.1)' : '#2a2a2a',
                    color: !closingTrade.takeProfit ? '#666' : closeReason === 'TP_HIT' ? '#4ade80' : '#fff',
                    cursor: closingTrade.takeProfit ? 'pointer' : 'not-allowed',
                    opacity: closingTrade.takeProfit ? 1 : 0.5
                  }}
                >
                  🎯 TP Hit
                </button>
                <button
                  type="button"
                  onClick={() => handleCloseReasonChange('LIQUIDATED')}
                  disabled={!closingTrade.liquidationPrice}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: closeReason === 'LIQUIDATED' ? '2px solid #f87171' : '1px solid #444',
                    background: closeReason === 'LIQUIDATED' ? 'rgba(248, 113, 113, 0.1)' : '#2a2a2a',
                    color: !closingTrade.liquidationPrice ? '#666' : closeReason === 'LIQUIDATED' ? '#f87171' : '#fff',
                    cursor: closingTrade.liquidationPrice ? 'pointer' : 'not-allowed',
                    opacity: closingTrade.liquidationPrice ? 1 : 0.5
                  }}
                >
                  💀 Liquidated
                </button>
                <button
                  type="button"
                  onClick={() => handleCloseReasonChange('MANUAL')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: closeReason === 'MANUAL' ? '2px solid #60a5fa' : '1px solid #444',
                    background: closeReason === 'MANUAL' ? 'rgba(96, 165, 250, 0.1)' : '#2a2a2a',
                    color: closeReason === 'MANUAL' ? '#60a5fa' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  ✋ Manual
                </button>
              </div>
            </div>
            
            {/* Exit Price */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>
                Exit Price:
              </label>
              <input
                type="number"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                step="0.01"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  background: '#2a2a2a',
                  color: '#fff',
                  fontSize: '1.1rem'
                }}
                placeholder="Enter exit price..."
              />
              {getLivePrice(closingTrade.coin) && (
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                  Live price: ${formatPrice(getLivePrice(closingTrade.coin))}
                </div>
              )}
            </div>
            
            {/* P&L Preview */}
            {exitPrice && (
              <div style={{
                background: calculatePreviewPnL() >= 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                border: `1px solid ${calculatePreviewPnL() >= 0 ? '#4ade80' : '#f87171'}`,
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>
                  Expected P&L
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  color: calculatePreviewPnL() >= 0 ? '#4ade80' : '#f87171'
                }}>
                  {calculatePreviewPnL() >= 0 ? '+' : ''}{formatCurrency(calculatePreviewPnL())}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                  {((calculatePreviewPnL() / closingTrade.positionSize) * 100).toFixed(2)}% ROI
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setClosingTrade(null);
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={closing}
              >
                Cancel
              </button>
              <button
                onClick={handleCloseTrade}
                className="btn"
                style={{ 
                  flex: 1, 
                  background: '#f59e0b', 
                  color: '#000', 
                  fontWeight: '600' 
                }}
                disabled={closing || !exitPrice}
              >
                {closing ? 'Closing...' : 'Confirm Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradeList;
