# Sistema de Reserva de Cubículos

Aplicación web para reserva de cubículos de biblioteca: vista estudiante (reservar con verificación por correo) y panel de administración (reservas, cubiculos, anuncios, lista de estudiantes).

## Requisitos

- Node.js 18+
- npm
- Cuenta en [Supabase](https://supabase.com) (base de datos)
- Cuenta de Gmail con verificación en 2 pasos (para enviar códigos de verificación por correo)

## Montar el proyecto

### 1. Clonar e instalar

```bash
git clone <url-del-repositorio>
cd cubiculos-CETYS
npm install
```

### 2. Variables de entorno

Copia el ejemplo y edita con tus valores:

```bash
cp env.example .env.local
```

Abre `.env.local` y configura:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto en Supabase (Dashboard → Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (anon/public) del mismo proyecto |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (service_role). Solo en servidor; no exponer en el cliente |
| `ADMIN_USER` | Usuario para entrar al panel de administración |
| `ADMIN_PASS` | Contraseña del administrador |
| `SESSION_SECRET` | Clave secreta para firmar la sesión (mínimo 32 caracteres). Generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATABASE_URL` | URL de Postgres (opcional; solo para `npm run seed`) |
| `GMAIL_USER` | Correo Gmail que enviará los códigos de verificación |
| `GMAIL_APP_PASSWORD` | Contraseña de aplicación de Gmail (16 caracteres) |
| `GMAIL_FROM_NAME` | Nombre que aparecerá como remitente (ej: "Biblioteca CETYS") |

No subas `.env` ni `.env.local` al repositorio (ya están en `.gitignore`). Usa `env.example` como plantilla y rellena tus valores solo en `.env.local` de forma local. Si en el pasado se subió un `.env` con credenciales, quítalo del historial con: `git rm --cached .env`.

### 3. Base de datos en Supabase

La app usa una tabla **`students`** en Supabase para la lista de estudiantes autorizados (whitelist). Sin esta tabla y sin configurar las variables de Supabase, la verificación de matrícula no funcionará.

En el SQL Editor de tu proyecto Supabase, ejecuta:

```sql
-- Tabla de estudiantes (whitelist para reservas)
CREATE TABLE IF NOT EXISTS students (
  matricula BIGINT PRIMARY KEY,
  nombre_abr TEXT,
  cve_nivel TEXT,
  cve_programa TEXT,
  cve_departamento TEXT,
  activo BOOLEAN DEFAULT true
);

-- Índice para consultas por activo
CREATE INDEX IF NOT EXISTS idx_students_activo ON students(activo);

-- Ejemplo de datos (opcional)
-- INSERT INTO students (matricula, nombre_abr, activo) VALUES
-- (12345, 'Apellido Nombre', true),
-- (12346, 'Otro Estudiante', true);
```

Opcional: si quieres usar también la estructura antigua del repo (usuarios, salas, blackouts, reservas en Supabase), puedes ejecutar en este orden los archivos en `supabase/migrations/`:

1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_seed_data.sql`

La aplicación actual guarda cubículos, reservas y anuncios en el navegador (localStorage). La tabla `students` en Supabase es la única obligatoria para que la verificación de matrícula funcione.

### 4. Configurar el correo (Gmail)

Para que se envíen los códigos de verificación al correo del estudiante:

1. Usa una cuenta de Gmail con [verificación en 2 pasos](https://myaccount.google.com/security) activada.
2. Ve a **Contraseñas de aplicaciones**: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Genera una contraseña de aplicación para “Correo” y copia las 16 caracteres.
4. En `.env.local` define:
   - `GMAIL_USER=tu_correo@gmail.com`
   - `GMAIL_APP_PASSWORD=las_16_letras_sin_espacios`
   - `GMAIL_FROM_NAME=Biblioteca CETYS` (o el nombre que quieras)

Si no configuras `GMAIL_USER` y `GMAIL_APP_PASSWORD`, la app seguirá funcionando en modo desarrollo: el código de verificación se mostrará en la consola del servidor y no se enviará correo.

### 5. Ejecutar la aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

- **Estudiantes**: página principal → elegir cubículo → elegir horario → matrícula → correo con código → completar reserva.
- **Administración**: `/admin-login` con `ADMIN_USER` y `ADMIN_PASS`. Desde ahí se gestionan reservas, cubículos, anuncios y lista de estudiantes (incluye carga CSV).

## Formato CSV para estudiantes

Para cargar o actualizar estudiantes desde el panel de administración, el CSV debe tener al menos la columna `matricula`. Opcionales: `nombre_abr` (o `nombre`), `cve_nivel`, `cve_programa`, `cve_departamento`, `activo`. Ejemplo:

```csv
matricula,nombre_abr,cve_nivel,cve_programa,cve_departamento,activo
13664,PÉREZ GARCÍA JUAN,PROF,LAE,ING,true
13665,LÓPEZ RODRÍGUEZ MARÍA,PREP,PREN,ECA,true
```

## Scripts útiles

- `npm run dev` – Desarrollo
- `npm run build` – Build de producción
- `npm run start` – Servidor de producción
- `npm run test` – Pruebas unitarias

## Estructura breve del proyecto

- `src/app/` – Páginas y rutas (App Router).
- `src/app/api/` – API Routes (verificación de matrícula, envío de correo, reservas, estudiantes, admin).
- `src/components/` – Componentes reutilizables.
- `src/lib/` – Lógica compartida: `cubiculos.ts` (cubículos, reservas y anuncios en localStorage), `students.ts` (Supabase, tabla `students`), `auth.ts`, `verification.ts`, esquemas y reservas.
- `supabase/migrations/` – SQL opcional para esquema completo en Supabase.

Con esto, cualquier persona que clone el repo y siga este README puede montar el proyecto con su propia base de datos en Supabase y su propio correo Gmail.
