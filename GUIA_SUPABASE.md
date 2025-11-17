# 🔧 Guía para Obtener Credenciales de Supabase

## 📋 Información que necesitamos:

### 1️⃣ **URL del Proyecto (Project URL)**
- Ve a tu dashboard de Supabase: https://supabase.com/dashboard
- Selecciona tu proyecto
- Ve a **Settings** (⚙️) → **API**
- Copia la **Project URL** (algo como: `https://xxxxx.supabase.co`)

### 2️⃣ **API Key (Anon/Public Key)**
- En la misma página de **Settings** → **API**
- Busca la sección **Project API keys**
- Copia la **`anon` `public`** key (NO la `service_role` key)
- Debe empezar con `eyJ...` o `sb_publishable_...`

### 3️⃣ **Verificar Tabla `students`**
- Ve a **Table Editor** en el menú lateral
- Busca la tabla `students` (no `whitelist_matriculas`)
- Verifica que tenga estas columnas:
  - ✅ `matricula` (int8 o bigint) - **IMPORTANTE: debe ser número, no texto**
  - ✅ `activo` (BOOLEAN)
  - ✅ `nombre_abr` (TEXT, opcional) - nombre abreviado del estudiante
  - ✅ Otras columnas como `cve_nivel`, `cve_programa`, `cve_departamento` (opcionales)

### 4️⃣ **Verificar Datos en la Tabla**
- Abre la tabla `students`
- Verifica que haya datos (matrículas de estudiantes)
- **IMPORTANTE:** Verifica que algunas tengan `activo = true`
  - Si todos tienen `activo = false`, necesitas activar algunos registros para que funcionen las reservas

---

## 📝 Ejemplo de lo que necesito:

```
URL: https://tu-proyecto.supabase.co
API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (o sb_publishable_...)
```

---

## ⚠️ IMPORTANTE:

- **NO compartas la `service_role` key** (es privada)
- Solo necesitamos la **`anon` `public` key** (es segura para el frontend)
- La tabla se llama **`students`** (no `whitelist_matriculas`)
- La columna `matricula` es de tipo **int8** (número), el código normaliza automáticamente (000001 = 1)
- Asegúrate de que algunos registros tengan `activo = true` para que funcionen las reservas

---

## 🚀 Una vez que tengas la información:

1. Pégala aquí en el chat
2. Yo actualizaré el código automáticamente
3. Probaremos la conexión

