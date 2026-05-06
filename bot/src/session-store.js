const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

class SupabaseStore {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )
    this.bucket = 'whatsapp-sessions'
    this.fileKey = 'session.zip'
  }

  async sessionExists({ session }) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list('', { search: this.fileKey })
      if (error) return false
      return Array.isArray(data) && data.length > 0
    } catch {
      return false
    }
  }

  async save({ session }) {
    try {
      const zipPath = `./${session}.zip`
      if (!fs.existsSync(zipPath)) {
        console.log('⚠️ ZIP de sesión no encontrado:', zipPath)
        return
      }
      const fileBuffer = fs.readFileSync(zipPath)
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .upload(this.fileKey, fileBuffer, {
          contentType: 'application/zip',
          upsert: true
        })
      if (error) console.error('❌ Error guardando sesión en Supabase:', error.message)
      else console.log('✅ Sesión guardada en Supabase Storage')
    } catch (e) {
      console.error('❌ Error en save():', e.message)
    }
  }

  async extract({ session }) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .download(this.fileKey)
      if (error || !data) {
        console.log('ℹ️ No hay sesión guardada en Supabase')
        return
      }
      const arrayBuffer = await data.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const zipPath = `./${session}.zip`
      fs.writeFileSync(zipPath, buffer)
      console.log('✅ Sesión cargada desde Supabase Storage')
    } catch (e) {
      console.error('❌ Error en extract():', e.message)
    }
  }

  async delete({ session }) {
    try {
      await this.supabase.storage
        .from(this.bucket)
        .remove([this.fileKey])
      console.log('🗑️ Sesión eliminada de Supabase Storage')
    } catch (e) {
      console.error('❌ Error en delete():', e.message)
    }
  }
}

module.exports = SupabaseStore