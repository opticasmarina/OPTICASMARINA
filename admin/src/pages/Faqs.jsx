import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, HelpCircle } from 'lucide-react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import supabase from '../lib/supabase'

const EMPTY = { pregunta: '', respuesta: '', orden: 0, activo: true }

export default function Faqs() {
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
    const { data } = await supabase.from('faqs').select('*').order('orden')
    setItems(data || [])
    setLoading(false)
  }

  function abrirNuevo() { setForm({ ...EMPTY, orden: items.length + 1 }); setEditId(null); setModal(true) }
  function abrirEditar(item) { setForm({ ...item }); setEditId(item.id); setModal(true) }

async function guardar() {
  if (!form.pregunta || !form.respuesta) {
    return Swal.fire({
      icon: 'warning',
      title: 'Campos requeridos',
      text: 'Pregunta y respuesta son obligatorias.',
      confirmButtonColor: '#10b981'
    })
  }

  setSaving(true)

  const payload = { ...form, orden: parseInt(form.orden) || 0 }
  delete payload.id
  delete payload.created_at

  const q = editId
    ? supabase.from('faqs').update(payload).eq('id', editId)
    : supabase.from('faqs').insert(payload)

  const { error } = await q

  setSaving(false)

  if (error) {
    return Swal.fire({
      icon: 'error',
      title: 'Error al guardar pregunta',
      text: error.message,
      confirmButtonColor: '#ef4444'
    })
  }

  await Swal.fire({
    icon: 'success',
    title: editId ? 'Pregunta actualizada' : 'Pregunta agregada',
    timer: 1500,
    showConfirmButton: false
  })

  setModal(false)
  cargar()
}

async function eliminar(id) {
  const result = await Swal.fire({
    icon: 'warning',
    title: '¿Eliminar pregunta?',
    text: 'Esta acción no se puede deshacer.',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  })

  if (!result.isConfirmed) return

  const { error } = await supabase.from('faqs').delete().eq('id', id)

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
    title: 'Pregunta eliminada',
    timer: 1400,
    showConfirmButton: false
  })

  cargar()
}

async function toggleActivo(item) {
  const nuevoEstado = !item.activo

  const { error } = await supabase
    .from('faqs')
    .update({ activo: nuevoEstado })
    .eq('id', item.id)

  if (error) {
    return Swal.fire({
      icon: 'error',
      title: 'Error al actualizar pregunta',
      text: error.message,
      confirmButtonColor: '#ef4444'
    })
  }

  Swal.fire({
    icon: 'success',
    title: nuevoEstado ? 'Pregunta activada' : 'Pregunta desactivada',
    timer: 1100,
    showConfirmButton: false
  })

  cargar()
}

  function showMsg(text, type) { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Preguntas frecuentes</h1>
          <p className="page-subtitle">El bot las responde automáticamente cuando un cliente elige la opción 4</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={14} /> Nueva pregunta</button>
      </div>

      {msg && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">{items.length} preguntas</span>
          <span className="badge badge-green">{items.filter(i => i.activo).length} activas</span>
        </div>
        {loading ? (
          <div className="empty-state"><div className="empty-desc">Cargando...</div></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><HelpCircle size={32} color="var(--text-3)" /></div>
            <div className="empty-title">Sin preguntas</div>
            <div className="empty-desc">Agrega las preguntas más comunes de tus clientes</div>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>#</th><th>Pregunta</th><th>Respuesta</th><th>Activa</th><th></th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-3)', width: 36 }}>{item.orden}</td>
                  <td style={{ fontWeight: 500, maxWidth: 220 }}>{item.pregunta}</td>
                  <td style={{ color: 'var(--text-2)', maxWidth: 300, fontSize: 13 }}>
                    {item.respuesta.slice(0, 80)}{item.respuesta.length > 80 ? '…' : ''}
                  </td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={item.activo} onChange={() => toggleActivo(item)} />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => abrirEditar(item)}><Edit2 size={13} /></button>
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
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar pregunta' : 'Nueva pregunta'}</span>
              <button className="modal-close" onClick={() => setModal(false)}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Pregunta *</label>
                <input className="form-input" value={form.pregunta} onChange={e => setForm({ ...form, pregunta: e.target.value })} placeholder="¿Cuál es el horario de atención?" />
              </div>
              <div className="form-group">
                <label className="form-label">Respuesta *</label>
                <textarea className="form-textarea" style={{ minHeight: 100 }} value={form.respuesta} onChange={e => setForm({ ...form, respuesta: e.target.value })} placeholder="Atendemos de Lunes a Sábado..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Orden</label>
                  <input className="form-input" type="number" min="0" value={form.orden} onChange={e => setForm({ ...form, orden: e.target.value })} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                  <label className="form-check"><input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />Activa</label>
                </div>
              </div>
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
