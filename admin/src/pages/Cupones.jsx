import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

const EMPTY = { codigo: '', descripcion: '', descuento_pct: 0, activo: true, expira_en: '' }

export default function Cupones() {
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
    const { data } = await supabase.from('cupones').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  function abrirNuevo() {
    setForm(EMPTY)
    setEditId(null)
    setModal(true)
  }

  function abrirEditar(item) {
    setForm({
      ...item,
      expira_en: item.expira_en ? item.expira_en.split('T')[0] : ''
    })
    setEditId(item.id)
    setModal(true)
  }

  async function guardar() {
    if (!form.codigo) return showMsg('El código es requerido', 'error')
    setSaving(true)
    const payload = {
      codigo: form.codigo.toUpperCase().trim(),
      descripcion: form.descripcion,
      descuento_pct: parseInt(form.descuento_pct) || 0,
      activo: form.activo,
      expira_en: form.expira_en || null
    }

    const query = editId
      ? supabase.from('cupones').update(payload).eq('id', editId)
      : supabase.from('cupones').insert(payload)

    const { error } = await query
    setSaving(false)
    if (error) return showMsg('Error: ' + error.message, 'error')
    showMsg(editId ? 'Cupón actualizado' : 'Cupón creado', 'success')
    setModal(false)
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este cupón?')) return
    await supabase.from('cupones').delete().eq('id', id)
    cargar()
    showMsg('Cupón eliminado', 'success')
  }

  async function toggleActivo(item) {
    await supabase.from('cupones').update({ activo: !item.activo }).eq('id', item.id)
    cargar()
  }

  function showMsg(text, type) {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  function isExpirado(expira) {
    if (!expira) return false
    return new Date(expira) < new Date()
  }

  const activos = items.filter(i => i.activo && !isExpirado(i.expira_en)).length

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Cupones de Descuento</h1>
        <p className="page-subtitle">Los clientes los verán cuando seleccionen la opción 3 del menú</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total cupones</div>
          <div className="stat-value">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Activos</div>
          <div className="stat-value">{activos}</div>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Cupones</span>
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo cupón</button>
        </div>

        {loading ? (
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎟️</div>
            <div className="empty-text">No hay cupones. Crea el primero.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Descuento</th>
                <th>Expira</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const expirado = isExpirado(item.expira_en)
                return (
                  <tr key={item.id}>
                    <td>
                      <code style={{ background: 'var(--bg)', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 13 }}>
                        {item.codigo}
                      </code>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.descripcion}</td>
                    <td style={{ fontWeight: 500 }}>{item.descuento_pct}%</td>
                    <td style={{ fontSize: 12, color: expirado ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {item.expira_en ? new Date(item.expira_en).toLocaleDateString('es-MX') : '—'}
                      {expirado && ' (expirado)'}
                    </td>
                    <td>
                      <button onClick={() => toggleActivo(item)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <span className={`badge ${item.activo && !expirado ? 'badge-green' : 'badge-red'}`}>
                          {item.activo && !expirado ? 'Activo' : 'Inactivo'}
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
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar cupón' : 'Nuevo cupón'}</span>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Código *</label>
                  <input className="form-input" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })} placeholder="VERANO20" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descuento (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.descuento_pct} onChange={e => setForm({ ...form, descuento_pct: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input className="form-input" value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="20% de descuento en productos seleccionados" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha de expiración</label>
                  <input className="form-input" type="date" value={form.expira_en || ''} onChange={e => setForm({ ...form, expira_en: e.target.value })} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                  <label className="form-check">
                    <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
                    Activo
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
