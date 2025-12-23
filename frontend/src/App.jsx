import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TradeList from './pages/TradeList'
import AddTrade from './pages/AddTrade'
import EditTrade from './pages/EditTrade'
import TradeDetail from './pages/TradeDetail'
import ExchangeWallets from './pages/ExchangeWallets'
import './App.css'

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  
  return (
    <Router>
      <div className="app">
        {isAuthenticated && (
          <nav className="navbar">
            <div className="nav-brand">
              <h1>📊 Crypto Portfolio</h1>
            </div>
            <ul className="nav-links">
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/trades">Trades</Link></li>
              <li><Link to="/wallets">Wallets</Link></li>
              <li className="user-info">👤 {user}</li>
              <li>
                <button 
                  onClick={toggleTheme} 
                  className="theme-toggle"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
              </li>
              <li>
                <button 
                  onClick={logout} 
                  className="logout-button"
                  aria-label="Logout"
                >
                  🚪 Logout
                </button>
              </li>
            </ul>
          </nav>
        )}
        
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/trades" element={<ProtectedRoute><TradeList /></ProtectedRoute>} />
            <Route path="/wallets" element={<ProtectedRoute><ExchangeWallets /></ProtectedRoute>} />
            <Route path="/add-trade" element={<ProtectedRoute><AddTrade /></ProtectedRoute>} />
            <Route path="/edit-trade/:id" element={<ProtectedRoute><EditTrade /></ProtectedRoute>} />
            <Route path="/trade/:id" element={<ProtectedRoute><TradeDetail /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
