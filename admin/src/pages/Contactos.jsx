import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, User, Users, Tag } from 'lucide-react'
import supabase from '../lib/supabase'

const EMPTY = { nombre: '', numero: '', etiqueta: 'cliente', notas: '', activo: true }
const ETIQUETAS = ['cliente', 'proveedor', 'prospecto', 'vip', 'otro']
const ETIQ_COLOR = { cliente: 'badge-green', proveedor: 'badge-blue', prospecto: 'badge-amber', vip: 'badge-red', otro: 'badge-gray' }

export default function Contactos() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('contactos').select('*').order('nombre')
    setItems(data || [])
    setLoading(false)
  }

  function abrirNuevo() { setForm(EMPTY); setEditId(null); setModal(true) }
  function abrirEditar(item) { setForm({ ...item }); setEditId(item.id); setModal(true) }

  async function guardar() {
    if (!form.nombre || !form.numero) return showMsg('Nombre y número son requeridos', 'error')
    let num = form.numero.replace(/\D/g, '')
    if (!num.startsWith('52')) num = '52' + num
    setSaving(true)
    const payload = { ...form, numero: num }
    delete payload.id; delete payload.created_at
    const q = editId
      ? supabase.from('contactos').update(payload).eq('id', editId)
      : supabase.from('contactos').insert(payload)
    const { error } = await q
    setSaving(false)
    if (error) return showMsg('Error: ' + error.message, 'error')
    showMsg(editId ? 'Contacto actualizado' : 'Contacto agregado', 'success')
    setModal(false); cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar contacto?')) return
    await supabase.from('contactos').delete().eq('id', id)
    cargar(); showMsg('Eliminado', 'success')
  }

  function showMsg(text, type) { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }

  const filtrados = items.filter(i =>
    busqueda === '' ||
    i.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.numero?.includes(busqueda)
  )

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contactos</h1>
          <p className="page-subtitle">Contactos individuales para mensajes directos y broadcast</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={14} /> Agregar contacto</button>
      </div>

      {msg && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><Users size={16} /></div>
          <div><div className="stat-value">{items.length}</div><div className="stat-label">Total contactos</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf8' }}><User size={16} color="#10b981" /></div>
          <div><div className="stat-value">{items.filter(i => i.activo).length}</div><div className="stat-label">Activos</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef2f2' }}><Tag size={16} color="#ef4444" /></div>
          <div><div className="stat-value">{items.filter(i => i.etiqueta === 'vip').length}</div><div className="stat-label">VIP</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{filtrados.length} contactos</span>
          <input className="form-input" style={{ width: 220 }} placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        {loading ? (
          <div className="empty-state"><div className="empty-desc">Cargando...</div></div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><User size={32} color="var(--text-3)" /></div>
            <div className="empty-title">Sin contactos</div>
            <div className="empty-desc">Agrega contactos para enviarles mensajes directos</div>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Nombre</th><th>Número WA</th><th>Etiqueta</th><th>Notas</th><th>Activo</th><th></th></tr></thead>
            <tbody>
              {filtrados.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.nombre}</td>
                  <td><code>{item.numero}</code></td>
                  <td><span className={`badge ${ETIQ_COLOR[item.etiqueta] || 'badge-gray'}`}>{item.etiqueta}</span></td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{item.notas || '—'}</td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={item.activo} onChange={async () => {
                        await supabase.from('contactos').update({ activo: !item.activo }).eq('id', item.id); cargar()
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar contacto' : 'Nuevo contacto'}</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Juan Pérez" />
                </div>
                <div className="form-group">
                  <label className="form-label">Número WhatsApp *</label>
                  <input className="form-input" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="6681234567" />
                  <div className="form-hint">Solo dígitos. Se agrega 52 automáticamente.</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Etiqueta</label>
                <select className="form-select" value={form.etiqueta} onChange={e => setForm({ ...form, etiqueta: e.target.value })}>
                  {ETIQUETAS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea className="form-textarea" style={{ minHeight: 70 }} value={form.notas || ''} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Información adicional..." />
              </div>
              <label className="form-check">
                <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
                Activo (recibe mensajes)
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