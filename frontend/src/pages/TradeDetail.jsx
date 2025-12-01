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
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeData, setCloseData] = useState({
    exitPrice: '',
    closeReason: 'MANUAL'
  });
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

  const handleCloseTrade = async (e) => {
    e.preventDefault();
    try {
      await tradeService.closeTrade(id, parseFloat(closeData.exitPrice), closeData.closeReason);
      setShowCloseModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to close trade');
      console.error(err);
    }
  };

  const handleCloseReasonChange = (reason) => {
    setCloseData(prev => {
      let newPrice = prev.exitPrice;
      // Auto-fill price based on reason
      if (reason === 'TP_HIT' && trade?.takeProfit) {
        newPrice = trade.takeProfit;
      } else if (reason === 'LIQUIDATED' && trade?.liquidationPrice) {
        newPrice = trade.liquidationPrice;
      } else if (reason === 'MANUAL' && livePrice) {
        newPrice = livePrice;
      }
      return { ...prev, closeReason: reason, exitPrice: newPrice };
    });
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

  // Get close reason display text
  const getCloseReasonText = (reason) => {
    switch (reason) {
      case 'TP_HIT': return '🎯 TP Hit';
      case 'LIQUIDATED': return '💀 Liquidated';
      case 'MANUAL': return '✋ Manual Close';
      default: return reason || '-';
    }
  };

  // Calculate totals - use live price if available
  const currentPrice = trade?.status === 'CLOSED' ? trade.exitPrice : (livePrice || trade?.currentPrice || trade?.entryPrice);
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
            {trade.status === 'CLOSED' && trade.closeReason && (
              <span style={{ marginLeft: '0.5rem' }}>{getCloseReasonText(trade.closeReason)}</span>
            )}
          </p>
        </div>
        <div className="header-actions">
          {trade.status === 'OPEN' && (
            <button onClick={() => setShowCloseModal(true)} className="btn btn-danger">Close Trade</button>
          )}
          <Link to={`/edit-trade/${id}`} className="btn btn-secondary">Edit Trade</Link>
          <button onClick={() => navigate('/trades')} className="btn btn-secondary">Back to Trades</button>
        </div>
      </div>

      {/* Trade Summary - Row 1 */}
      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat-card">
          <h3>Entry Price</h3>
          <div className="value neutral">{formatCurrency(trade.entryPrice)}</div>
        </div>
        <div className="stat-card">
          <h3>
            {trade.status === 'CLOSED' ? 'Exit Price' : 'Live Price'}
            {trade.status === 'OPEN' && (
              <button 
                onClick={fetchLivePrice} 
                style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                className="btn btn-secondary"
              >
                🔄
              </button>
            )}
          </h3>
          <div className={`value ${priceChange24h > 0 ? 'positive' : priceChange24h < 0 ? 'negative' : 'neutral'}`}>
            {trade.status === 'CLOSED' 
              ? formatCurrency(trade.exitPrice) 
              : (livePrice ? formatCurrency(livePrice) : (trade.currentPrice ? formatCurrency(trade.currentPrice) : '-'))
            }
            {priceChange24h && trade.status === 'OPEN' && (
              <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                ({priceChange24h > 0 ? '+' : ''}{priceChange24h.toFixed(2)}%)
              </span>
            )}
          </div>
          {lastPriceUpdate && trade.status === 'OPEN' && (
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
      </div>

      {/* Trade Summary - Row 2: P&L, Leverage, TP, Liquidation */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
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
        <div className="stat-card">
          <h3>Take Profit {trade.tpHit && <span style={{ color: '#4ade80' }}>✓</span>}</h3>
          <div className={`value ${trade.tpHit ? 'positive' : 'neutral'}`}>
            {trade.takeProfit ? formatCurrency(trade.takeProfit) : '-'}
          </div>
        </div>
        <div className="stat-card">
          <h3>Liquidation {trade.liquidated && <span style={{ color: '#f87171' }}>✗</span>}</h3>
          <div className={`value ${trade.liquidated ? 'negative' : 'neutral'}`}>
            {trade.liquidationPrice ? formatCurrency(trade.liquidationPrice) : '-'}
          </div>
        </div>
      </div>

      {/* Closed Trade Info */}
      {trade.status === 'CLOSED' && (
        <div className="form-card" style={{ marginBottom: '1.5rem', background: 'rgba(100, 100, 100, 0.1)', padding: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>📋 Trade Closed</h4>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <strong>Closed At:</strong> {formatDate(trade.closeDate)}
            </div>
            <div>
              <strong>Exit Price:</strong> {formatCurrency(trade.exitPrice)}
            </div>
            <div>
              <strong>Close Reason:</strong> {getCloseReasonText(trade.closeReason)}
            </div>
            <div>
              <strong>Final P&L:</strong> <span className={totalPnL >= 0 ? 'profit' : 'loss'}>{formatCurrency(totalPnL)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Close Trade Modal */}
      {showCloseModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="form-card" style={{ width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '1rem' }}>Close Trade</h3>
            <form onSubmit={handleCloseTrade}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Close Reason</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn ${closeData.closeReason === 'TP_HIT' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleCloseReasonChange('TP_HIT')}
                    disabled={!trade.takeProfit}
                    style={{ flex: 1 }}
                  >
                    🎯 TP Hit
                  </button>
                  <button
                    type="button"
                    className={`btn ${closeData.closeReason === 'LIQUIDATED' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => handleCloseReasonChange('LIQUIDATED')}
                    disabled={!trade.liquidationPrice}
                    style={{ flex: 1 }}
                  >
                    💀 Liquidated
                  </button>
                  <button
                    type="button"
                    className={`btn ${closeData.closeReason === 'MANUAL' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleCloseReasonChange('MANUAL')}
                    style={{ flex: 1 }}
                  >
                    ✋ Manual
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Exit Price</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={closeData.exitPrice}
                    onChange={(e) => setCloseData({ ...closeData, exitPrice: e.target.value })}
                    placeholder="Exit price"
                    step="any"
                    min="0"
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => livePrice && setCloseData({ ...closeData, exitPrice: livePrice })}
                    disabled={!livePrice}
                  >
                    📈 Live
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCloseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Close Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
