# Sistema de Reserva de Cubículos - Biblioteca

Una aplicación web progresiva (PWA) para la reserva de cubículos de biblioteca desarrollada con Next.js 14, TypeScript, Supabase y Tailwind CSS.

## 🚀 Características

### Para Estudiantes
- **Autenticación segura** con Supabase Auth
- **Verificación de matrícula** contra lista blanca
- **Reserva de cubículos** con validación de conflictos
- **Gestión de reservas** (ver, cancelar)
- **PWA instalable** en dispositivos móviles
- **Interfaz responsive** optimizada para móviles

### Para Administradores
- **Panel de administración** con autenticación especial
- **Gestión de matrículas** con upload de Excel/CSV
- **Vista previa (dry-run)** antes de aplicar cambios
- **Gestión de cubículos** y horarios
- **Programación de cierres** de biblioteca
- **Logs de auditoría** completos

## 🛠️ Tecnologías

### Frontend
- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **TanStack Query** para manejo de estado
- **React Hook Form** + **Zod** para formularios
- **PWA** con next-pwa

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Edge Functions** para procesamiento de archivos
- **Row Level Security (RLS)** para seguridad
- **API Routes** de Next.js

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Git

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd cubiculos
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura las variables:

```bash
cp env.example .env.local
```

Edita `.env.local` con tus valores:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Backdoor (Development Only)
ADMIN_BACKDOOR_ENABLED=true
ADMIN_USER=admin
ADMIN_PASS=admin

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Supabase

#### Opción A: Supabase Local (Recomendado para desarrollo)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar proyecto
supabase init

# Iniciar Supabase local
npm run supabase:dev
```

#### Opción B: Supabase Cloud

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ejecuta las migraciones SQL en el SQL Editor:

```sql
-- Ejecutar supabase/migrations/001_initial_schema.sql
-- Ejecutar supabase/migrations/002_rls_policies.sql
-- Ejecutar supabase/migrations/003_seed_data.sql
```

### 5. Desplegar Edge Functions

```bash
# Para Supabase local
supabase functions deploy whitelist-dryrun
supabase functions deploy whitelist-apply

# Para Supabase cloud
supabase functions deploy whitelist-dryrun --project-ref your-project-ref
supabase functions deploy whitelist-apply --project-ref your-project-ref
```

### 6. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema (estudiantes y admins)
- **whitelist_matriculas**: Lista de matrículas autorizadas
- **rooms**: Cubículos disponibles
- **blackouts**: Cierres programados de biblioteca
- **reservations**: Reservas de cubículos
- **audit_log**: Logs de auditoría

### Políticas RLS

- Estudiantes solo pueden ver/gestionar sus propias reservas
- Solo usuarios verificados pueden crear reservas
- Administradores tienen acceso completo
- Operaciones de whitelist se realizan vía Edge Functions

## 📱 PWA (Progressive Web App)

La aplicación es completamente instalable como PWA:

- **Manifest**: Configurado en `public/manifest.json`
- **Service Worker**: Generado automáticamente por next-pwa
- **Offline Support**: Cache de recursos estáticos
- **Mobile Optimized**: Interfaz optimizada para móviles

### Instalación en Dispositivos

- **Android**: Abre en Chrome → Menú → "Agregar a pantalla de inicio"
- **iOS**: Abre en Safari → Compartir → "Agregar a pantalla de inicio"

## 🔐 Autenticación

### Estudiantes
1. Registro con email/contraseña
2. Verificación de matrícula contra whitelist
3. Acceso completo una vez verificado

### Administradores
- **Desarrollo**: Credenciales hardcodeadas (`admin/admin`)
- **Producción**: Rol `admin` en Supabase Auth

## 📊 Gestión de Matrículas

### Formato de Archivos

Los archivos Excel/CSV deben tener la siguiente estructura:

```csv
matricula,nombre
2024001234,Juan Pérez García
2024001235,María López Rodríguez
```

### Proceso de Actualización

1. **Upload**: Subir archivo Excel/CSV
2. **Dry-run**: Vista previa de cambios (insertar/actualizar/desactivar)
3. **Apply**: Aplicar cambios a la base de datos
4. **Audit**: Registro automático en logs de auditoría

## 🚀 Despliegue

### Vercel + Supabase

#### 1. Desplegar en Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel --prod
```

#### 2. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, agrega las variables de entorno:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BACKDOOR_ENABLED=false`
- `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`

#### 3. Configurar Dominio Personalizado (Opcional)

En Vercel Dashboard → Settings → Domains

#### 4. Configurar Supabase para Producción

1. Actualizar `NEXT_PUBLIC_APP_URL` en Supabase Auth settings
2. Configurar políticas CORS si es necesario
3. Desplegar Edge Functions a producción

## 🧪 Testing

### Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm run start

# Linting
npm run lint

# Type checking
npm run typecheck

# Supabase local
npm run supabase:dev
npm run supabase:stop
npm run supabase:reset
```

### Casos de Prueba

1. **Registro de estudiante** → Verificación de matrícula → Reserva exitosa
2. **Conflicto de reserva** → Validación de horarios superpuestos
3. **Límites de reserva** → Máximo por día/semana
4. **PWA instalable** → Funcionalidad offline básica
5. **Admin upload** → Dry-run → Aplicar cambios en whitelist

## 📁 Estructura del Proyecto

```
cubiculos/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/          # Rutas públicas
│   │   ├── (protected)/      # Rutas protegidas
│   │   ├── (admin)/          # Panel de administración
│   │   └── api/              # API Routes
│   ├── components/
│   │   └── ui/               # shadcn/ui components
│   └── lib/                  # Utilidades y configuraciones
├── supabase/
│   ├── migrations/           # Migraciones SQL
│   └── functions/            # Edge Functions
├── examples/                 # Archivos de ejemplo
├── public/                   # Assets estáticos
└── docs/                     # Documentación adicional
```

## 🔧 Configuración Avanzada

### Reglas de Reserva

Configurables en `src/lib/schemas.ts`:

```typescript
export const RESERVATION_RULES = {
  MIN_DURATION_MINUTES: 30,
  MAX_DURATION_MINUTES: 240, // 4 hours
  MAX_ADVANCE_DAYS: 7,
  MAX_RESERVATIONS_PER_DAY: 2,
  MAX_RESERVATIONS_PER_WEEK: 5,
  LIBRARY_HOURS: {
    OPEN: '08:00',
    CLOSE: '22:00',
  }
}
```

### Personalización de UI

- **Tema**: Modifica `src/app/globals.css`
- **Componentes**: Usa shadcn/ui CLI para agregar componentes
- **Colores**: Configura en `tailwind.config.js`

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de conexión a Supabase**
   - Verifica las variables de entorno
   - Confirma que el proyecto Supabase esté activo

2. **PWA no se instala**
   - Verifica que esté en HTTPS (requerido para PWA)
   - Revisa el manifest.json

3. **Edge Functions no funcionan**
   - Verifica que estén desplegadas
   - Revisa los logs en Supabase Dashboard

4. **RLS bloquea operaciones**
   - Verifica que el usuario esté autenticado
   - Confirma que tenga los permisos correctos

### Logs y Debugging

- **Frontend**: React Query DevTools (desarrollo)
- **Backend**: Supabase Dashboard → Logs
- **Edge Functions**: Supabase Dashboard → Edge Functions

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:

- **Issues**: Usa GitHub Issues
- **Documentación**: Revisa este README
- **Supabase**: [Documentación oficial](https://supabase.com/docs)

---

**Desarrollado con ❤️ para mejorar la experiencia de reserva de cubículos en bibliotecas**