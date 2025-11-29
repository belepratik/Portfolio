import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tradeService } from '../services/api';
import { priceService } from '../services/priceService';

function AddTrade() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    coin: '',
    tradeType: 'LONG',
    entryPrice: '',
    exitPrice: '',
    currentPrice: '',
    positionSize: '',
    leverage: '10',
    fees: '',
    exchange: '',
    status: 'OPEN',
    notes: '',
    tradeDate: new Date().toISOString().slice(0, 16),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fetch live price for the entered coin
  const fetchCurrentPrice = async () => {
    if (!formData.coin) return;
    
    setFetchingPrice(true);
    try {
      const priceData = await priceService.getPrice(formData.coin);
      if (priceData && priceData.price) {
        setFormData(prev => ({
          ...prev,
          currentPrice: priceData.price.toString(),
          // Also set entry price if empty
          entryPrice: prev.entryPrice || priceData.price.toString(),
        }));
      } else {
        alert(`Could not find price for ${formData.coin}. Please enter manually.`);
      }
    } catch (err) {
      console.error('Failed to fetch price:', err);
      alert('Failed to fetch price. Please enter manually.');
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Calculate quantity from position size and entry price
      const quantity = formData.positionSize && formData.entryPrice 
        ? parseFloat(formData.positionSize) / parseFloat(formData.entryPrice) 
        : 0;

      const tradeData = {
        coin: formData.coin.toUpperCase(),
        tradeType: formData.tradeType,
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
        currentPrice: formData.currentPrice ? parseFloat(formData.currentPrice) : null,
        quantity: quantity,
        positionSize: parseFloat(formData.positionSize),
        leverage: parseInt(formData.leverage),
        fees: formData.fees ? parseFloat(formData.fees) : null,
        exchange: formData.exchange || null,
        status: formData.status,
        notes: formData.notes || null,
        tradeDate: formData.tradeDate,
        closeDate: formData.status === 'CLOSED' ? new Date().toISOString() : null,
      };

      await tradeService.createTrade(tradeData);
      navigate('/trades');
    } catch (err) {
      setError('Failed to create trade. Please check your inputs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const popularCoins = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT', 'MATIC'];
  const exchanges = ['Binance', 'Bybit', 'OKX', 'Bitget', 'KuCoin', 'Gate.io', 'MEXC', 'Aster', 'LBank'];

  return (
    <div className="form-page">
      <div className="form-card">
        <h2>Add New Trade</h2>

        {error && <p className="loss" style={{ marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="coin">Coin *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  id="coin"
                  name="coin"
                  value={formData.coin}
                  onChange={handleChange}
                  placeholder="e.g., BTC, ETH, SOL"
                  list="coins-list"
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={fetchCurrentPrice}
                  className="btn btn-secondary"
                  disabled={fetchingPrice || !formData.coin}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  {fetchingPrice ? '...' : '📈 Get Price'}
                </button>
              </div>
              <datalist id="coins-list">
                {popularCoins.map((coin) => (
                  <option key={coin} value={coin} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label htmlFor="tradeType">Trade Type *</label>
              <select
                id="tradeType"
                name="tradeType"
                value={formData.tradeType}
                onChange={handleChange}
                required
              >
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="entryPrice">Entry Price (USDT) *</label>
              <input
                type="number"
                id="entryPrice"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleChange}
                placeholder="0.00"
                step="any"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="exitPrice">Exit Price (USDT)</label>
              <input
                type="number"
                id="exitPrice"
                name="exitPrice"
                value={formData.exitPrice}
                onChange={handleChange}
                placeholder="Leave empty if trade is open"
                step="any"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="currentPrice">Current Price (USDT)</label>
              <input
                type="number"
                id="currentPrice"
                name="currentPrice"
                value={formData.currentPrice}
                onChange={handleChange}
                placeholder="Live market price"
                step="any"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="positionSize">Position Size (USDT) *</label>
              <input
                type="number"
                id="positionSize"
                name="positionSize"
                value={formData.positionSize}
                onChange={handleChange}
                placeholder="e.g., 100"
                step="any"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="leverage">Leverage *</label>
              <input
                type="number"
                id="leverage"
                name="leverage"
                value={formData.leverage}
                onChange={handleChange}
                placeholder="e.g., 10, 26, 50"
                min="1"
                max="200"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="exchange">Exchange</label>
              <select
                id="exchange"
                name="exchange"
                value={formData.exchange}
                onChange={handleChange}
              >
                <option value="">Select Exchange</option>
                {exchanges.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fees">Fees (USDT)</label>
              <input
                type="number"
                id="fees"
                name="fees"
                value={formData.fees}
                onChange={handleChange}
                placeholder="Trading + Funding fees"
                step="any"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tradeDate">Trade Date *</label>
              <input
                type="datetime-local"
                id="tradeDate"
                name="tradeDate"
                value={formData.tradeDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any notes about this trade (strategy, reason for entry, etc.)"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Trade'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/trades')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTrade;
