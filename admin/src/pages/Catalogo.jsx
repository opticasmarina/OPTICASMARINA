// ─── CATALOGO ────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Package, Eye, EyeOff } from 'lucide-react'
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

  function abrirNuevo() { setForm(EMPTY); setEditId(null); setModal(true) }
  function abrirEditar(item) { setForm({ ...item }); setEditId(item.id); setModal(true) }

  async function guardar() {
    if (!form.nombre || !form.precio) return showMsg('Nombre y precio requeridos', 'error')
    setSaving(true)
    const payload = { ...form, precio: parseFloat(form.precio) }
    delete payload.id; delete payload.created_at
    const q = editId
      ? supabase.from('productos').update(payload).eq('id', editId)
      : supabase.from('productos').insert(payload)
    const { error } = await q
    setSaving(false)
    if (error) return showMsg('Error: ' + error.message, 'error')
    showMsg(editId ? 'Actualizado' : 'Producto agregado', 'success')
    setModal(false); cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar?')) return
    await supabase.from('productos').delete().eq('id', id)
    cargar(); showMsg('Eliminado', 'success')
  }

  async function toggleDisponible(item) {
    await supabase.from('productos').update({ disponible: !item.disponible }).eq('id', item.id)
    cargar()
  }

  function showMsg(text, type) { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }

  const disponibles = items.filter(i => i.disponible).length

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Catálogo de productos</h1>
          <p className="page-subtitle">Los productos que el bot mostrará a los clientes</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={14} /> Agregar producto</button>
      </div>

      {msg && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf8' }}><Package size={16} color="#10b981" /></div>
          <div><div className="stat-value">{items.length}</div><div className="stat-label">Total productos</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf8' }}><Eye size={16} color="#10b981" /></div>
          <div><div className="stat-value">{disponibles}</div><div className="stat-label">Disponibles</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><EyeOff size={16} /></div>
          <div><div className="stat-value">{items.length - disponibles}</div><div className="stat-label">No disponibles</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Productos</span></div>
        {loading ? (
          <div className="empty-state"><div className="empty-desc">Cargando...</div></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Package size={32} color="var(--text-3)" /></div>
            <div className="empty-title">Sin productos</div>
            <div className="empty-desc">Agrega el primer producto al catálogo</div>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Visible</th><th></th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.nombre}</div>
                    {item.descripcion && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{item.descripcion.slice(0, 55)}{item.descripcion.length > 55 ? '…' : ''}</div>}
                  </td>
                  <td><span className="badge badge-gray">{item.categoria}</span></td>
                  <td style={{ fontWeight: 500 }}>${Number(item.precio).toFixed(2)}</td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={item.disponible} onChange={() => toggleDisponible(item)} />
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
              <span className="modal-title">{editId ? 'Editar producto' : 'Nuevo producto'}</span>
              <button className="modal-close" onClick={() => setModal(false)}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></button>
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
                  <input className="form-input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} />
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
                Disponible para los clientes
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
