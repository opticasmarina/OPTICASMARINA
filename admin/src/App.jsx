import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Catalogo from './pages/Catalogo'
import Faqs from './pages/Faqs'
import Cupones from './pages/Cupones'
import Broadcast from './pages/Broadcast'
import Logs from './pages/Logs'

const BOT_URL = import.meta.env.VITE_BOT_URL || 'http://localhost:3001'

const navItems = [
  { path: '/',          icon: '📦', label: 'Catálogo' },
  { path: '/faqs',      icon: '❓', label: 'FAQs' },
  { path: '/cupones',   icon: '🎟️', label: 'Cupones' },
  { path: '/broadcast', icon: '📢', label: 'Broadcast' },
  { path: '/logs',      icon: '📋', label: 'Mensajes' },
]

export default function App() {
  const [botStatus, setBotStatus] = useState({ conectado: false, listo: false })
  const location = useLocation()

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const r = await fetch(`${BOT_URL}/api/estado`)
        const data = await r.json()
        setBotStatus(data)
      } catch {
        setBotStatus({ conectado: false, listo: false })
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>🤖</span>
          WhatsApp Bot
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bot-status">
          <span className={`status-dot ${botStatus.listo ? 'online' : 'offline'}`} />
          {botStatus.listo ? 'Bot conectado' : 'Bot desconectado'}
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/"          element={<Catalogo botUrl={BOT_URL} />} />
          <Route path="/faqs"      element={<Faqs botUrl={BOT_URL} />} />
          <Route path="/cupones"   element={<Cupones botUrl={BOT_URL} />} />
          <Route path="/broadcast" element={<Broadcast botUrl={BOT_URL} />} />
          <Route path="/logs"      element={<Logs botUrl={BOT_URL} />} />
        </Routes>
      </main>
    </div>
  )
}
