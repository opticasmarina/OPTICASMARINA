const express = require('express')
const router = express.Router()
const supabase = require('./supabase')

// ─── Health ───────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok' }))

// ─── Estado ───────────────────────────────────────────────────────────────────
router.get('/estado', (req, res) => res.json({
  conectado: !!req.app.locals.whatsappClient,
  listo: req.app.locals.botListo || false,
  telefono: req.app.locals.telefono || null,
  nombre: req.app.locals.nombreCuenta || null,
  tieneQR: !!req.app.locals.qrBase64
}))

// ─── QR ───────────────────────────────────────────────────────────────────────
router.get('/qr', (req, res) => {
  if (req.app.locals.botListo) return res.json({ status: 'conectado', qr: null })
  if (req.app.locals.qrBase64) return res.json({ status: 'esperando_escaneo', qr: req.app.locals.qrBase64 })
  return res.json({ status: 'iniciando', qr: null })
})

// ─── Info ─────────────────────────────────────────────────────────────────────
router.get('/info', (req, res) => {
  res.json({
    conectado: req.app.locals.botListo || false,
    telefono: req.app.locals.telefono || null,
    nombre: req.app.locals.nombreCuenta || null,
  })
})

// ─── Grupos ───────────────────────────────────────────────────────────────────
router.get('/grupos', async (req, res) => {
  try {
    const client = req.app.locals.whatsappClient
    if (!client) return res.status(503).json({ error: 'Bot no conectado' })
    const chats = await client.getChats()
    const grupos = chats.filter(c => c.isGroup).map(g => ({
      id: g.id._serialized,
      name: g.name,
      participantes: g.participants?.length || 0
    }))
    res.json(grupos)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Broadcast con fix para números México ────────────────────────────────────
async function enviarConReintento(client, id, mensaje) {
  // Si es grupo (tiene guión) o ya tiene @g.us, enviar directo
  if (id.includes('@g.us') || (id.includes('-') && !id.includes('@c.us'))) {
    try {
      await client.sendMessage(id, mensaje)
      return { id, ok: true }
    } catch (e) {
      return { id, ok: false, error: e.message }
    }
  }

  // Para contactos individuales, intentar con el número tal cual
  const idLimpio = id.includes('@') ? id : id + '@c.us'

  try {
    await client.sendMessage(idLimpio, mensaje)
    return { id: idLimpio, ok: true }
  } catch (e) {
    // Si falla, intentar con formato alternativo México (52X -> 521X)
    const numSolo = idLimpio.replace('@c.us', '')
    let altId = null

    if (numSolo.startsWith('521') && numSolo.length === 13) {
      // Tiene 521, probar sin el 1: 52XXXXXXXXXX
      altId = '52' + numSolo.slice(3) + '@c.us'
    } else if (numSolo.startsWith('52') && !numSolo.startsWith('521') && numSolo.length === 12) {
      // No tiene 1, probar agregándolo: 521XXXXXXXXXX
      altId = '521' + numSolo.slice(2) + '@c.us'
    }

    if (altId) {
      try {
        await client.sendMessage(altId, mensaje)
        return { id: altId, ok: true }
      } catch (e2) {
        return { id: idLimpio, ok: false, error: `Intentos: ${e.message} / ${e2.message}` }
      }
    }

    return { id: idLimpio, ok: false, error: e.message }
  }
}

router.post('/broadcast', async (req, res) => {
  const { mensaje, grupos } = req.body
  if (!mensaje || !grupos?.length) return res.status(400).json({ error: 'Falta mensaje o destinos' })
  try {
    const client = req.app.locals.whatsappClient
    if (!client) return res.status(503).json({ error: 'Bot no conectado' })
    const resultados = []
    for (const id of grupos) {
      const resultado = await enviarConReintento(client, id, mensaje)
      resultados.push(resultado)
      await new Promise(r => setTimeout(r, 1500))
    }
    res.json({ ok: true, resultados })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── CRUD Productos ───────────────────────────────────────────────────────────
router.get('/productos',        async (req, res) => { const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false }); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.post('/productos',       async (req, res) => { const { data, error } = await supabase.from('productos').insert(req.body).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.put('/productos/:id',    async (req, res) => { const { data, error } = await supabase.from('productos').update(req.body).eq('id', req.params.id).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.delete('/productos/:id', async (req, res) => { const { error } = await supabase.from('productos').delete().eq('id', req.params.id); error ? res.status(500).json({ error: error.message }) : res.json({ ok: true }) })

// ─── CRUD FAQs ────────────────────────────────────────────────────────────────
router.get('/faqs',        async (req, res) => { const { data, error } = await supabase.from('faqs').select('*').order('orden'); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.post('/faqs',       async (req, res) => { const { data, error } = await supabase.from('faqs').insert(req.body).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.put('/faqs/:id',    async (req, res) => { const { data, error } = await supabase.from('faqs').update(req.body).eq('id', req.params.id).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.delete('/faqs/:id', async (req, res) => { const { error } = await supabase.from('faqs').delete().eq('id', req.params.id); error ? res.status(500).json({ error: error.message }) : res.json({ ok: true }) })

// ─── CRUD Cupones ─────────────────────────────────────────────────────────────
router.get('/cupones',        async (req, res) => { const { data, error } = await supabase.from('cupones').select('*').order('created_at', { ascending: false }); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.post('/cupones',       async (req, res) => { const { data, error } = await supabase.from('cupones').insert(req.body).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.put('/cupones/:id',    async (req, res) => { const { data, error } = await supabase.from('cupones').update(req.body).eq('id', req.params.id).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.delete('/cupones/:id', async (req, res) => { const { error } = await supabase.from('cupones').delete().eq('id', req.params.id); error ? res.status(500).json({ error: error.message }) : res.json({ ok: true }) })

// ─── CRUD Contactos ───────────────────────────────────────────────────────────
router.get('/contactos',        async (req, res) => { const { data, error } = await supabase.from('contactos').select('*').order('nombre'); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.post('/contactos',       async (req, res) => { const { data, error } = await supabase.from('contactos').insert(req.body).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.put('/contactos/:id',    async (req, res) => { const { data, error } = await supabase.from('contactos').update(req.body).eq('id', req.params.id).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.delete('/contactos/:id', async (req, res) => { const { error } = await supabase.from('contactos').delete().eq('id', req.params.id); error ? res.status(500).json({ error: error.message }) : res.json({ ok: true }) })

// ─── CRUD Mensajes programados ────────────────────────────────────────────────
router.get('/mensajes_programados',        async (req, res) => { const { data, error } = await supabase.from('mensajes_programados').select('*').order('created_at', { ascending: false }); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.post('/mensajes_programados',       async (req, res) => { const { data, error } = await supabase.from('mensajes_programados').insert(req.body).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.put('/mensajes_programados/:id',    async (req, res) => { const { data, error } = await supabase.from('mensajes_programados').update(req.body).eq('id', req.params.id).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.delete('/mensajes_programados/:id', async (req, res) => { const { error } = await supabase.from('mensajes_programados').delete().eq('id', req.params.id); error ? res.status(500).json({ error: error.message }) : res.json({ ok: true }) })

// ─── Logs ─────────────────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  const { data, error } = await supabase.from('mensajes_log').select('*').order('created_at', { ascending: false }).limit(200)
  error ? res.status(500).json({ error: error.message }) : res.json(data)
})

module.exports = router