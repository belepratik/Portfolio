import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tradeService } from '../services/api';
import { priceService } from '../services/priceService';

function EditTrade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    tradeDate: '',
    closeDate: '',
    takeProfit: '',
    liquidationPrice: '',
    tpHit: false,
    liquidated: false,
  });

  useEffect(() => {
    fetchTrade();
  }, [id]);

  const fetchTrade = async () => {
    try {
      setLoading(true);
      const trade = await tradeService.getTradeById(id);
      
      // Redirect if trade is closed - can't edit closed trades
      if (trade.status === 'CLOSED') {
        alert('Closed trades cannot be edited.');
        navigate('/trades');
        return;
      }
      
      setFormData({
        coin: trade.coin || '',
        tradeType: trade.tradeType || 'LONG',
        entryPrice: trade.entryPrice || '',
        exitPrice: trade.exitPrice || '',
        currentPrice: trade.currentPrice || '',
        positionSize: trade.positionSize || '',
        leverage: trade.leverage || '10',
        fees: trade.fees || '',
        exchange: trade.exchange || '',
        status: trade.status || 'OPEN',
        notes: trade.notes || '',
        tradeDate: trade.tradeDate ? trade.tradeDate.slice(0, 16) : '',
        closeDate: trade.closeDate ? trade.closeDate.slice(0, 16) : '',
        takeProfit: trade.takeProfit || '',
        liquidationPrice: trade.liquidationPrice || '',
        tpHit: trade.tpHit || false,
        liquidated: trade.liquidated || false,
      });
    } catch (err) {
      setError('Failed to fetch trade details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
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
        quantity: quantity,
        positionSize: parseFloat(formData.positionSize),
        leverage: parseInt(formData.leverage),
        fees: formData.fees ? parseFloat(formData.fees) : null,
        exchange: formData.exchange || null,
        status: formData.status,
        notes: formData.notes || null,
        tradeDate: formData.tradeDate,
        closeDate: formData.status === 'CLOSED' && !formData.closeDate 
          ? new Date().toISOString() 
          : formData.closeDate || null,
        takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
        liquidationPrice: formData.liquidationPrice ? parseFloat(formData.liquidationPrice) : null,
        tpHit: formData.tpHit,
        liquidated: formData.liquidated,
      };

      await tradeService.updateTrade(id, tradeData);
      navigate('/trades');
    } catch (err) {
      setError('Failed to update trade. Please check your inputs.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const popularCoins = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT', 'MATIC'];
  const exchanges = ['Binance', 'Bybit', 'OKX', 'Bitget', 'KuCoin', 'Gate.io', 'MEXC', 'Aster', 'LBank'];

  const fetchCurrentPrice = async () => {
    if (!formData.coin) {
      setError('Please enter a coin first');
      return;
    }
    
    setFetchingPrice(true);
    setError(null);
    
    try {
      const price = await priceService.getPrice(formData.coin);
      if (price !== null) {
        setFormData((prev) => ({
          ...prev,
          currentPrice: price.toString(),
        }));
      } else {
        setError(`Could not fetch price for ${formData.coin}. Try a different coin symbol.`);
      }
    } catch (err) {
      setError('Failed to fetch price from API');
      console.error(err);
    } finally {
      setFetchingPrice(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading trade details...</div>;
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <h2>Edit Trade</h2>

        {error && <p className="loss" style={{ marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="coin">Coin *</label>
              <input
                type="text"
                id="coin"
                name="coin"
                value={formData.coin}
                onChange={handleChange}
                placeholder="e.g., BTC, ETH, SOL"
                list="coins-list"
                required
              />
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  id="currentPrice"
                  name="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleChange}
                  placeholder="Live market price"
                  step="any"
                  min="0"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={fetchCurrentPrice}
                  disabled={fetchingPrice || !formData.coin}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {fetchingPrice ? '...' : '📈 Get Price'}
                </button>
              </div>
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

            <div className="form-group">
              <label htmlFor="takeProfit">Take Profit (USDT)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  id="takeProfit"
                  name="takeProfit"
                  value={formData.takeProfit}
                  onChange={handleChange}
                  placeholder="TP price"
                  step="any"
                  min="0"
                  style={{ flex: 1 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="tpHit"
                    checked={formData.tpHit}
                    onChange={handleChange}
                  />
                  <span style={{ fontSize: '0.85rem' }}>TP Hit</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="liquidationPrice">Liquidation Price (USDT)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  id="liquidationPrice"
                  name="liquidationPrice"
                  value={formData.liquidationPrice}
                  onChange={handleChange}
                  placeholder="Liq. price"
                  step="any"
                  min="0"
                  style={{ flex: 1 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="liquidated"
                    checked={formData.liquidated}
                    onChange={handleChange}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>Liquidated</span>
                </label>
              </div>
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
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
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

export default EditTrade;
