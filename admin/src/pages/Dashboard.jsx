import { useState, useEffect, useRef, useCallback } from 'react'
import { Package, HelpCircle, Tag, MessageCircle, Users, TrendingUp, Activity, Smartphone, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import supabase from '../lib/supabase'

const BOT_URL = import.meta.env.VITE_BOT_URL || 'http://localhost:3001'

export default function Dashboard() {
  const [stats, setStats] = useState({ productos: 0, faqs: 0, cupones: 0, mensajes: 0, contactos: 0 })
  const [logs, setLogs] = useState([])
  const [botStatus, setBotStatus] = useState({ listo: false, telefono: null, nombre: null, tieneQR: false })
  const [qrImg, setQrImg] = useState(null)
  const [loading, setLoading] = useState(true)
  const prevListo = useRef(false)
  const pollRef = useRef(null)

  const checkBot = useCallback(async () => {
    try {
      const r = await fetch(`${BOT_URL}/api/estado`, { cache: 'no-store' })
      if (!r.ok) throw new Error('no response')
      const data = await r.json()
      setBotStatus(data)

      // Si acaba de conectarse, recargar stats
      if (data.listo && !prevListo.current) {
        cargar()
      }
      prevListo.current = data.listo

      if (!data.listo && data.tieneQR) {
        const qr = await fetch(`${BOT_URL}/api/qr`, { cache: 'no-store' })
        const qrData = await qr.json()
        if (qrData.qr) setQrImg(qrData.qr)
      } else if (data.listo) {
        setQrImg(null)
      }
    } catch {
      setBotStatus(prev => ({ ...prev, listo: false, tieneQR: false }))
    }
  }, [])

  async function cargar() {
    const [p, f, c, m, ct] = await Promise.all([
      supabase.from('productos').select('id', { count: 'exact', head: true }),
      supabase.from('faqs').select('id', { count: 'exact', head: true }),
      supabase.from('cupones').select('id', { count: 'exact', head: true }),
      supabase.from('mensajes_log').select('id', { count: 'exact', head: true }),
      supabase.from('contactos').select('id', { count: 'exact', head: true }),
    ])
    setStats({
      productos: p.count || 0,
      faqs: f.count || 0,
      cupones: c.count || 0,
      mensajes: m.count || 0,
      contactos: ct.count || 0
    })
    const { data } = await supabase
      .from('mensajes_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    setLogs(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    checkBot()
    // Poll cada 1.5 segundos para detectar conexión inmediatamente
    pollRef.current = setInterval(checkBot, 1500)
    return () => clearInterval(pollRef.current)
  }, [checkBot])

  const cards = [
    { label: 'Productos',  value: stats.productos, icon: Package,       color: '#10b981' },
    { label: 'Preguntas',  value: stats.faqs,      icon: HelpCircle,    color: '#6366f1' },
    { label: 'Cupones',    value: stats.cupones,   icon: Tag,           color: '#f59e0b' },
    { label: 'Contactos',  value: stats.contactos, icon: Users,         color: '#3b82f6' },
    { label: 'Mensajes',   value: stats.mensajes,  icon: MessageCircle, color: '#ec4899' },
  ]

  function fmt(ts) {
    return new Date(ts).toLocaleString('es-MX', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    })
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

      {/* Conexión WhatsApp */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Smartphone size={15} color="var(--text-2)" />
            <span className="card-title">Conexión WhatsApp</span>
          </div>
          {!botStatus.listo && (
            <button className="btn btn-outline btn-sm" onClick={checkBot}>
              <RefreshCw size={12} /> Verificar
            </button>
          )}
        </div>

        <div className="card-body">
          {botStatus.listo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 56, height: 56, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wifi size={24} color="#10b981" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#065f46', marginBottom: 4 }}>
                  Bot conectado correctamente
                </div>
                {botStatus.nombre && (
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 2 }}>
                    <strong>Cuenta:</strong> {botStatus.nombre}
                  </div>
                )}
                {botStatus.telefono && (
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                    <strong>Número:</strong> +{botStatus.telefono}
                  </div>
                )}
              </div>
            </div>
          ) : qrImg ? (
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0 }}>
                <img
                  src={qrImg}
                  alt="QR WhatsApp"
                  style={{ width: 200, height: 200, border: '4px solid var(--border)', borderRadius: 12 }}
                />
              </div>
              <div style={{ paddingTop: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
                  Escanea para conectar el bot
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-2)' }}>
                  {[
                    'Abre WhatsApp en tu teléfono',
                    'Toca ⋮ → Dispositivos vinculados',
                    'Toca Vincular un dispositivo',
                    'Apunta la cámara al QR'
                  ].map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ background: '#10b981', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      {t}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={11} />
                  Detecta la conexión automáticamente cada 1.5 segundos
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
              <div style={{ width: 56, height: 56, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WifiOff size={24} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#991b1b', marginBottom: 4 }}>
                  Bot desconectado
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
                  El servidor no está corriendo o está iniciando. Espera unos segundos.
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  Local: corre <code>node index.js</code> en la carpeta <code>bot/</code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
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

      {/* Últimas conversaciones */}
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
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Mensaje</th>
                <th>Respuesta</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{l.nombre || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {l.numero?.replace('@c.us', '')}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)', maxWidth: 180 }}>
                    {l.mensaje?.slice(0, 50)}{l.mensaje?.length > 50 ? '…' : ''}
                  </td>
                  <td style={{ color: 'var(--text-3)', maxWidth: 200, fontSize: 12 }}>
                    {l.respuesta?.slice(0, 60)}{l.respuesta?.length > 60 ? '…' : ''}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    {fmt(l.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}