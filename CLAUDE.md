# CLAUDE.md — Antigravity Gestión Interna

## Stack
- Next.js 15 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma v5.22.0 + Supabase PostgreSQL (pooler :6543)
- React Hook Form + Zod

## Arquitectura
- Server components para lecturas directas a DB
- API routes (`/api/...`) para todas las mutaciones (POST, PATCH, DELETE)
- `export const dynamic = "force-dynamic"` en `app/layout.tsx` — no remover
- Formularios: `z.coerce.number()` para campos numéricos (no `z.number()`)

## Base de datos
- `DATABASE_URL`: pooler Supabase `:6543?pgbouncer=true` (PgBouncer Transaction mode)
- `DIRECT_URL`: conexión directa `:5432` para migraciones
- Eliminar cliente/proveedor requiere borrar sus pagos primero (FK `onDelete: Restrict`)
- Comisiones tienen `onDelete: Cascade` desde PagoCliente/PagoProveedor

## Diseño UI/UX

### Principios
- Estética macOS: fondo `#fafafa`, bordes sutiles, sin sombras agresivas
- Idioma: español en toda la UI
- Moneda por defecto: USD

### Convenciones visuales
- `rounded-lg` en cards, `rounded-md` en inputs
- `shadow-sm` máximo — sin sombras fuertes
- Transiciones: `duration-150` para hover/nav, `duration-200` para lift de cards
- Animaciones bajo 300ms siempre
- Respetar `prefers-reduced-motion` (ya configurado en globals.css)

### Micro-interactions aplicadas
- Dashboard stat cards: `hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200`
- Filas de tabla: `hover:bg-neutral-50 transition-colors duration-100`
- Nav sidebar: `transition-all duration-150`

### Componentes clave
- **Sidebar activo**: `shadow-[inset_2px_0_0_0_#171717]` + `pl-[9px]` (borde izquierdo acento)
- **EstadoBadge**: dot de color + texto (no solo texto)
- **EmptyState**: borde punteado `border-dashed`, ícono en contenedor `rounded-xl`
- **Botones submit**: spinner `<Loader2 className="animate-spin" />` mientras `isSubmitting`
- **DeleteButton**: confirmación inline "¿Seguro? Sí / No", usa `window.location.href` tras borrar

### Focus / Accesibilidad
- Ring color: `#3b82f6` (azul visible, WCAG AA)
- Touch targets mínimo 44px en elementos interactivos
- Scrollbar: delgada (5px), sutil

### Colores de estado
- Completado: `bg-green-50 text-green-700 border-green-200` + dot `bg-green-500`
- Pendiente: `bg-yellow-50 text-yellow-700 border-yellow-200` + dot `bg-yellow-400`
- Cancelado: `bg-red-50 text-red-700 border-red-200` + dot `bg-red-400`

## Patrones a seguir
- Nuevas páginas de lista: incluir `DeleteButton iconOnly` al lado de "Ver" en cada fila
- Nuevos formularios: usar `PagoForm` / `PagoEditForm` como referencia
- Rutas temporales de datos (seed/fix): borrar inmediatamente después de usarlas
- No agregar `useRouter` si solo se necesita navegación post-acción — usar `window.location.href`
