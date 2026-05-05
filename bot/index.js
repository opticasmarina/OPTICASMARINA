require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const express = require('express')
const cors = require('cors')
const routes = require('./src/routes')
const { menuPrincipal, getCatalogo, getFaqs, getCupones, guardarLog } = require('./src/menu')

// ─── Express ──────────────────────────────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json())
app.use('/api', routes)

// ─── WhatsApp Client ──────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'whatsapp-bot' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
})

// Compartir el cliente con las rutas
app.locals.whatsappClient = null
app.locals.botListo = false

// ─── Eventos del cliente ──────────────────────────────────────────────────────
client.on('qr', (qr) => {
  console.log('\n📱 Escanea este QR con WhatsApp > Dispositivos vinculados:\n')
  qrcode.generate(qr, { small: true })
  console.log('\n⏳ Esperando escaneo...\n')
})

client.on('authenticated', () => {
  console.log('✅ WhatsApp autenticado correctamente')
})

client.on('ready', () => {
  console.log('🤖 Bot de WhatsApp listo y conectado!')
  app.locals.whatsappClient = client
  app.locals.botListo = true
})

client.on('disconnected', (reason) => {
  console.log('❌ Bot desconectado:', reason)
  app.locals.botListo = false
})

// ─── Manejo de mensajes ───────────────────────────────────────────────────────
client.on('message', async (msg) => {
  // Ignorar mensajes de status y de grupos si no te mencionan
  if (msg.from === 'status@broadcast') return

  const body = msg.body.trim().toLowerCase()
  const contacto = await msg.getContact()
  const nombre = contacto.pushname || contacto.name || 'Cliente'
  const numero = msg.from

  let respuesta = null

  try {
    // Opciones del menú principal
    if (['hola', 'hello', 'hi', 'inicio', 'menu', 'menú', 'start', '0'].includes(body)) {
      respuesta = menuPrincipal()
    }
    else if (body === '1' || body.includes('catálogo') || body.includes('catalogo') || body.includes('productos')) {
      respuesta = await getCatalogo()
    }
    else if (body === '2' || body.includes('oferta')) {
      respuesta = await getCatalogo() // Puedes personalizar esto con una tabla de ofertas
    }
    else if (body === '3' || body.includes('cupon') || body.includes('cupón') || body.includes('descuento')) {
      respuesta = await getCupones()
    }
    else if (body === '4' || body.includes('faq') || body.includes('pregunta') || body.includes('duda')) {
      respuesta = await getFaqs()
    }
    else if (body === '5' || body.includes('asesor') || body.includes('humano') || body.includes('persona')) {
      respuesta = `🙋 *¡Con gusto te atendemos!*\n\nUn asesor se comunicará contigo a la brevedad.\n\n⏰ Horario de atención:\nLun-Sáb: 9:00am - 7:00pm\n\nGracias por tu paciencia 🙏`
    }
    else {
      // Respuesta por defecto
      respuesta = `No entendí tu mensaje. 😅\n\n` + menuPrincipal()
    }

    if (respuesta) {
      await msg.reply(respuesta)
      await guardarLog(numero, nombre, msg.body, respuesta)
    }
  } catch (error) {
    console.error('Error al procesar mensaje:', error)
    await msg.reply('Ocurrió un error. Por favor intenta de nuevo en un momento.')
  }
})

// ─── Iniciar ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor API corriendo en http://localhost:${PORT}`)
  console.log(`📋 Rutas disponibles:`)
  console.log(`   GET  /api/health`)
  console.log(`   GET  /api/grupos`)
  console.log(`   POST /api/broadcast`)
  console.log(`   GET/POST/PUT/DELETE /api/productos`)
  console.log(`   GET/POST/PUT/DELETE /api/faqs`)
  console.log(`   GET/POST/PUT/DELETE /api/cupones\n`)
})

console.log('🔄 Iniciando cliente de WhatsApp...')
client.initialize()
