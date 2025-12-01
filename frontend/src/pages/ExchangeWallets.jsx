import { useState, useEffect } from 'react';
import { walletService } from '../services/api';

function ExchangeWallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [formData, setFormData] = useState({
    exchangeName: '',
    totalBalance: '',
    notes: '',
  });

  const exchanges = ['LBank', 'Aster', 'Gate.io', 'Binance', 'Bybit', 'OKX', 'Bitget', 'KuCoin', 'MEXC'];

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const data = await walletService.getAllWalletSummaries();
      setWallets(data);
    } catch (err) {
      console.error('Failed to fetch wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const walletData = {
        exchangeName: formData.exchangeName,
        totalBalance: parseFloat(formData.totalBalance),
        notes: formData.notes || null,
      };

      if (editingWallet) {
        await walletService.updateWallet(editingWallet.id, walletData);
      } else {
        await walletService.createWallet(walletData);
      }

      setFormData({ exchangeName: '', totalBalance: '', notes: '' });
      setShowAddForm(false);
      setEditingWallet(null);
      fetchWallets();
    } catch (err) {
      alert('Failed to save wallet');
      console.error(err);
    }
  };

  const handleEdit = (wallet) => {
    setEditingWallet(wallet);
    setFormData({
      exchangeName: wallet.exchangeName,
      totalBalance: wallet.totalBalance,
      notes: wallet.notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this wallet?')) {
      try {
        await walletService.deleteWallet(id);
        fetchWallets();
      } catch (err) {
        alert('Failed to delete wallet');
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ exchangeName: '', totalBalance: '', notes: '' });
    setShowAddForm(false);
    setEditingWallet(null);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Calculate totals
  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.totalBalance || 0), 0);
  const totalUsed = wallets.reduce((sum, w) => sum + parseFloat(w.usedBalance || 0), 0);
  const totalAvailable = wallets.reduce((sum, w) => sum + parseFloat(w.availableBalance || 0), 0);

  if (loading) {
    return <div className="loading">Loading wallets...</div>;
  }

  return (
    <div className="wallets-page">
      <div className="page-header">
        <h2>💼 Exchange Wallets</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="btn btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Wallet'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ border: '2px solid #4ade80' }}>
          <h3>💰 Total Balance</h3>
          <div className="value neutral" style={{ fontSize: '1.5rem' }}>
            {formatCurrency(totalBalance)}
          </div>
          <small style={{ color: '#888' }}>Across all exchanges</small>
        </div>
        <div className="stat-card" style={{ border: '2px solid #f472b6' }}>
          <h3>📊 In Positions</h3>
          <div className="value negative" style={{ fontSize: '1.5rem' }}>
            {formatCurrency(totalUsed)}
          </div>
          <small style={{ color: '#888' }}>Currently in trades</small>
        </div>
        <div className="stat-card" style={{ border: '2px solid #60a5fa' }}>
          <h3>✨ Available</h3>
          <div className="value positive" style={{ fontSize: '1.5rem' }}>
            {formatCurrency(totalAvailable)}
          </div>
          <small style={{ color: '#888' }}>Ready to trade</small>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="form-card" style={{ marginBottom: '2rem' }}>
          <h3>{editingWallet ? 'Edit Wallet' : 'Add New Wallet'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Exchange *</label>
                <select
                  name="exchangeName"
                  value={formData.exchangeName}
                  onChange={handleChange}
                  required
                  disabled={editingWallet}
                >
                  <option value="">Select Exchange</option>
                  {exchanges.map(ex => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Total Balance (USDT) *</label>
                <input
                  type="number"
                  name="totalBalance"
                  value={formData.totalBalance}
                  onChange={handleChange}
                  placeholder="e.g., 100"
                  step="any"
                  min="0"
                  required
                />
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingWallet ? 'Save Changes' : 'Add Wallet'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Wallets List */}
      {wallets.length === 0 ? (
        <div className="empty-state">
          <h3>No exchange wallets yet</h3>
          <p>Add your exchange balances to track margin and available funds</p>
        </div>
      ) : (
        <div className="wallets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {wallets.map(wallet => (
            <div key={wallet.id} className="stat-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>🏦 {wallet.exchangeName}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleEdit(wallet)} 
                    className="btn btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(wallet.id)} 
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Total Balance:</span>
                  <span style={{ fontWeight: 'bold' }}>{formatCurrency(wallet.totalBalance)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>In Positions:</span>
                  <span style={{ color: '#f472b6' }}>{formatCurrency(wallet.usedBalance)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Available:</span>
                  <span style={{ color: '#4ade80' }}>{formatCurrency(wallet.availableBalance)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: '#1a1a2e', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    background: 'linear-gradient(90deg, #f472b6, #ef4444)', 
                    height: '100%', 
                    width: `${(wallet.usedBalance / wallet.totalBalance) * 100}%`,
                    transition: 'width 0.3s'
                  }} 
                />
              </div>
              <small style={{ color: '#888', marginTop: '0.5rem', display: 'block' }}>
                {wallet.openTradesCount} open trade{wallet.openTradesCount !== 1 ? 's' : ''}
              </small>

              {wallet.notes && (
                <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  {wallet.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExchangeWallets;
