# WhatsApp Bot — Guía completa de instalación

## Estructura del proyecto
```
whatsapp-bot/
├── bot/            ← Backend Node.js (WhatsApp + API)
├── admin/          ← Panel admin React + Vite
├── database.sql    ← Schema de Supabase
└── .gitignore
```

---

## PASO 1 — Supabase

1. Ve a https://supabase.com y crea un proyecto nuevo
2. En el panel de Supabase ve a **SQL Editor**
3. Copia y pega el contenido de `database.sql` y dale **Run**
4. Ve a **Settings → API** y copia:
   - Project URL
   - anon public key

---

## PASO 2 — Configurar el Bot (backend)

```bash
cd bot
npm install
cp .env.example .env
```

Edita `bot/.env` con tus credenciales de Supabase:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=tu_anon_key
NOMBRE_NEGOCIO=Tu Tienda
PORT=3001
```

### Iniciar el bot
```bash
npm run dev
```

Aparecerá un QR en la terminal. Abre WhatsApp en tu teléfono:
**Dispositivos vinculados → Vincular un dispositivo → Escanear QR**

---

## PASO 3 — Configurar el Admin (frontend)

```bash
cd admin
npm install
cp .env.example .env
```

Edita `admin/.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_KEY=tu_anon_key
VITE_BOT_URL=http://localhost:3001
```

### Iniciar el admin
```bash
npm run dev
```

Abre http://localhost:5173 en tu navegador.

---

## PASO 4 — GitHub

```bash
cd whatsapp-bot
git init
git add .
git commit -m "proyecto inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/whatsapp-bot.git
git push -u origin main
```

---

## PASO 5 — Deploy en Render

### Backend (Bot)
1. render.com → **New → Web Service**
2. Conecta tu repo de GitHub
3. Configura:
   - Root Directory: `bot`
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Plan: Free
4. En Environment Variables agrega:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `NOMBRE_NEGOCIO`
5. Deploy y ve a los **Logs** para escanear el QR

### Admin (Panel)
1. render.com → **New → Static Site**
2. Mismo repo de GitHub
3. Configura:
   - Root Directory: `admin`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. En Environment Variables agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
   - `VITE_BOT_URL` = URL de tu backend en Render

---

## Uso del bot

Los clientes escriben a tu número de WhatsApp:
- `hola` → muestra el menú
- `1` → catálogo de productos
- `2` → ofertas
- `3` → cupones
- `4` → preguntas frecuentes
- `5` → solicitar asesor

## Panel Admin (localhost:5173)
- **Catálogo**: agregar/editar/eliminar productos
- **FAQs**: gestionar preguntas frecuentes
- **Cupones**: crear códigos de descuento
- **Broadcast**: enviar mensajes masivos a grupos
- **Mensajes**: ver historial de conversaciones
