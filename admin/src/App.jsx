import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import {
  MessageSquare, Package, HelpCircle, Tag, Megaphone,
  Clock, Users, BarChart2, MessageCircle
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Catalogo from './pages/Catalogo'
import Faqs from './pages/Faqs'
import Cupones from './pages/Cupones'
import Broadcast from './pages/Broadcast'
import Contactos from './pages/Contactos'
import Programados from './pages/Programados'
import Logs from './pages/Logs'

const BOT_URL = import.meta.env.VITE_BOT_URL || 'http://localhost:3001'

const nav = [
  { group: 'General', items: [
    { path: '/',          icon: BarChart2,     label: 'Dashboard' },
    { path: '/logs',      icon: MessageCircle, label: 'Conversaciones' },
  ]},
  { group: 'Contenido', items: [
    { path: '/catalogo',  icon: Package,       label: 'Catálogo' },
    { path: '/faqs',      icon: HelpCircle,    label: 'Preguntas' },
    { path: '/cupones',   icon: Tag,           label: 'Cupones' },
  ]},
  { group: 'Mensajería', items: [
    { path: '/contactos',   icon: Users,     label: 'Contactos' },
    { path: '/broadcast',   icon: Megaphone, label: 'Broadcast' },
    { path: '/programados', icon: Clock,     label: 'Programados' },
  ]},
]

export default function App() {
  const [botStatus, setBotStatus] = useState({ conectado: false, listo: false })

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${BOT_URL}/api/estado`)
        setBotStatus(await r.json())
      } catch { setBotStatus({ conectado: false, listo: false }) }
    }
    check()
    const t = setInterval(check, 12000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <MessageSquare size={16} color="white" />
          </div>
          <div>
            <div className="logo-text">Opticas Marina</div>
            <div className="logo-sub">Panel de administración</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {nav.map(group => (
            <div key={group.group} className="sidebar-section">
              <div className="sidebar-section-label">{group.group}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <item.icon size={15} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="bot-status">
            <span className={`status-dot ${botStatus.listo ? 'online' : 'offline'}`} />
            <div className="status-label">
              <strong>{botStatus.listo ? 'Bot activo' : 'Bot inactivo'}</strong>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/"            element={<Dashboard botUrl={BOT_URL} />} />
          <Route path="/catalogo"    element={<Catalogo />} />
          <Route path="/faqs"        element={<Faqs />} />
          <Route path="/cupones"     element={<Cupones />} />
          <Route path="/contactos"   element={<Contactos />} />
          <Route path="/broadcast"   element={<Broadcast botUrl={BOT_URL} />} />
          <Route path="/programados" element={<Programados botUrl={BOT_URL} />} />
          <Route path="/logs"        element={<Logs />} />
        </Routes>
      </main>
    </div>
  )
}