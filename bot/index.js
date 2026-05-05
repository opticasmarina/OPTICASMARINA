require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const express = require('express')
const cors = require('cors')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const routes = require('./src/routes')
const { menuPrincipal, getCatalogo, getFaqs, getCupones, guardarLog } = require('./src/menu')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api', routes)

// Detectar Chrome dinámicamente
function findChrome() {
  // 1. Variable de entorno
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    console.log('Chrome desde ENV:', process.env.PUPPETEER_EXECUTABLE_PATH)
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }

  // 2. Buscar en la carpeta de puppeteer cache dinámicamente
  const cacheBase = '/opt/render/.cache/puppeteer/chrome'
  if (fs.existsSync(cacheBase)) {
    const versions = fs.readdirSync(cacheBase)
    for (const version of versions) {
      const chromePath = path.join(cacheBase, version, 'chrome-linux64', 'chrome')
      if (fs.existsSync(chromePath)) {
        console.log('Chrome encontrado en cache:', chromePath)
        return chromePath
      }
    }
  }

  // 3. Rutas comunes del sistema
  const systemPaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ]
  for (const p of systemPaths) {
    if (fs.existsSync(p)) {
      console.log('Chrome del sistema:', p)
      return p
    }
  }

  // 4. which command
  try {
    const result = execSync('which google-chrome-stable || which chromium-browser || which chromium', { encoding: 'utf8' }).trim()
    if (result && fs.existsSync(result.split('\n')[0])) {
      console.log('Chrome via which:', result.split('\n')[0])
      return result.split('\n')[0]
    }
  } catch (_) {}

  console.error('❌ No se encontró Chrome. Rutas revisadas:', cacheBase, systemPaths)
  return null
}

const chromePath = findChrome()
console.log('Ejecutable Chrome:', chromePath)

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'whatsapp-bot' }),
  puppeteer: {
    headless: true,
    executablePath: chromePath || undefined,
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
    console.error('Error al procesar mensaje:', error)
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 API en puerto ${PORT}`))

console.log('🔄 Iniciando WhatsApp...')
client.initialize()