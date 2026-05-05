const express = require('express')
const router = express.Router()
const supabase = require('./supabase')

// ─── Health check ─────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Obtener grupos de WhatsApp (requiere client) ─────────────────────────────
router.get('/grupos', async (req, res) => {
  try {
    const client = req.app.locals.whatsappClient
    if (!client) return res.status(503).json({ error: 'Bot no conectado' })

    const chats = await client.getChats()
    const grupos = chats
      .filter(c => c.isGroup)
      .map(g => ({ id: g.id._serialized, name: g.name, participantes: g.participants?.length || 0 }))

    res.json(grupos)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Broadcast a grupos ───────────────────────────────────────────────────────
router.post('/broadcast', async (req, res) => {
  const { mensaje, grupos } = req.body
  if (!mensaje || !grupos || grupos.length === 0) {
    return res.status(400).json({ error: 'Falta mensaje o grupos' })
  }

  try {
    const client = req.app.locals.whatsappClient
    if (!client) return res.status(503).json({ error: 'Bot no conectado' })

    const resultados = []
    for (const grupoId of grupos) {
      try {
        await client.sendMessage(grupoId, mensaje)
        resultados.push({ id: grupoId, ok: true })
        await new Promise(r => setTimeout(r, 1000))
      } catch (err) {
        resultados.push({ id: grupoId, ok: false, error: err.message })
      }
    }

    res.json({ ok: true, resultados })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Estado del bot ───────────────────────────────────────────────────────────
router.get('/estado', (req, res) => {
  const client = req.app.locals.whatsappClient
  res.json({
    conectado: !!client,
    listo: req.app.locals.botListo || false
  })
})

// ─── CRUD Productos ───────────────────────────────────────────────────────────
router.get('/productos', async (req, res) => {
  const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/productos', async (req, res) => {
  const { data, error } = await supabase.from('productos').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.put('/productos/:id', async (req, res) => {
  const { data, error } = await supabase.from('productos').update(req.body).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/productos/:id', async (req, res) => {
  const { error } = await supabase.from('productos').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ─── CRUD FAQs ────────────────────────────────────────────────────────────────
router.get('/faqs', async (req, res) => {
  const { data, error } = await supabase.from('faqs').select('*').order('orden')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/faqs', async (req, res) => {
  const { data, error } = await supabase.from('faqs').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.put('/faqs/:id', async (req, res) => {
  const { data, error } = await supabase.from('faqs').update(req.body).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/faqs/:id', async (req, res) => {
  const { error } = await supabase.from('faqs').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ─── CRUD Cupones ─────────────────────────────────────────────────────────────
router.get('/cupones', async (req, res) => {
  const { data, error } = await supabase.from('cupones').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/cupones', async (req, res) => {
  const { data, error } = await supabase.from('cupones').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.put('/cupones/:id', async (req, res) => {
  const { data, error } = await supabase.from('cupones').update(req.body).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/cupones/:id', async (req, res) => {
  const { error } = await supabase.from('cupones').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ─── Log de mensajes ──────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  const { data, error } = await supabase
    .from('mensajes_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
