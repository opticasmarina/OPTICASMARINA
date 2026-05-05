import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('mensajes_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setLogs(data || [])
    setLoading(false)
  }

  const filtrados = logs.filter(l =>
    busqueda === '' ||
    l.numero?.includes(busqueda) ||
    l.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.mensaje?.toLowerCase().includes(busqueda.toLowerCase())
  )

  function formatFecha(ts) {
    return new Date(ts).toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Historial de Mensajes</h1>
        <p className="page-subtitle">Últimos 200 mensajes recibidos por el bot</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{filtrados.length} mensajes</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              style={{ width: 220 }}
              placeholder="Buscar por número o mensaje..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <button className="btn btn-outline btn-sm" onClick={cargar}>↻ Actualizar</button>
          </div>
        </div>

        {loading ? (
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No hay mensajes registrados aún.</div>
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
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatFecha(log.created_at)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{log.nombre || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.numero?.replace('@c.us', '')}</div>
                  </td>
                  <td style={{ maxWidth: 200, fontSize: 13 }}>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {log.mensaje}
                    </div>
                  </td>
                  <td style={{ maxWidth: 280, fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {log.respuesta ? log.respuesta.slice(0, 120) + (log.respuesta.length > 120 ? '…' : '') : '—'}
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
