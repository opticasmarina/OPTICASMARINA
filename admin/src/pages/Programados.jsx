import { useState, useEffect } from 'react'
import { Plus, Trash2, Clock, Calendar, AlertCircle, User, Users } from 'lucide-react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import supabase from '../lib/supabase'

const EMPTY = { nombre: '', mensaje: '', tipo_destino: 'contactos', cron_expr: '0 9 * * 1', descripcion_cron: 'Lunes a las 9:00am', activo: true }

const FRECUENCIAS = [
  { label: 'Todos los días a las 9am',     cron: '0 9 * * *',    desc: 'Diario a las 9:00am' },
  { label: 'Todos los lunes a las 9am',    cron: '0 9 * * 1',    desc: 'Lunes a las 9:00am' },
  { label: 'Lunes y jueves a las 10am',    cron: '0 10 * * 1,4', desc: 'Lun y Jue 10:00am' },
  { label: 'Viernes a las 6pm',            cron: '0 18 * * 5',   desc: 'Viernes 6:00pm' },
  { label: 'Primero de cada mes a las 8am',cron: '0 8 1 * *',    desc: 'Día 1 de cada mes' },
  { label: 'Días 1 y 15 a las 9am',        cron: '0 9 1,15 * *', desc: 'Días 1 y 15 del mes' },
]

const PLANTILLAS = [
  '🔥 *¡Oferta especial de Ópticas Marina!*\n\nDescuentos increíbles esta semana.\nEscríbenos *"1"* para ver el catálogo. 🛍️',
  '👓 *¿Ya revisaste tu vista este año?*\n\nTe recordamos que es importante hacer una revisión anual.\n¡Contáctanos para agendar tu cita!',
  '🎟️ *¡No olvides tu cupón de descuento!*\n\nEscríbenos *"3"* para ver los cupones activos.',
]

export default function Programados({ botUrl }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('mensajes_programados').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  function abrirNuevo() { setForm(EMPTY); setEditId(null); setModal(true) }
  function abrirEditar(item) { setForm({ ...item }); setEditId(item.id); setModal(true) }

async function guardar() {
  if (!form.nombre || !form.mensaje) {
    return Swal.fire({
      icon: 'warning',
      title: 'Campos requeridos',
      text: 'Nombre y mensaje son obligatorios.',
      confirmButtonColor: '#10b981'
    })
  }

  setSaving(true)

  const payload = { ...form }
  delete payload.id
  delete payload.created_at
  delete payload.ultima_ejecucion

  const q = editId
    ? supabase.from('mensajes_programados').update(payload).eq('id', editId)
    : supabase.from('mensajes_programados').insert(payload)

  const { error } = await q

  setSaving(false)

  if (error) {
    return Swal.fire({
      icon: 'error',
      title: 'Error al guardar programa',
      text: error.message,
      confirmButtonColor: '#ef4444'
    })
  }

  await Swal.fire({
    icon: 'success',
    title: editId ? 'Programa actualizado' : 'Programa creado',
    timer: 1500,
    showConfirmButton: false
  })

  setModal(false)
  cargar()
}

async function eliminar(id) {
  const result = await Swal.fire({
    icon: 'warning',
    title: '¿Eliminar programa?',
    text: 'Esta acción no se puede deshacer.',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  })

  if (!result.isConfirmed) return

  const { error } = await supabase
    .from('mensajes_programados')
    .delete()
    .eq('id', id)

  if (error) {
    return Swal.fire({
      icon: 'error',
      title: 'Error al eliminar',
      text: error.message,
      confirmButtonColor: '#ef4444'
    })
  }

  await Swal.fire({
    icon: 'success',
    title: 'Programa eliminado',
    timer: 1400,
    showConfirmButton: false
  })

  cargar()
}

async function toggleActivo(item) {
  const nuevoEstado = !item.activo

  const { error } = await supabase
    .from('mensajes_programados')
    .update({ activo: nuevoEstado })
    .eq('id', item.id)

  if (error) {
    return Swal.fire({
      icon: 'error',
      title: 'Error al actualizar programa',
      text: error.message,
      confirmButtonColor: '#ef4444'
    })
  }

  Swal.fire({
    icon: 'success',
    title: nuevoEstado ? 'Programa activado' : 'Programa desactivado',
    timer: 1100,
    showConfirmButton: false
  })

  cargar()
}

  function showMsg(text, type) { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mensajes programados</h1>
          <p className="page-subtitle">Envía mensajes automáticos en horarios definidos</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={14} /> Nuevo programa</button>
      </div>

{null}
      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        <AlertCircle size={14} />
        Los mensajes se envían automáticamente. El bot debe estar conectado en Render para que funcionen.
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">{items.length} programas</span></div>
        {loading ? (
          <div className="empty-state"><div className="empty-desc">Cargando...</div></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Clock size={32} color="var(--text-3)" /></div>
            <div className="empty-title">Sin programas</div>
            <div className="empty-desc">Crea un programa para enviar mensajes automáticamente</div>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Nombre</th><th>Frecuencia</th><th>Destino</th><th>Último envío</th><th>Activo</th><th></th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.nombre}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{item.descripcion_cron}</div>
                    <code style={{ fontSize: 10 }}>{item.cron_expr}</code>
                  </td>
                  <td>
                    <span className={`badge ${item.tipo_destino === 'grupos' ? 'badge-blue' : item.tipo_destino === 'ambos' ? 'badge-amber' : 'badge-green'}`}>
                      {item.tipo_destino === 'grupos' ? 'Grupos' : item.tipo_destino === 'ambos' ? 'Ambos' : 'Contactos'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {item.ultima_ejecucion ? new Date(item.ultima_ejecucion).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={item.activo} onChange={() => toggleActivo(item)} />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => abrirEditar(item)}><Clock size={13} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => eliminar(item.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar programa' : 'Nuevo programa'}</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Oferta semanal de lunes" />
              </div>

              <div className="form-group">
                <label className="form-label">Frecuencia</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>
                  {FRECUENCIAS.map(f => (
                    <button key={f.cron} type="button" className={`btn btn-sm ${form.cron_expr === f.cron ? 'btn-primary' : 'btn-outline'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setForm({ ...form, cron_expr: f.cron, descripcion_cron: f.desc })}>
                      <Calendar size={12} /> {f.label}
                    </button>
                  ))}
                </div>
                <div className="form-hint">Seleccionado: <strong>{form.descripcion_cron}</strong></div>
              </div>

              <div className="form-group">
                <label className="form-label">Enviar a</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['contactos','Contactos'],['grupos','Grupos'],['ambos','Ambos']].map(([v,l]) => (
                    <button key={v} type="button" className={`btn btn-sm ${form.tipo_destino === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setForm({ ...form, tipo_destino: v })}>{l}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mensaje *</label>
                <textarea className="form-textarea" style={{ minHeight: 100 }} value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} placeholder="Escribe el mensaje..." />
              </div>

              <div className="form-group">
                <label className="form-label">Plantillas</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {PLANTILLAS.map((p, i) => (
                    <button key={i} type="button" className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', fontSize: 12 }} onClick={() => setForm({ ...form, mensaje: p })}>
                      {p.slice(0, 55)}…
                    </button>
                  ))}
                </div>
              </div>

              <label className="form-check">
                <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
                Activar este programa
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}