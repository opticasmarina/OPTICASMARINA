require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const express = require('express')
const cors = require('cors')
const routes = require('./src/routes')
const { menuPrincipal, getCatalogo, getFaqs, getCupones, guardarLog } = require('./src/menu')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api', routes)

// Detectar ruta de Chrome según el entorno
const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH
  || '/opt/render/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome'
  || '/usr/bin/google-chrome-stable'

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'whatsapp-bot' }),
  puppeteer: {
    headless: true,
    executablePath: chromePath,
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

app.locals.whatsappClient = null
app.locals.botListo = false

client.on('qr', (qr) => {
  console.log('\n📱 Escanea este QR con WhatsApp:\n')
  qrcode.generate(qr, { small: true })
})

client.on('authenticated', () => console.log('✅ WhatsApp autenticado'))

client.on('ready', () => {
  console.log('🤖 Bot listo!')
  app.locals.whatsappClient = client
  app.locals.botListo = true
})

client.on('disconnected', (reason) => {
  console.log('❌ Desconectado:', reason)
  app.locals.botListo = false
})

client.on('message', async (msg) => {
  if (msg.from === 'status@broadcast') return

  const body = msg.body.trim().toLowerCase()
  const contacto = await msg.getContact()
  const nombre = contacto.pushname || contacto.name || 'Cliente'
  const numero = msg.from
  let respuesta = null

  try {
    if (['hola', 'hello', 'hi', 'inicio', 'menu', 'menú', 'start', '0'].includes(body)) {
      respuesta = menuPrincipal()
    } else if (body === '1' || body.includes('catalogo') || body.includes('catálogo')) {
      respuesta = await getCatalogo()
    } else if (body === '2' || body.includes('oferta')) {
      respuesta = await getCatalogo()
    } else if (body === '3' || body.includes('cupon') || body.includes('descuento')) {
      respuesta = await getCupones()
    } else if (body === '4' || body.includes('faq') || body.includes('pregunta')) {
      respuesta = await getFaqs()
    } else if (body === '5' || body.includes('asesor')) {
      respuesta = `🙋 *¡Con gusto te atendemos!*\n\nUn asesor se comunicará contigo pronto.\n\n⏰ Lun-Sáb: 9am - 7pm`
    } else {
      respuesta = `No entendí tu mensaje 😅\n\n` + menuPrincipal()
    }

    if (respuesta) {
      await msg.reply(respuesta)
      await guardarLog(numero, nombre, msg.body, respuesta)
    }
  } catch (error) {
    console.error('Error:', error)
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 API en puerto ${PORT}`))

console.log('🔄 Iniciando WhatsApp...')
client.initialize()