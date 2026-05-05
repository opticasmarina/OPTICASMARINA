import { useState, useEffect } from 'react'
import { Package, HelpCircle, Tag, MessageCircle, Users, TrendingUp, Activity } from 'lucide-react'
import supabase from '../lib/supabase'

export default function Dashboard({ botUrl }) {
  const [stats, setStats] = useState({ productos: 0, faqs: 0, cupones: 0, mensajes: 0, contactos: 0 })
  const [logs, setLogs] = useState([])
  const [botStatus, setBotStatus] = useState({ listo: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar(); checkBot() }, [])

  async function cargar() {
    const [p, f, c, m, ct] = await Promise.all([
      supabase.from('productos').select('id', { count: 'exact', head: true }),
      supabase.from('faqs').select('id', { count: 'exact', head: true }),
      supabase.from('cupones').select('id', { count: 'exact', head: true }),
      supabase.from('mensajes_log').select('id', { count: 'exact', head: true }),
      supabase.from('contactos').select('id', { count: 'exact', head: true }),
    ])
    setStats({ productos: p.count||0, faqs: f.count||0, cupones: c.count||0, mensajes: m.count||0, contactos: ct.count||0 })
    const { data } = await supabase.from('mensajes_log').select('*').order('created_at', { ascending: false }).limit(5)
    setLogs(data || [])
    setLoading(false)
  }

  async function checkBot() {
    try { const r = await fetch(`${botUrl}/api/estado`); setBotStatus(await r.json()) }
    catch { setBotStatus({ listo: false }) }
  }

  const cards = [
    { label: 'Productos',  value: stats.productos, icon: Package,       color: '#10b981' },
    { label: 'Preguntas',  value: stats.faqs,      icon: HelpCircle,    color: '#6366f1' },
    { label: 'Cupones',    value: stats.cupones,   icon: Tag,           color: '#f59e0b' },
    { label: 'Contactos',  value: stats.contactos, icon: Users,         color: '#3b82f6' },
    { label: 'Mensajes',   value: stats.mensajes,  icon: MessageCircle, color: '#ec4899' },
  ]

  function fmt(ts) {
    return new Date(ts).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen general del bot</p>
        </div>
        <span className={`badge ${botStatus.listo ? 'badge-green' : 'badge-red'}`}>
          <Activity size={11} />
          {botStatus.listo ? 'Bot conectado' : 'Bot desconectado'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: '1.5rem' }}>
        {cards.map(c => (
          <div className="stat-card" key={c.label}>
            <div className="stat-icon" style={{ background: c.color + '18' }}>
              <c.icon size={16} color={c.color} />
            </div>
            <div>
              <div className="stat-value">{loading ? '—' : c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Últimas conversaciones</span>
          <TrendingUp size={15} color="var(--text-3)" />
        </div>
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><MessageCircle size={32} color="var(--text-3)" /></div>
            <div className="empty-title">Sin mensajes aún</div>
            <div className="empty-desc">Aquí aparecerán las conversaciones cuando el bot reciba mensajes</div>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Contacto</th><th>Mensaje</th><th>Respuesta</th><th>Fecha</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{l.nombre || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.numero?.replace('@c.us', '')}</div>
                  </td>
                  <td style={{ color: 'var(--text-2)', maxWidth: 180 }}>{l.mensaje?.slice(0,50)}{l.mensaje?.length > 50 ? '…' : ''}</td>
                  <td style={{ color: 'var(--text-3)', maxWidth: 200, fontSize: 12 }}>{l.respuesta?.slice(0,60)}{l.respuesta?.length > 60 ? '…' : ''}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmt(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}