import { useState, useEffect } from 'react'
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

  function abrirNuevo() {
    setForm({ ...EMPTY, orden: items.length + 1 })
    setEditId(null)
    setModal(true)
  }

  function abrirEditar(item) {
    setForm({ ...item })
    setEditId(item.id)
    setModal(true)
  }

  async function guardar() {
    if (!form.pregunta || !form.respuesta) return showMsg('Pregunta y respuesta son requeridas', 'error')
    setSaving(true)
    const payload = { ...form, orden: parseInt(form.orden) || 0 }
    delete payload.id
    delete payload.created_at

    const query = editId
      ? supabase.from('faqs').update(payload).eq('id', editId)
      : supabase.from('faqs').insert(payload)

    const { error } = await query
    setSaving(false)
    if (error) return showMsg('Error: ' + error.message, 'error')
    showMsg(editId ? 'FAQ actualizada' : 'FAQ agregada', 'success')
    setModal(false)
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta pregunta?')) return
    await supabase.from('faqs').delete().eq('id', id)
    cargar()
    showMsg('FAQ eliminada', 'success')
  }

  async function toggleActivo(item) {
    await supabase.from('faqs').update({ activo: !item.activo }).eq('id', item.id)
    cargar()
  }

  function showMsg(text, type) {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Preguntas Frecuentes</h1>
        <p className="page-subtitle">Estas preguntas el bot las responde automáticamente</p>
      </div>

      {msg && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">{items.length} preguntas</span>
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Nueva pregunta</button>
        </div>

        {loading ? (
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">❓</div>
            <div className="empty-text">No hay preguntas. Agrega la primera.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pregunta</th>
                <th>Respuesta</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-muted)', width: 40 }}>{item.orden}</td>
                  <td style={{ fontWeight: 500, maxWidth: 200 }}>{item.pregunta}</td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: 300 }}>
                    {item.respuesta.slice(0, 80)}{item.respuesta.length > 80 ? '…' : ''}
                  </td>
                  <td>
                    <button onClick={() => toggleActivo(item)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <span className={`badge ${item.activo ? 'badge-green' : 'badge-red'}`}>
                        {item.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => abrirEditar(item)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(item.id)}>Eliminar</button>
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
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Pregunta *</label>
                  <input className="form-input" value={form.pregunta} onChange={e => setForm({ ...form, pregunta: e.target.value })} placeholder="¿Cuál es el horario de atención?" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Respuesta *</label>
                <textarea className="form-textarea" style={{ minHeight: 100 }} value={form.respuesta} onChange={e => setForm({ ...form, respuesta: e.target.value })} placeholder="Atendemos de Lunes a Sábado..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Orden (número)</label>
                  <input className="form-input" type="number" min="0" value={form.orden} onChange={e => setForm({ ...form, orden: e.target.value })} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                  <label className="form-check">
                    <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
                    Activa
                  </label>
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
