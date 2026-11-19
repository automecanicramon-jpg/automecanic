# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Reportes mensuales automáticos

El primer día de cada mes a las 8:00 a. m. (hora de Ciudad de México), Supabase genera reportes de servicios e inspección de llantas del mes anterior, separados por mecánico y unidad. Los administradores reciben una alerta en la aplicación y un correo; cada reporte se consulta y exporta desde el historial del módulo Reportes.

Para habilitar el proceso en Supabase:

1. Despliega la función `generar-reportes-mensuales` desde `supabase/functions/generar-reportes-mensuales`.
2. Configura en los secretos de Edge Functions `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y, opcionalmente, `BREVO_SENDER_NAME` y `APP_URL`. Supabase proporciona `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Ejecuta `supabase/migrations/20261110000000_reportes_mensuales_mecanicos.sql` en el SQL Editor del proyecto. La migración crea las columnas de reportes, habilita Vault y crea el registro idempotente de entregas y el trabajo de Cron para las 14:00 UTC del día 1 (8:00 a. m. en Ciudad de México).
4. En Vault, guarda la service role key con el nombre `automecanic_service_role_key`. No la incluyas en el código ni en el repositorio.

La función puede ejecutarse manualmente con una solicitud autenticada usando la service role key y un cuerpo JSON opcional `{"mes": 11, "anio": 2026}` para reprocesar un periodo. Los periodos que ya finalizaron no se vuelven a enviar.

## Notificaciones de acciones del mecánico

El panel del administrador recibe en tiempo real las acciones del mecánico sobre clientes, vehículos, servicios, mantenimiento y citas. Cada acción genera una alerta para todos los administradores activos y un correo individual.

Las alertas nuevas guardan su fecha y hora real de registro por separado de la fecha programada. El cliente también recibe una alerta en su panel, en tiempo real, cuando una actividad del mecánico está asociada con uno de sus vehículos.

Para habilitar los correos:

1. Despliega la función `notificar-accion-mecanico` desde `supabase/functions/notificar-accion-mecanico`.
2. Despliega también `notificar-alerta-relacion-mecanico` desde `supabase/functions/notificar-alerta-relacion-mecanico`.
3. Configura los secretos de Edge Functions `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y, opcionalmente, `BREVO_SENDER_NAME` y `APP_URL`.
4. Ejecuta `supabase/migrations/20261117000000_notificar_acciones_mecanico_admin.sql`.
5. En Vault, guarda la service role key con el nombre `automecanic_service_role_key`. Las migraciones usan esta clave para invocar las funciones de correo desde los eventos de la base de datos.

Después de aplicar la migración anterior, ejecuta `supabase/migrations/20261117193000_alertas_fecha_real_y_cliente_mecanico.sql` para guardar la hora real y habilitar las alertas del cliente.

La migración reutiliza el canal de tiempo real de `alerta` y agrega el registro de acciones de clientes y citas que faltaba. Si falla el envío de correo, la alerta en el panel permanece disponible y el error queda en los logs de la Edge Function.

Ejecuta después `supabase/migrations/20261117200000_actividad_mecanico_fecha_registro_utc.sql` para convertir la hora de las actividades a `timestamptz`. Los valores existentes se interpretan como UTC, que es la zona del servidor de Supabase, y la interfaz los presenta en hora de Ciudad de México.

Finalmente, ejecuta `supabase/migrations/20261117203000_alertas_correo_cliente_mecanico.sql`. Las solicitudes de cita, observaciones, respuestas, cambios de estado y acciones del mecánico generan alertas en la aplicación y correos al destinatario activo correspondiente. Esta migración también notifica al cliente cuando el mecánico revisa o atiende una observación de transmisión. Ejecuta después `supabase/migrations/20261117220000_correo_acciones_cliente_mecanico.sql` para que las modificaciones de datos del cliente hechas por su mecánico y las cancelaciones de cita hechas por el cliente generen la alerta y el correo correspondientes.

Para que las propuestas de reprogramación hechas por el administrador también envíen correo al cliente, y la respuesta del cliente se envíe al administrador o mecánico que hizo la propuesta, ejecuta `supabase/migrations/20261118001000_correo_respuesta_reprogramacion_admin.sql` y vuelve a desplegar `notificar-alerta-relacion-mecanico`.

## Eliminación de mecánicos con historial

Ejecuta `supabase/migrations/20261119000000_eliminar_mecanico_con_historial.sql` y después `supabase/migrations/20261119001000_preservar_historial_mecanico.sql`; despliega la función `eliminar-personal-administrativo` desde `supabase/functions/eliminar-personal-administrativo`. La eliminación se bloquea mientras el mecánico tenga vehículos, clientes asignados o citas próximas/en atención. Se eliminan su perfil de usuario y su ficha activa; los servicios, las citas anteriores y las actividades no se borran, y conservan la atribución mediante una ficha histórica mínima con su nombre y especialidad. La cuenta de autenticación de Supabase también se elimina. Aplica las migraciones y despliega la función antes de usar la acción desde el panel.

## Notificaciones push

Las notificaciones push son opcionales y cada administrador, mecánico o cliente las activa desde su menú de perfil en cada dispositivo. Para configurarlas:

1. Genera un par de claves VAPID con `npx --yes web-push generate-vapid-keys`. Conserva la clave privada solo en Supabase; la pública se usa en el frontend.
2. En Vercel, agrega `VITE_VAPID_PUBLIC_KEY` con la clave pública y vuelve a desplegar. Para desarrollo local, agrega la misma variable pública al `.env` local, que no se debe publicar.
3. En Supabase → Edge Functions → Secrets, agrega `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` (por ejemplo, `mailto:soporte@tu-dominio.com`). No compartas ni agregues la clave privada al frontend.
4. En Supabase → SQL Editor, ejecuta `supabase/migrations/20261120000000_notificaciones_push.sql`. Esta migración usa el secreto Vault `automecanic_service_role_key` ya configurado para invocar la función después de insertar una alerta.
5. Despliega `send-push-notification` desde `supabase/functions/send-push-notification` y publica el frontend en Vercel.
6. Abre AutoMecanic en HTTPS, inicia sesión y en el menú de perfil pulsa **Activar notificaciones**; acepta el permiso del navegador. En iPhone/iPad instala primero la web en la pantalla de inicio. El contador numérico del icono se muestra solo si el sistema operativo y el navegador ofrecen la API de insignia.

La aplicación envía una notificación del sistema por cada nueva alerta dirigida a la cuenta. Las suscripciones se guardan por usuario y dispositivo; el usuario puede desactivarlas desde el mismo menú de perfil.
