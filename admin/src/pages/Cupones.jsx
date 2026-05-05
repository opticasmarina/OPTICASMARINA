import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Tag } from 'lucide-react'
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

  function abrirNuevo() { setForm(EMPTY); setEditId(null); setModal(true) }
  function abrirEditar(item) { setForm({ ...item, expira_en: item.expira_en ? item.expira_en.split('T')[0] : '' }); setEditId(item.id); setModal(true) }

  async function guardar() {
    if (!form.codigo) return showMsg('El código es requerido', 'error')
    setSaving(true)
    const payload = { codigo: form.codigo.toUpperCase().trim(), descripcion: form.descripcion, descuento_pct: parseInt(form.descuento_pct) || 0, activo: form.activo, expira_en: form.expira_en || null }
    const q = editId ? supabase.from('cupones').update(payload).eq('id', editId) : supabase.from('cupones').insert(payload)
    const { error } = await q
    setSaving(false)
    if (error) return showMsg('Error: ' + error.message, 'error')
    showMsg(editId ? 'Cupón actualizado' : 'Cupón creado', 'success')
    setModal(false); cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar cupón?')) return
    await supabase.from('cupones').delete().eq('id', id)
    cargar(); showMsg('Eliminado', 'success')
  }

  function showMsg(text, type) { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }
  function isExpirado(exp) { return exp && new Date(exp) < new Date() }
  const activos = items.filter(i => i.activo && !isExpirado(i.expira_en)).length

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Cupones de descuento</h1>
          <p className="page-subtitle">Los clientes los ven cuando eligen la opción 3 del menú</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={14} /> Nuevo cupón</button>
      </div>

      {msg && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><Tag size={16} /></div>
          <div><div className="stat-value">{items.length}</div><div className="stat-label">Total cupones</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf8' }}><Tag size={16} color="#10b981" /></div>
          <div><div className="stat-value">{activos}</div><div className="stat-label">Activos</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Cupones</span></div>
        {loading ? (
          <div className="empty-state"><div className="empty-desc">Cargando...</div></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Tag size={32} color="var(--text-3)" /></div>
            <div className="empty-title">Sin cupones</div>
            <div className="empty-desc">Crea cupones de descuento para tus clientes</div>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Código</th><th>Descripción</th><th>Descuento</th><th>Expira</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {items.map(item => {
                const exp = isExpirado(item.expira_en)
                return (
                  <tr key={item.id}>
                    <td><code style={{ fontWeight: 600, fontSize: 13 }}>{item.codigo}</code></td>
                    <td style={{ color: 'var(--text-2)' }}>{item.descripcion}</td>
                    <td style={{ fontWeight: 600 }}>{item.descuento_pct}%</td>
                    <td style={{ fontSize: 12, color: exp ? 'var(--danger)' : 'var(--text-3)' }}>
                      {item.expira_en ? new Date(item.expira_en).toLocaleDateString('es-MX') : '—'}
                      {exp && ' · expirado'}
                    </td>
                    <td>
                      <label className="toggle">
                        <input type="checkbox" checked={item.activo && !exp} onChange={async () => {
                          await supabase.from('cupones').update({ activo: !item.activo }).eq('id', item.id); cargar()
                        }} />
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
              <button className="modal-close" onClick={() => setModal(false)}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Código *</label>
                  <input className="form-input" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })} placeholder="VERANO20" style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descuento (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.descuento_pct} onChange={e => setForm({ ...form, descuento_pct: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input className="form-input" value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="20% de descuento en lentes seleccionados" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha de expiración</label>
                  <input className="form-input" type="date" value={form.expira_en || ''} onChange={e => setForm({ ...form, expira_en: e.target.value })} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                  <label className="form-check"><input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />Activo</label>
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
