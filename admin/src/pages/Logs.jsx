import { useState, useEffect } from 'react'
import { MessageCircle, RefreshCw, Search } from 'lucide-react'
import supabase from '../lib/supabase'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('mensajes_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) {
      setError(error.message)
    } else {
      setLogs(data || [])
    }
    setLoading(false)
  }

  const filtrados = logs.filter(l =>
    busqueda === '' ||
    l.numero?.includes(busqueda) ||
    l.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.mensaje?.toLowerCase().includes(busqueda.toLowerCase())
  )

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
          <h1 className="page-title">Conversaciones</h1>
          <p className="page-subtitle">Historial de los últimos 200 mensajes recibidos</p>
        </div>
        <button className="btn btn-outline" onClick={cargar}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          Error cargando mensajes: {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">{filtrados.length} mensajes</span>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              className="form-input"
              style={{ width: 240, paddingLeft: 32 }}
              placeholder="Buscar número o mensaje..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><div className="empty-desc">Cargando...</div></div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><MessageCircle size={32} color="var(--text-3)" /></div>
            <div className="empty-title">Sin conversaciones</div>
            <div className="empty-desc">Los mensajes aparecerán aquí cuando el bot reciba chats</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Contacto</th>
                <th>Mensaje recibido</th>
                <th>Respuesta del bot</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-3)' }}>
                    {fmt(log.created_at)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{log.nombre || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {log.numero?.replace('@c.us', '')}
                    </div>
                  </td>
                  <td style={{ maxWidth: 200, fontSize: 13 }}>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {log.mensaje}
                    </div>
                  </td>
                  <td style={{ maxWidth: 260, fontSize: 12, color: 'var(--text-2)' }}>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {log.respuesta
                        ? log.respuesta.slice(0, 100) + (log.respuesta.length > 100 ? '…' : '')
                        : '—'}
                    </div>
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