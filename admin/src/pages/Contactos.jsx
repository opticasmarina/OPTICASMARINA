import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, User, Users, Tag } from 'lucide-react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
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

  function abrirEditar(item) {
    setForm({
      ...item,
      numero: mostrarNumeroSinLada(item.numero)
    })
    setEditId(item.id)
    setModal(true)
  }

async function guardar() {
  if (!form.nombre || !form.numero) {
    return Swal.fire({
      icon: 'warning',
      title: 'Campos requeridos',
      text: 'Nombre y número son obligatorios.',
      confirmButtonColor: '#10b981'
    })
  }

  let num = form.numero.replace(/\D/g, '')

  if (num.length === 10) {
    num = '521' + num
  }

  if (num.startsWith('52') && !num.startsWith('521') && num.length === 12) {
    num = '521' + num.slice(2)
  }

  setSaving(true)

  const payload = { ...form, numero: num }
  delete payload.id
  delete payload.created_at

  const q = editId
    ? supabase.from('contactos').update(payload).eq('id', editId)
    : supabase.from('contactos').insert(payload)

  const { error } = await q

  setSaving(false)

  if (error) {
    return Swal.fire({
      icon: 'error',
      title: 'Error al guardar contacto',
      text: error.message,
      confirmButtonColor: '#ef4444'
    })
  }

  await Swal.fire({
    icon: 'success',
    title: editId ? 'Contacto actualizado' : 'Contacto agregado',
    timer: 1500,
    showConfirmButton: false
  })

  setModal(false)
  cargar()
}

async function eliminar(id) {
  const result = await Swal.fire({
    icon: 'warning',
    title: '¿Eliminar contacto?',
    text: 'Esta acción no se puede deshacer.',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  })

  if (!result.isConfirmed) return

  const { error } = await supabase.from('contactos').delete().eq('id', id)

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
    title: 'Contacto eliminado',
    timer: 1400,
    showConfirmButton: false
  })

  cargar()
}

  function showMsg(text, type) { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }

  function mostrarNumeroSinLada(numero) {
    const limpio = String(numero || '').replace(/\D/g, '')

    if (limpio.startsWith('521') && limpio.length === 13) {
      return limpio.slice(3)
    }

    if (limpio.startsWith('52') && limpio.length === 12) {
      return limpio.slice(2)
    }

    return limpio
  }

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
                  <td><code>{mostrarNumeroSinLada(item.numero)}</code></td>
                  <td><span className={`badge ${ETIQ_COLOR[item.etiqueta] || 'badge-gray'}`}>{item.etiqueta}</span></td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{item.notas || '—'}</td>
                  <td>
                    <label className="toggle">
<input type="checkbox" checked={item.activo} onChange={async () => {
  const nuevoEstado = !item.activo

  const { error } = await supabase
    .from('contactos')
    .update({ activo: nuevoEstado })
    .eq('id', item.id)

  if (error) {
    return Swal.fire({
      icon: 'error',
      title: 'Error al actualizar contacto',
      text: error.message,
      confirmButtonColor: '#ef4444'
    })
  }

  Swal.fire({
    icon: 'success',
    title: nuevoEstado ? 'Contacto activado' : 'Contacto desactivado',
    timer: 1100,
    showConfirmButton: false
  })

  cargar()
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
                  <div className="form-hint">Escribe solo los 10 dígitos. Se guardará como 521 para WhatsApp.</div> </div>
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