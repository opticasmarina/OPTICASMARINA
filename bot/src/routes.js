const express = require('express')
const router = express.Router()
const supabase = require('./supabase')
const cron = require('node-cron')

// ─── Health ───────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok' }))

// ─── Estado del bot ───────────────────────────────────────────────────────────
router.get('/estado', (req, res) => res.json({
  conectado: !!req.app.locals.whatsappClient,
  listo: req.app.locals.botListo || false
}))

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

// ─── Broadcast (grupos + contactos individuales) ──────────────────────────────
router.post('/broadcast', async (req, res) => {
  const { mensaje, grupos } = req.body
  if (!mensaje || !grupos?.length) return res.status(400).json({ error: 'Falta mensaje o destinos' })
  try {
    const client = req.app.locals.whatsappClient
    if (!client) return res.status(503).json({ error: 'Bot no conectado' })
    const resultados = []
    for (const id of grupos) {
      try {
        await client.sendMessage(id, mensaje)
        resultados.push({ id, ok: true })
        await new Promise(r => setTimeout(r, 1200))
      } catch (err) {
        resultados.push({ id, ok: false, error: err.message })
      }
    }
    res.json({ ok: true, resultados })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── CRUD Productos ───────────────────────────────────────────────────────────
router.get('/productos',       async (req, res) => { const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false }); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.post('/productos',      async (req, res) => { const { data, error } = await supabase.from('productos').insert(req.body).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.put('/productos/:id',   async (req, res) => { const { data, error } = await supabase.from('productos').update(req.body).eq('id', req.params.id).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.delete('/productos/:id',async (req, res) => { const { error } = await supabase.from('productos').delete().eq('id', req.params.id); error ? res.status(500).json({ error: error.message }) : res.json({ ok: true }) })

// ─── CRUD FAQs ────────────────────────────────────────────────────────────────
router.get('/faqs',       async (req, res) => { const { data, error } = await supabase.from('faqs').select('*').order('orden'); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.post('/faqs',      async (req, res) => { const { data, error } = await supabase.from('faqs').insert(req.body).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.put('/faqs/:id',   async (req, res) => { const { data, error } = await supabase.from('faqs').update(req.body).eq('id', req.params.id).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.delete('/faqs/:id',async (req, res) => { const { error } = await supabase.from('faqs').delete().eq('id', req.params.id); error ? res.status(500).json({ error: error.message }) : res.json({ ok: true }) })

// ─── CRUD Cupones ─────────────────────────────────────────────────────────────
router.get('/cupones',       async (req, res) => { const { data, error } = await supabase.from('cupones').select('*').order('created_at', { ascending: false }); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.post('/cupones',      async (req, res) => { const { data, error } = await supabase.from('cupones').insert(req.body).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.put('/cupones/:id',   async (req, res) => { const { data, error } = await supabase.from('cupones').update(req.body).eq('id', req.params.id).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.delete('/cupones/:id',async (req, res) => { const { error } = await supabase.from('cupones').delete().eq('id', req.params.id); error ? res.status(500).json({ error: error.message }) : res.json({ ok: true }) })

// ─── CRUD Contactos ───────────────────────────────────────────────────────────
router.get('/contactos',       async (req, res) => { const { data, error } = await supabase.from('contactos').select('*').order('nombre'); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.post('/contactos',      async (req, res) => { const { data, error } = await supabase.from('contactos').insert(req.body).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.put('/contactos/:id',   async (req, res) => { const { data, error } = await supabase.from('contactos').update(req.body).eq('id', req.params.id).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.delete('/contactos/:id',async (req, res) => { const { error } = await supabase.from('contactos').delete().eq('id', req.params.id); error ? res.status(500).json({ error: error.message }) : res.json({ ok: true }) })

// ─── Mensajes programados ─────────────────────────────────────────────────────
router.get('/mensajes_programados',       async (req, res) => { const { data, error } = await supabase.from('mensajes_programados').select('*').order('created_at', { ascending: false }); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.post('/mensajes_programados',      async (req, res) => { const { data, error } = await supabase.from('mensajes_programados').insert(req.body).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.put('/mensajes_programados/:id',   async (req, res) => { const { data, error } = await supabase.from('mensajes_programados').update(req.body).eq('id', req.params.id).select().single(); error ? res.status(500).json({ error: error.message }) : res.json(data) })
router.delete('/mensajes_programados/:id',async (req, res) => { const { error } = await supabase.from('mensajes_programados').delete().eq('id', req.params.id); error ? res.status(500).json({ error: error.message }) : res.json({ ok: true }) })

// ─── Logs ─────────────────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  const { data, error } = await supabase.from('mensajes_log').select('*').order('created_at', { ascending: false }).limit(200)
  error ? res.status(500).json({ error: error.message }) : res.json(data)
})

// ─── Scheduler de mensajes programados ───────────────────────────────────────
let scheduledJobs = {}

async function iniciarScheduler(app) {
  console.log('⏰ Iniciando scheduler de mensajes programados...')

  async function recargarJobs() {
    Object.values(scheduledJobs).forEach(job => job.stop())
    scheduledJobs = {}

    const { data } = await supabase.from('mensajes_programados').select('*').eq('activo', true)
    if (!data?.length) return

    for (const prog of data) {
      try {
        if (!cron.validate(prog.cron_expr)) { console.warn('Cron inválido:', prog.cron_expr); continue }

        scheduledJobs[prog.id] = cron.schedule(prog.cron_expr, async () => {
          const client = app.locals.whatsappClient
          if (!client || !app.locals.botListo) { console.log('Bot no listo, saltando programa:', prog.nombre); return }

          console.log(`📅 Ejecutando programa: ${prog.nombre}`)
          const destinos = []

          if (prog.tipo_destino === 'contactos' || prog.tipo_destino === 'ambos') {
            const { data: contactos } = await supabase.from('contactos').select('numero').eq('activo', true)
            contactos?.forEach(c => destinos.push(c.numero + '@c.us'))
          }

          if (prog.tipo_destino === 'grupos' || prog.tipo_destino === 'ambos') {
            try {
              const chats = await client.getChats()
              chats.filter(c => c.isGroup).forEach(g => destinos.push(g.id._serialized))
            } catch (e) { console.error('Error obteniendo grupos:', e.message) }
          }

          for (const dest of destinos) {
            try {
              await client.sendMessage(dest, prog.mensaje)
              await new Promise(r => setTimeout(r, 1500))
            } catch (e) { console.error('Error enviando a', dest, e.message) }
          }

          await supabase.from('mensajes_programados').update({ ultima_ejecucion: new Date().toISOString() }).eq('id', prog.id)
          console.log(`✅ Programa "${prog.nombre}" enviado a ${destinos.length} destinos`)
        }, { timezone: 'America/Mazatlan' })

        console.log(`✅ Programa activo: "${prog.nombre}" — ${prog.descripcion_cron}`)
      } catch (e) { console.error('Error creando job:', prog.nombre, e.message) }
    }
  }

  await recargarJobs()
  cron.schedule('*/5 * * * *', recargarJobs)
}

module.exports = router
module.exports.iniciarScheduler = iniciarScheduler
