import { useState, useEffect } from 'react'

export default function Broadcast({ botUrl }) {
  const [grupos, setGrupos] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [cargandoGrupos, setCargandoGrupos] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  const plantillas = [
    { label: 'Nueva oferta', texto: '🔥 *¡Oferta especial!*\n\nHoy tenemos descuentos increíbles en productos seleccionados.\n\nEscríbenos "CATALOGO" para ver todo el catálogo. 🛍️' },
    { label: 'Nuevo producto', texto: '🆕 *¡Producto nuevo disponible!*\n\nAcabamos de agregar un nuevo producto a nuestro catálogo.\n\nEscríbenos "1" para verlo. 👀' },
    { label: 'Recordatorio cupón', texto: '⏰ *¡Recuerda tu cupón de descuento!*\n\nEscríbenos "3" para ver los cupones activos disponibles para ti. 🎟️' },
    { label: 'Horario especial', texto: '📅 *Aviso de horario*\n\nEste próximo fin de semana tendremos horario especial.\n\nContactanos para más información. ⏰' },
  ]

  async function cargarGrupos() {
    setCargandoGrupos(true)
    setError(null)
    try {
      const r = await fetch(`${botUrl}/api/grupos`)
      if (!r.ok) throw new Error('Bot no disponible')
      const data = await r.json()
      setGrupos(data)
    } catch (e) {
      setError('No se pudo conectar al bot. Asegúrate de que esté corriendo.')
    } finally {
      setCargandoGrupos(false)
    }
  }

  function toggleGrupo(id) {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  function selectTodos() {
    if (seleccionados.length === grupos.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(grupos.map(g => g.id))
    }
  }

  async function enviar() {
    if (!mensaje.trim()) return setError('Escribe un mensaje')
    if (seleccionados.length === 0) return setError('Selecciona al menos un grupo')
    if (!confirm(`¿Enviar mensaje a ${seleccionados.length} grupo(s)?`)) return

    setEnviando(true)
    setError(null)
    setResultado(null)

    try {
      const r = await fetch(`${botUrl}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, grupos: seleccionados })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)

      const exitosos = data.resultados?.filter(r => r.ok).length || 0
      const fallidos = data.resultados?.filter(r => !r.ok).length || 0
      setResultado({ exitosos, fallidos })
      setSeleccionados([])
    } catch (e) {
      setError('Error al enviar: ' + e.message)
    } finally {
      setEnviando(false)
    }
  }

  const chars = mensaje.length

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Broadcast a Grupos</h1>
        <p className="page-subtitle">Envía mensajes masivos a los grupos de WhatsApp donde está el bot</p>
      </div>

      {resultado && (
        <div className="alert alert-success">
          ✅ Mensaje enviado: {resultado.exitosos} exitoso(s){resultado.fallidos > 0 ? `, ${resultado.fallidos} fallido(s)` : ''}
        </div>
      )}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Panel izquierdo: mensaje */}
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><span className="card-title">Mensaje</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Escribe tu mensaje</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 140, fontFamily: 'monospace', fontSize: 13 }}
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  placeholder="Escribe el mensaje aquí o usa una plantilla..."
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-hint)', marginTop: 4 }}>
                  {chars} caracteres
                </div>
              </div>

              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
                  Puedes usar formato WhatsApp:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>*negrita*</code>
                  <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>_cursiva_</code>
                  <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>~tachado~</code>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Plantillas rápidas</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {plantillas.map((p, i) => (
                <button
                  key={i}
                  className="btn btn-outline"
                  style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  onClick={() => setMensaje(p.texto)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel derecho: grupos */}
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header">
              <span className="card-title">Grupos de WhatsApp</span>
              <button className="btn btn-outline btn-sm" onClick={cargarGrupos} disabled={cargandoGrupos}>
                {cargandoGrupos ? 'Cargando...' : '↻ Cargar grupos'}
              </button>
            </div>
            <div className="card-body">
              {grupos.length === 0 ? (
                <div className="alert alert-warn">
                  Haz clic en "Cargar grupos" para obtener los grupos del bot. El bot debe estar conectado.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {seleccionados.length} de {grupos.length} seleccionados
                    </span>
                    <button className="btn btn-outline btn-sm" onClick={selectTodos}>
                      {seleccionados.length === grupos.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  </div>
                  <div className="check-list">
                    {grupos.map(g => (
                      <div
                        key={g.id}
                        className={`check-item${seleccionados.includes(g.id) ? ' selected' : ''}`}
                        onClick={() => toggleGrupo(g.id)}
                      >
                        <input
                          type="checkbox"
                          checked={seleccionados.includes(g.id)}
                          onChange={() => {}}
                        />
                        <div>
                          <div className="check-item-name">{g.name}</div>
                          <div className="check-item-sub">{g.participantes} participantes</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            onClick={enviar}
            disabled={enviando || seleccionados.length === 0 || !mensaje.trim()}
          >
            {enviando
              ? `Enviando a ${seleccionados.length} grupo(s)...`
              : `📢 Enviar a ${seleccionados.length} grupo(s)`
            }
          </button>
        </div>
      </div>
    </>
  )
}
