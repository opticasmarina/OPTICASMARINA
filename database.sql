-- =============================================
-- WHATSAPP BOT - SCHEMA COMPLETO DE SUPABASE
-- Ejecuta esto en: Supabase > SQL Editor > Run
-- =============================================

-- Tabla de productos / catálogo
create table if not exists productos (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  descripcion text,
  precio decimal(10,2) not null default 0,
  foto_url text,
  categoria text default 'General',
  disponible boolean default true,
  created_at timestamptz default now()
);

-- Tabla de preguntas frecuentes
create table if not exists faqs (
  id uuid default gen_random_uuid() primary key,
  pregunta text not null,
  respuesta text not null,
  orden integer default 0,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Tabla de cupones de descuento
create table if not exists cupones (
  id uuid default gen_random_uuid() primary key,
  codigo text unique not null,
  descripcion text,
  descuento_pct integer default 0,
  activo boolean default true,
  expira_en timestamptz,
  created_at timestamptz default now()
);

-- Tabla de log de mensajes
create table if not exists mensajes_log (
  id uuid default gen_random_uuid() primary key,
  numero text not null,
  nombre text,
  mensaje text,
  respuesta text,
  created_at timestamptz default now()
);

-- =============================================
-- DATOS DE EJEMPLO
-- =============================================

insert into faqs (pregunta, respuesta, orden) values
('¿Cuál es el horario de atención?', 'Atendemos de Lunes a Sábado de 9:00am a 7:00pm. Domingos de 10:00am a 3:00pm.', 1),
('¿Hacen entregas a domicilio?', 'Sí, realizamos entregas a domicilio en toda la ciudad. El costo depende de la zona.', 2),
('¿Cuáles son los métodos de pago?', 'Aceptamos efectivo, tarjeta de débito/crédito y transferencia bancaria.', 3),
('¿Cuánto tarda un pedido?', 'Los pedidos se entregan en un plazo de 1-3 días hábiles dependiendo de tu ubicación.', 4),
('¿Tienen garantía sus productos?', 'Sí, todos nuestros productos tienen garantía de 30 días contra defectos de fábrica.', 5);

insert into productos (nombre, descripcion, precio, categoria) values
('Producto A', 'Descripción detallada del producto A. Excelente calidad.', 299.00, 'Categoría 1'),
('Producto B', 'Descripción detallada del producto B. El más vendido.', 499.00, 'Categoría 1'),
('Producto C', 'Descripción detallada del producto C. Edición especial.', 199.00, 'Categoría 2'),
('Producto D', 'Descripción detallada del producto D. Nuevo ingreso.', 749.00, 'Categoría 2');

insert into cupones (codigo, descripcion, descuento_pct) values
('BIENVENIDO10', '10% de descuento en tu primera compra', 10),
('VERANO20', '20% de descuento en productos seleccionados', 20);

-- =============================================
-- POLÍTICAS DE ACCESO (Row Level Security)
-- Descomenta si quieres restringir acceso
-- =============================================
-- alter table productos enable row level security;
-- alter table faqs enable row level security;
-- alter table cupones enable row level security;
-- alter table mensajes_log enable row level security;

-- Para acceso público de solo lectura en productos y faqs:
-- create policy "Lectura pública" on productos for select using (true);
-- create policy "Lectura pública" on faqs for select using (true);
