import { useState, useEffect } from 'react'
import { Users, User, Send, RefreshCw, Link, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import supabase from '../lib/supabase'

const PLANTILLAS = [
  { label: 'Nueva oferta',    texto: '🔥 *¡Oferta especial de Ópticas Marina!*\n\nTenemos descuentos increíbles en lentes.\n\nEscríbenos *"1"* para ver el catálogo completo. 🛍️' },
  { label: 'Producto nuevo',  texto: '🆕 *¡Nuevo producto disponible!*\n\nAcabamos de agregar nuevos modelos.\nEscríbenos *"1"* para verlo. 👀' },
  { label: 'Recordar cupón',  texto: '🎟️ *¡Recuerda tu cupón de descuento!*\n\nEscríbenos *"3"* para ver los cupones activos.' },
  { label: 'Revisión de vista', texto: '👓 *¿Ya revisaste tu vista este año?*\n\nAgenda tu cita con nosotros. Tu visión es nuestra prioridad.' },
]

export default function Broadcast({ botUrl }) {
  const [tab, setTab] = useState('grupos')
  const [grupos, setGrupos] = useState([])
  const [contactos, setContactos] = useState([])
  const [selGrupos, setSelGrupos] = useState([])
  const [selContactos, setSelContactos] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [links, setLinks] = useState([{ label: '', url: '' }])
  const [mostrarLinks, setMostrarLinks] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { cargarContactos() }, [])

  async function cargarContactos() {
    const { data } = await supabase.from('contactos').select('*').eq('activo', true).order('nombre')
    setContactos(data || [])
  }

  async function cargarGrupos() {
    setCargando(true); setError(null)
    try {
      const r = await fetch(`${botUrl}/api/grupos`)
      if (!r.ok) throw new Error('Bot no disponible')
      setGrupos(await r.json())
    } catch (e) { setError('No se pudo conectar al bot.') }
    setCargando(false)
  }

  function toggleGrupo(id) { setSelGrupos(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }
  function toggleContacto(num) { setSelContactos(p => p.includes(num) ? p.filter(x => x !== num) : [...p, num]) }

  function mensajeFinal() {
    let txt = mensaje
    const linksValidos = links.filter(l => l.url.trim())
    if (linksValidos.length > 0) {
      txt += '\n\n'
      linksValidos.forEach(l => { txt += l.label ? `📎 *${l.label}:* ${l.url}\n` : `📎 ${l.url}\n` })
    }
    return txt.trim()
  }

  async function enviar() {
    const txtFinal = mensajeFinal()
    if (!txtFinal) return setError('Escribe un mensaje')
    const destinos = [...selGrupos, ...selContactos]
    if (destinos.length === 0) return setError('Selecciona al menos un destino')
    if (!confirm(`¿Enviar a ${destinos.length} destino(s)?`)) return
    setEnviando(true); setError(null); setResultado(null)
    try {
      const r = await fetch(`${botUrl}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: txtFinal, grupos: destinos })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      const ok = data.resultados?.filter(r => r.ok).length || 0
      const fail = data.resultados?.filter(r => !r.ok).length || 0
      setResultado({ ok, fail })
      setSelGrupos([]); setSelContactos([])
    } catch (e) { setError('Error: ' + e.message) }
    setEnviando(false)
  }

  const totalSel = selGrupos.length + selContactos.length

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Broadcast</h1>
          <p className="page-subtitle">Envía mensajes a grupos de WhatsApp y contactos individuales</p>
        </div>
      </div>

      {resultado && <div className="alert alert-success"><Send size={14} />Enviado: {resultado.ok} exitoso(s){resultado.fail > 0 ? `, ${resultado.fail} fallido(s)` : ''}</div>}
      {error && <div className="alert alert-error"><AlertCircle size={14} />{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Mensaje</span></div>
            <div className="card-body">
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 130 }}
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  placeholder="Escribe el mensaje aquí..."
                />
                <div className="form-hint" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Usa *negrita*, _cursiva_ de WhatsApp</span>
                  <span>{mensaje.length} chars</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', borderRadius: 0, paddingLeft: 0, marginBottom: mostrarLinks ? 12 : 0 }}
                onClick={() => setMostrarLinks(!mostrarLinks)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Link size={13} /> Agregar links</span>
                {mostrarLinks ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {mostrarLinks && (
                <div style={{ marginTop: 10 }}>
                  {links.map((l, i) => (
                    <div key={i} className="form-row" style={{ marginBottom: 8 }}>
                      <input className="form-input" placeholder="Texto (ej: Ver catálogo)" value={l.label} onChange={e => { const n=[...links]; n[i].label=e.target.value; setLinks(n) }} />
                      <input className="form-input" placeholder="https://..." value={l.url} onChange={e => { const n=[...links]; n[i].url=e.target.value; setLinks(n) }} />
                    </div>
                  ))}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLinks([...links, { label:'', url:'' }])}><Link size={12} /> Otro link</button>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Plantillas</span></div>
            <div style={{ padding: '8px' }}>
              {PLANTILLAS.map((p, i) => (
                <button key={i} type="button" className="btn btn-ghost" style={{ width:'100%', justifyContent:'flex-start', marginBottom:2, fontSize:13 }} onClick={() => setMensaje(p.texto)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" className={`btn btn-sm ${tab==='grupos' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('grupos')}><Users size={12} /> Grupos</button>
                <button type="button" className={`btn btn-sm ${tab==='contactos' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('contactos')}><User size={12} /> Individuales</button>
              </div>
              {tab === 'grupos' ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={cargarGrupos} disabled={cargando}>
                  <RefreshCw size={12} /> {cargando ? 'Cargando...' : 'Cargar grupos'}
                </button>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelContactos(selContactos.length === contactos.length ? [] : contactos.map(c => c.numero+'@c.us'))}>
                  {selContactos.length === contactos.length ? 'Ninguno' : 'Todos'}
                </button>
              )}
            </div>

            <div className="card-body">
              {tab === 'grupos' ? (
                grupos.length === 0 ? (
                  <div className="alert alert-info"><AlertCircle size={14} />Haz clic en "Cargar grupos" para obtener los grupos donde está el bot.</div>
                ) : (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10, fontSize:12, color:'var(--text-2)' }}>
                      <span>{selGrupos.length} de {grupos.length} seleccionados</span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelGrupos(selGrupos.length===grupos.length ? [] : grupos.map(g=>g.id))}>
                        {selGrupos.length===grupos.length ? 'Ninguno' : 'Todos'}
                      </button>
                    </div>
                    <div className="check-list">
                      {grupos.map(g => (
                        <div key={g.id} className={`check-item ${selGrupos.includes(g.id) ? 'selected' : ''}`} onClick={() => toggleGrupo(g.id)}>
                          <input type="checkbox" checked={selGrupos.includes(g.id)} onChange={() => {}} />
                          <div><div className="check-item-name">{g.name}</div><div className="check-item-sub">{g.participantes} participantes</div></div>
                        </div>
                      ))}
                    </div>
                  </>
                )
              ) : (
                contactos.length === 0 ? (
                  <div className="alert alert-info"><AlertCircle size={14} />No hay contactos. Ve a la sección Contactos para agregar.</div>
                ) : (
                  <div className="check-list">
                    {contactos.map(c => (
                      <div key={c.id} className={`check-item ${selContactos.includes(c.numero+'@c.us') ? 'selected' : ''}`} onClick={() => toggleContacto(c.numero+'@c.us')}>
                        <input type="checkbox" checked={selContactos.includes(c.numero+'@c.us')} onChange={() => {}} />
                        <div>
                          <div className="check-item-name">{c.nombre}</div>
                          <div className="check-item-sub">{c.numero} · {c.etiqueta}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14 }}
            onClick={enviar}
            disabled={enviando || totalSel===0 || !mensaje.trim()}
          >
            <Send size={15} />
            {enviando ? `Enviando a ${totalSel}...` : `Enviar a ${totalSel} destino(s)`}
          </button>
        </div>
      </div>
    </>
  )
}