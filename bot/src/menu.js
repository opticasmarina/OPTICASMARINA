const supabase = require('./supabase')

const NEGOCIO = process.env.NOMBRE_NEGOCIO || 'Nuestra Tienda'

// ─── Menú principal ───────────────────────────────────────────────────────────
function menuPrincipal() {
  return (
    `¡Hola! Bienvenido a *${NEGOCIO}* 🙌\n\n` +
    `¿En qué te podemos ayudar?\n\n` +
    `1️⃣  Ver catálogo de productos\n` +
    `2️⃣  Ofertas del día\n` +
    `3️⃣  Cupones de descuento\n` +
    `4️⃣  Preguntas frecuentes\n` +
    `5️⃣  Hablar con un asesor\n\n` +
    `_Responde con el número de la opción_ 👇`
  )
}

// ─── Catálogo de productos ────────────────────────────────────────────────────
async function getCatalogo() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('disponible', true)
    .order('categoria')

  if (error || !data || data.length === 0) {
    return 'No hay productos disponibles en este momento.'
  }

  const categorias = [...new Set(data.map(p => p.categoria))]

  let texto = `🛍️ *Catálogo de Productos*\n\n`

  for (const cat of categorias) {
    const prods = data.filter(p => p.categoria === cat)
    texto += `📦 *${cat}*\n`
    for (const p of prods) {
      texto += `• *${p.nombre}* — $${Number(p.precio).toFixed(2)}\n`
      if (p.descripcion) texto += `  ${p.descripcion}\n`
    }
    texto += '\n'
  }

  texto += `Para hacer un pedido escribe *PEDIDO* o el nombre del producto. 👆`
  return texto
}

// ─── Preguntas frecuentes ─────────────────────────────────────────────────────
async function getFaqs() {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('activo', true)
    .order('orden')

  if (error || !data || data.length === 0) {
    return 'No hay preguntas frecuentes registradas.'
  }

  let texto = `❓ *Preguntas Frecuentes*\n\n`
  for (const f of data) {
    texto += `*${f.pregunta}*\n${f.respuesta}\n\n`
  }
  texto += `Si tienes otra duda escribe *ASESOR* para hablar con nosotros.`
  return texto
}

// ─── Cupones ──────────────────────────────────────────────────────────────────
async function getCupones() {
  const { data, error } = await supabase
    .from('cupones')
    .select('*')
    .eq('activo', true)

  if (error || !data || data.length === 0) {
    return 'No hay cupones activos en este momento. ¡Próximamente tendremos promociones!'
  }

  let texto = `🎟️ *Cupones de Descuento*\n\n`
  for (const c of data) {
    texto += `📌 Código: *${c.codigo}*\n`
    texto += `   ${c.descripcion}\n`
    if (c.descuento_pct > 0) texto += `   💰 ${c.descuento_pct}% de descuento\n`
    if (c.expira_en) {
      const exp = new Date(c.expira_en).toLocaleDateString('es-MX')
      texto += `   📅 Válido hasta: ${exp}\n`
    }
    texto += '\n'
  }

  texto += `Presenta el código al momento de tu compra. 👍`
  return texto
}

// ─── Guardar log en Supabase ──────────────────────────────────────────────────
async function guardarLog(numero, nombre, mensaje, respuesta) {
  await supabase.from('mensajes_log').insert({
    numero,
    nombre: nombre || null,
    mensaje,
    respuesta
  })
}

module.exports = {
  menuPrincipal,
  getCatalogo,
  getFaqs,
  getCupones,
  guardarLog
}
