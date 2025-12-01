import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TradeList from './pages/TradeList'
import AddTrade from './pages/AddTrade'
import EditTrade from './pages/EditTrade'
import TradeDetail from './pages/TradeDetail'
import ExchangeWallets from './pages/ExchangeWallets'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>📊 Crypto Portfolio</h1>
          </div>
          <ul className="nav-links">
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/trades">Trades</Link></li>
            <li><Link to="/wallets">Wallets</Link></li>
            <li><Link to="/add-trade">Add Trade</Link></li>
          </ul>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trades" element={<TradeList />} />
            <Route path="/wallets" element={<ExchangeWallets />} />
            <Route path="/add-trade" element={<AddTrade />} />
            <Route path="/edit-trade/:id" element={<EditTrade />} />
            <Route path="/trade/:id" element={<TradeDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
