import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

const EMPTY = { nombre: '', descripcion: '', precio: '', categoria: 'General', foto_url: '', disponible: true }

export default function Catalogo() {
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
    const { data } = await supabase.from('productos').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  function abrirNuevo() {
    setForm(EMPTY)
    setEditId(null)
    setModal(true)
  }

  function abrirEditar(item) {
    setForm({ ...item })
    setEditId(item.id)
    setModal(true)
  }

  async function guardar() {
    if (!form.nombre || !form.precio) return showMsg('Nombre y precio son requeridos', 'error')
    setSaving(true)
    const payload = { ...form, precio: parseFloat(form.precio) }
    delete payload.id
    delete payload.created_at

    const query = editId
      ? supabase.from('productos').update(payload).eq('id', editId)
      : supabase.from('productos').insert(payload)

    const { error } = await query
    setSaving(false)
    if (error) return showMsg('Error al guardar: ' + error.message, 'error')
    showMsg(editId ? 'Producto actualizado' : 'Producto agregado', 'success')
    setModal(false)
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('productos').delete().eq('id', id)
    cargar()
    showMsg('Producto eliminado', 'success')
  }

  async function toggleDisponible(item) {
    await supabase.from('productos').update({ disponible: !item.disponible }).eq('id', item.id)
    cargar()
  }

  function showMsg(text, type) {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  const disponibles = items.filter(i => i.disponible).length

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Catálogo de Productos</h1>
        <p className="page-subtitle">Gestiona los productos que el bot mostrará a los clientes</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total productos</div>
          <div className="stat-value">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Disponibles</div>
          <div className="stat-value">{disponibles}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">No disponibles</div>
          <div className="stat-value">{items.length - disponibles}</div>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Productos</span>
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Agregar producto</button>
        </div>

        {loading ? (
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-text">No hay productos. Agrega el primero.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.nombre}</div>
                    {item.descripcion && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.descripcion.slice(0, 60)}{item.descripcion.length > 60 ? '…' : ''}</div>}
                  </td>
                  <td><span className="badge badge-gray">{item.categoria}</span></td>
                  <td style={{ fontWeight: 500 }}>${Number(item.precio).toFixed(2)}</td>
                  <td>
                    <button onClick={() => toggleDisponible(item)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <span className={`badge ${item.disponible ? 'badge-green' : 'badge-red'}`}>
                        {item.disponible ? 'Disponible' : 'No disponible'}
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
              <span className="modal-title">{editId ? 'Editar producto' : 'Nuevo producto'}</span>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del producto" />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio *</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <input className="form-input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="General" />
                </div>
                <div className="form-group">
                  <label className="form-label">URL de foto</label>
                  <input className="form-input" value={form.foto_url || ''} onChange={e => setForm({ ...form, foto_url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del producto..." />
              </div>
              <label className="form-check">
                <input type="checkbox" checked={form.disponible} onChange={e => setForm({ ...form, disponible: e.target.checked })} />
                Disponible para el bot
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
