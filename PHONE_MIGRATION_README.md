# Migración de Números de Teléfono a Formato WhatsApp

Este documento explica cómo migrar los números de teléfono existentes en la base de datos para que sean compatibles con el formato de WhatsApp (con código de país 521).

## Problema

Los números de WhatsApp llegan con código de país completo (ej: `5215563192945`) pero en la base de datos están guardados sin él (ej: `5563192945`). Esto causa que la búsqueda de invitados falle.

## Solución

Se han implementado las siguientes mejoras:

### 1. Normalización Automática en Strapi

- **Archivo modificado**: `src/api/guest/services/guest.js`
- **Función agregada**: `normalizePhoneToWhatsApp()`
- **Funcionalidad**: Todos los números nuevos se guardarán automáticamente con formato `521XXXXXXXXXX`

### 2. Búsqueda Mejorada en WhatsApp Service

- **Archivo modificado**: `whatsapp-service/src/utils/strapiApi.ts`
- **Funcionalidad**: Búsqueda prioritaria con número normalizado, fallback a variaciones

### 3. Migración de Datos Existentes

- **Migración de DB**: `database/migrations/001_normalize_phone_numbers.js`
- **Script manual**: `scripts/run-phone-migration.js`

## Instrucciones de Migración

### Opción 1: Migración Automática de Base de Datos

```bash
# Navegar al directorio de Strapi
cd invitation-strapi

# Ejecutar la migración usando Strapi CLI
npx strapi database:migrate
```

### Opción 2: Script Manual

```bash
# Navegar al directorio de Strapi
cd invitation-strapi

# Ejecutar el script de migración
node scripts/run-phone-migration.js
```

### Opción 3: Script Standalone (deprecado)

```bash
# Navegar al directorio de Strapi
cd invitation-strapi

# Ejecutar el script standalone
node scripts/migrate-phone-numbers.js
```

## Verificación

Después de ejecutar la migración:

1. **Verificar en la base de datos**: Los números deben tener formato `521XXXXXXXXXX`
2. **Probar en WhatsApp**: Los mensajes de botones deben encontrar a los invitados correctamente
3. **Logs**: Revisar que no aparezcan errores de "No guest found"

## Formato de Números

### Antes de la migración:
- `5563192945` (10 dígitos)
- `15563192945` (11 dígitos con 1 inicial)
- `525563192945` (12 dígitos con 52)

### Después de la migración:
- `5215563192945` (13 dígitos con 521)

## Logs de Ejemplo

```
🚀 Starting phone number migration...
📊 Found 25 guests to process
✅ Updated Maria Garcia (ID: abc123): 5563192945 → 5215563192945
✅ Updated Juan Lopez (ID: def456): 15563192945 → 5215563192945
⏩ Skipping Ana Ruiz (ID: ghi789) - phone already normalized: 5215563192945

📋 Migration Summary:
✅ Updated: 20
⏩ Skipped: 5
❌ Errors: 0
📊 Total processed: 25
🎉 Migration completed successfully!
```

## Rollback

Si necesitas revertir la migración, puedes ejecutar una consulta SQL:

```sql
-- Para revertir números de 521XXXXXXXXXX a XXXXXXXXXX
UPDATE guests 
SET phone = SUBSTRING(phone, 4) 
WHERE phone LIKE '521%' AND LENGTH(phone) = 13;
```

## Notas Importantes

- ⚠️ **Hacer backup** de la base de datos antes de ejecutar la migración
- ✅ La migración es **idempotente** (se puede ejecutar múltiples veces sin problemas)
- 🔄 Los nuevos contactos se normalizarán automáticamente al crearlos
- 📱 Los números ya normalizados no se modificarán