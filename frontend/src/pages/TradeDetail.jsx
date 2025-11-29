import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tradeService, investmentService } from '../services/api';
import { priceService } from '../services/priceService';

function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [livePrice, setLivePrice] = useState(null);
  const [priceChange24h, setPriceChange24h] = useState(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    amount: '',
    priceAtInvestment: '',
    notes: '',
    investmentDate: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  // Fetch live price when trade loads
  useEffect(() => {
    if (trade?.coin) {
      fetchLivePrice();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchLivePrice, 30000);
      return () => clearInterval(interval);
    }
  }, [trade?.coin]);

  const fetchLivePrice = async () => {
    if (!trade?.coin) return;
    try {
      const priceData = await priceService.getPrices([trade.coin]);
      if (priceData[trade.coin]) {
        setLivePrice(priceData[trade.coin].usd);
        setPriceChange24h(priceData[trade.coin].usd_24h_change);
        setLastPriceUpdate(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch live price:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tradeData, investmentsData] = await Promise.all([
        tradeService.getTradeById(id),
        investmentService.getInvestments(id),
      ]);
      setTrade(tradeData);
      setInvestments(investmentsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async (e) => {
    e.preventDefault();
    try {
      const investmentData = {
        amount: parseFloat(newInvestment.amount),
        priceAtInvestment: parseFloat(newInvestment.priceAtInvestment),
        notes: newInvestment.notes || null,
        investmentDate: newInvestment.investmentDate,
      };
      await investmentService.addInvestment(id, investmentData);
      setNewInvestment({
        amount: '',
        priceAtInvestment: '',
        notes: '',
        investmentDate: new Date().toISOString().slice(0, 16),
      });
      setShowAddForm(false);
      fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to add investment');
      console.error(err);
    }
  };

  const handleDeleteInvestment = async (investmentId) => {
    if (window.confirm('Are you sure you want to delete this investment entry?')) {
      try {
        await investmentService.deleteInvestment(id, investmentId);
        fetchData(); // Refresh data
      } catch (err) {
        alert('Failed to delete investment');
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

  // Calculate totals - use live price if available
  const currentPrice = livePrice || trade?.currentPrice || trade?.entryPrice;
  const entryPrice = parseFloat(trade?.entryPrice) || 0;
  const positionSize = parseFloat(trade?.positionSize) || 0;
  const leverage = parseInt(trade?.leverage) || 1;
  
  // If no investments recorded, use the trade's position size
  const hasInvestments = investments.length > 0;
  
  // Calculate current value based on live price for each investment
  const calculateInvestmentCurrentValue = (investment) => {
    if (!currentPrice || !investment.priceAtInvestment) return parseFloat(investment.amount || 0);
    const quantity = parseFloat(investment.amount) / parseFloat(investment.priceAtInvestment);
    return quantity * currentPrice;
  };
  
  // Calculate trade-level P&L (with leverage, like TradeList)
  const calculateTradePnL = () => {
    if (!entryPrice || !currentPrice) return { currentValue: positionSize, pnl: 0 };
    
    let priceChangePercent;
    if (trade?.tradeType === 'LONG') {
      priceChangePercent = (currentPrice - entryPrice) / entryPrice;
    } else {
      // SHORT: profit when price drops
      priceChangePercent = (entryPrice - currentPrice) / entryPrice;
    }
    
    const leveragedChange = priceChangePercent * leverage;
    const currentValue = positionSize * (1 + leveragedChange);
    const pnl = currentValue - positionSize;
    
    return { currentValue, pnl };
  };
  
  // Use investments if available, otherwise use trade position
  let totalInvested, totalCurrentValue, totalPnL;
  
  if (hasInvestments) {
    totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    totalCurrentValue = investments.reduce((sum, inv) => sum + calculateInvestmentCurrentValue(inv), 0);
    totalPnL = totalCurrentValue - totalInvested;
  } else {
    // Use trade's position size and calculate with leverage
    totalInvested = positionSize;
    const tradePnL = calculateTradePnL();
    totalCurrentValue = tradePnL.currentValue;
    totalPnL = tradePnL.pnl;
  }
  
  const pnlPercent = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;

  if (loading) {
    return <div className="loading">Loading trade details...</div>;
  }

  if (!trade) {
    return <div className="loading">Trade not found</div>;
  }

  return (
    <div className="trade-detail-page">
      <div className="page-header">
        <div>
          <h2>{trade.coin} - {trade.tradeType}</h2>
          <p className="text-secondary">
            Opened: {formatDate(trade.tradeDate)} | Status: <span className={`badge ${trade.status?.toLowerCase()}`}>{trade.status}</span>
          </p>
        </div>
        <div className="header-actions">
          <Link to={`/edit-trade/${id}`} className="btn btn-secondary">Edit Trade</Link>
          <button onClick={() => navigate('/trades')} className="btn btn-secondary">Back to Trades</button>
        </div>
      </div>

      {/* Trade Summary */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <h3>Entry Price</h3>
          <div className="value neutral">{formatCurrency(trade.entryPrice)}</div>
        </div>
        <div className="stat-card">
          <h3>
            Live Price 
            <button 
              onClick={fetchLivePrice} 
              style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
              className="btn btn-secondary"
            >
              🔄
            </button>
          </h3>
          <div className={`value ${priceChange24h > 0 ? 'positive' : priceChange24h < 0 ? 'negative' : 'neutral'}`}>
            {livePrice ? formatCurrency(livePrice) : (trade.currentPrice ? formatCurrency(trade.currentPrice) : '-')}
            {priceChange24h && (
              <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                ({priceChange24h > 0 ? '+' : ''}{priceChange24h.toFixed(2)}%)
              </span>
            )}
          </div>
          {lastPriceUpdate && (
            <small style={{ color: '#888', fontSize: '0.75rem' }}>
              Updated: {lastPriceUpdate.toLocaleTimeString()}
            </small>
          )}
        </div>
        <div className="stat-card">
          <h3>Total Invested</h3>
          <div className="value neutral">{formatCurrency(totalInvested)}</div>
        </div>
        <div className="stat-card">
          <h3>Current Value</h3>
          <div className={`value ${totalCurrentValue > totalInvested ? 'positive' : totalCurrentValue < totalInvested ? 'negative' : 'neutral'}`}>
            {formatCurrency(totalCurrentValue)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Total P&L</h3>
          <div className={`value ${totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral'}`}>
            {formatCurrency(totalPnL)}
            <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
              ({pnlPercent > 0 ? '+' : ''}{pnlPercent}%)
            </span>
          </div>
        </div>
        <div className="stat-card">
          <h3>Leverage</h3>
          <div className="value neutral">{trade.leverage}x</div>
        </div>
      </div>

      {/* Investment History */}
      <div className="section-header">
        <h3>💰 Investment History</h3>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          {showAddForm ? 'Cancel' : '+ Add Investment'}
        </button>
      </div>

      {/* Add Investment Form */}
      {showAddForm && (
        <div className="form-card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleAddInvestment}>
            <div className="form-grid">
              <div className="form-group">
                <label>Amount (USDT) *</label>
                <input
                  type="number"
                  value={newInvestment.amount}
                  onChange={(e) => setNewInvestment({ ...newInvestment, amount: e.target.value })}
                  placeholder="e.g., 100"
                  step="any"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price at Investment *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={newInvestment.priceAtInvestment}
                    onChange={(e) => setNewInvestment({ ...newInvestment, priceAtInvestment: e.target.value })}
                    placeholder="e.g., 95000"
                    step="any"
                    min="0"
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => livePrice && setNewInvestment({ ...newInvestment, priceAtInvestment: livePrice.toString() })}
                    disabled={!livePrice}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    📈 Use Live
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="datetime-local"
                  value={newInvestment.investmentDate}
                  onChange={(e) => setNewInvestment({ ...newInvestment, investmentDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  value={newInvestment.notes}
                  onChange={(e) => setNewInvestment({ ...newInvestment, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: 'none' }}>
              <button type="submit" className="btn btn-primary">Add Investment</button>
            </div>
          </form>
        </div>
      )}

      {/* Investment List */}
      {investments.length === 0 ? (
        <div className="empty-state">
          <h3>No investments recorded yet</h3>
          <p>Click "Add Investment" to track your investments in this position</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="trades-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount Invested</th>
                <th>Price at Entry</th>
                <th>Current Value</th>
                <th>P&L</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => {
                const invCurrentValue = calculateInvestmentCurrentValue(inv);
                const invPnL = invCurrentValue - parseFloat(inv.amount || 0);
                return (
                  <tr key={inv.id}>
                    <td>{formatDate(inv.investmentDate)}</td>
                    <td>{formatCurrency(inv.amount)}</td>
                    <td>{formatCurrency(inv.priceAtInvestment)}</td>
                    <td className={invCurrentValue > inv.amount ? 'profit' : invCurrentValue < inv.amount ? 'loss' : ''}>
                      {formatCurrency(invCurrentValue)}
                    </td>
                    <td className={invPnL > 0 ? 'profit' : invPnL < 0 ? 'loss' : ''}>
                      {formatCurrency(invPnL)}
                    </td>
                    <td>{inv.notes || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteInvestment(inv.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
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

export default TradeDetail;
