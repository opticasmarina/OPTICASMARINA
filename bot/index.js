require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const QRCode = require('qrcode')
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const routes = require('./src/routes')
const { menuPrincipal, getCatalogo, getFaqs, getCupones, guardarLog } = require('./src/menu')

const app = express()

app.use(cors({
  origin: [
    'https://opticasmarina-admin.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.options('*', cors())

app.use(express.json())
app.use('/api', routes)

function findChrome() {
  const isWindows = process.platform === 'win32'

  if (isWindows) {
    const windowsPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
    ]
    for (const p of windowsPaths) {
      if (p && fs.existsSync(p)) {
        console.log('Chrome encontrado (Windows):', p)
        return p
      }
    }
    console.error('❌ Chrome no encontrado en Windows.')
    return undefined
  }

  const bases = [
    path.join(__dirname, '.chrome', 'chrome'),
    path.join(__dirname, '.chrome'),
    process.env.PUPPETEER_CACHE_DIR && path.join(process.env.PUPPETEER_CACHE_DIR, 'chrome'),
    process.env.PUPPETEER_CACHE_DIR,
    '/opt/render/.cache/puppeteer/chrome',
  ].filter(Boolean)

  for (const base of bases) {
    if (!fs.existsSync(base)) continue
    try {
      for (const version of fs.readdirSync(base)) {
        const p = path.join(base, version, 'chrome-linux64', 'chrome')
        if (fs.existsSync(p)) { console.log('Chrome (Linux):', p); return p }
      }
    } catch (_) {}
  }

  for (const p of ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium']) {
    if (fs.existsSync(p)) { console.log('Chrome sistema:', p); return p }
  }

  return undefined
}

const chromePath = findChrome()
console.log('Chrome path:', chromePath || 'no encontrado')

const puppeteerConfig = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ]
}

if (chromePath) puppeteerConfig.executablePath = chromePath

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'whatsapp-bot' }),
  puppeteer: puppeteerConfig
})

// Estado global del bot
app.locals.whatsappClient = null
app.locals.botListo = false
app.locals.qrBase64 = null
app.locals.qrString = null
app.locals.telefono = null
app.locals.nombreCuenta = null

client.on('qr', async (qr) => {
  console.log('\n📱 Escanea este QR con WhatsApp:\n')
  qrcode.generate(qr, { small: true })
  app.locals.qrString = qr
  try {
    app.locals.qrBase64 = await QRCode.toDataURL(qr, { width: 256, margin: 2 })
  } catch (e) {
    console.error('Error generando QR imagen:', e.message)
  }
})

client.on('authenticated', () => {
  console.log('✅ WhatsApp autenticado')
  app.locals.qrBase64 = null
  app.locals.qrString = null
})

client.on('ready', async () => {
  console.log('🤖 Bot listo!')
  app.locals.whatsappClient = client
  app.locals.botListo = true
  app.locals.qrBase64 = null
  app.locals.qrString = null
  try {
    const info = client.info
    app.locals.telefono = info.wid.user
    app.locals.nombreCuenta = info.pushname || 'Sin nombre'
    console.log('📞 Conectado como:', app.locals.nombreCuenta, '+' + app.locals.telefono)
  } catch (e) {
    console.error('Error obteniendo info:', e.message)
  }
})

client.on('disconnected', (reason) => {
  console.log('❌ Desconectado:', reason)
  app.locals.botListo = false
  app.locals.whatsappClient = null
  app.locals.telefono = null
  app.locals.nombreCuenta = null
  // Reintentar conexión
  setTimeout(() => {
    console.log('🔄 Reintentando conexión...')
    client.initialize()
  }, 5000)
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
    console.error('Error:', error.message)
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 API en puerto ${PORT}`))
if (process.env.ENABLE_WHATSAPP === 'true') {
  console.log('🔄 Iniciando WhatsApp...')
  client.initialize().catch((error) => {
    console.error('❌ Error iniciando WhatsApp:', error.message)
    console.error('⚠️ La API seguirá activa.')
  })
} else {
  console.log('⚠️ WhatsApp desactivado. Solo API activa.')
}