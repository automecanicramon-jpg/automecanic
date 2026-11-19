import { supabase } from './supabase.js'

/* ============================================================
   CONFIGURACIÓN DE BREVO
============================================================ */

/**
 * Lee la configuración de Brevo desde las variables de entorno de Vite (.env).
 * Si alguna no está definida, toma valores por defecto o null.
 */
export const obtenerConfiguracionBrevo = () => {
  const apiKey =
    import.meta.env.VITE_BREVO_API_KEY || ''

  const senderEmail =
    import.meta.env.VITE_BREVO_SENDER_EMAIL || ''

  const senderName =
    import.meta.env.VITE_BREVO_SENDER_NAME || 'AutoMecanic Taller'

  const adminEmail =
    import.meta.env.VITE_ADMIN_EMAIL || ''

  return {
    apiKey,
    senderEmail,
    senderName,
    adminEmail
  }
}

/* ============================================================
   UTILIDADES DE FORMATO PARA EL CORREO
============================================================ */

const formatearFecha = valor => {
  if (!valor) return '—'
  const partes = String(valor).split('-')
  if (partes.length === 3) {
    const anio = Number(partes[0])
    const mes = Number(partes[1]) - 1
    const dia = Number(partes[2])
    const fecha = new Date(anio, mes, dia)
    if (!Number.isNaN(fecha.getTime())) {
      return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(fecha)
    }
  }

  return String(valor)
}

const formatearHora = valor => {
  if (!valor) return '—'
  const partes = String(valor).slice(0, 5).split(':')
  if (partes.length >= 2) {
    let horas = Number(partes[0])
    const minutos = partes[1]
    const ampm = horas >= 12 ? 'PM' : 'AM'
    horas = horas % 12
    horas = horas ? horas : 12
    return `${horas}:${minutos} ${ampm}`
  }
  return String(valor)
}

const obtenerNombreCompletoCliente = cliente => {
  const usuario = cliente?.usuario
  if (!usuario) {
    return cliente?.id_cliente ? `Cliente #${cliente.id_cliente}` : 'Cliente'
  }

  return [
    usuario.nombre,
    usuario.apellido_paterno,
    usuario.apellido_materno
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Cliente'
}

const obtenerDescripcionVehiculo = vehiculo => {
  if (!vehiculo) return 'Vehículo no especificado'
  const datos = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ')
  return datos || vehiculo.placas || `Vehículo #${vehiculo.id_vehiculo || ''}`
}

/* ============================================================
   PLANTILLA HTML DEL CORREO PARA EL ADMINISTRADOR
============================================================ */

export const generarPlantillaCitaAdmin = ({
  cita,
  cliente,
  vehiculo
}) => {
  const nombreCliente = obtenerNombreCompletoCliente(cliente)
  const correoCliente = cliente?.usuario?.correo || 'No proporcionado'
  const telefonoCliente = cliente?.usuario?.telefono || 'No proporcionado'
  const vehiculoTexto = obtenerDescripcionVehiculo(vehiculo)
  const placas = vehiculo?.placas || 'Sin placas'
  const fechaTexto = formatearFecha(cita?.fecha)
  const horaTexto = formatearHora(cita?.hora)
  const motivo = cita?.motivo || 'Revisión general / servicio'
  const observaciones = cita?.observaciones || 'Sin observaciones adicionales'
  const idCita = cita?.id_cita || 'N/A'
  const anioActual = new Date().getFullYear()

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Cita Solicitada</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 32px 28px;
      text-align: center;
      border-bottom: 4px solid #2563eb;
    }
    .header-badge {
      display: inline-block;
      background: rgba(37, 99, 235, 0.25);
      border: 1px solid #3b82f6;
      color: #93c5fd;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 5px 14px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0;
      font-size: 14px;
      color: #94a3b8;
    }
    .body {
      padding: 32px 28px;
    }
    .appointment-callout {
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      border-radius: 8px;
      padding: 18px 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .callout-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin: 0 0 4px 0;
    }
    .callout-time {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      text-transform: capitalize;
    }
    .card-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .info-row {
      display: table;
      width: 100%;
      margin-bottom: 10px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      display: table-cell;
      width: 35%;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
      padding-bottom: 6px;
    }
    .info-value {
      display: table-cell;
      width: 65%;
      font-size: 14px;
      color: #0f172a;
      font-weight: 600;
      padding-bottom: 6px;
    }
    .highlight-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 14px 16px;
      margin-top: 14px;
    }
    .highlight-box-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #1e40af;
      margin: 0 0 6px 0;
    }
    .highlight-box-content {
      font-size: 14px;
      color: #1e3a8a;
      margin: 0;
      line-height: 1.5;
    }
    .footer {
      background: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    .footer strong {
      color: #334155;
    }
    .badge-status {
      display: inline-block;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }
    a.action-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-badge">Notificación de Cita</div>
      <h1>Nueva Cita Agendada</h1>
      <p>Un cliente ha solicitado una cita desde su panel de clientes</p>
    </div>

    <div class="body">
      <div class="appointment-callout">
        <div>
          <p class="callout-title">Fecha y Hora Programada</p>
          <p class="callout-time">${fechaTexto} · ${horaTexto}</p>
        </div>
        <div style="text-align: right;">
          <span class="badge-status">Cita #${idCita}</span>
        </div>
      </div>

      <!-- DATOS DEL CLIENTE -->
      <div class="card-section">
        <h3 class="section-title">👤 Datos del Cliente</h3>
        <div class="info-row">
          <span class="info-label">Nombre:</span>
          <span class="info-value"><strong>${nombreCliente}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Teléfono:</span>
          <span class="info-value">
            <a href="tel:${telefonoCliente}" class="action-link">${telefonoCliente}</a>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Correo:</span>
          <span class="info-value">
            <a href="mailto:${correoCliente}" class="action-link">${correoCliente}</a>
          </span>
        </div>
      </div>

      <!-- DATOS DEL VEHÍCULO -->
      <div class="card-section">
        <h3 class="section-title">🚗 Datos del Vehículo</h3>
        <div class="info-row">
          <span class="info-label">Vehículo:</span>
          <span class="info-value">${vehiculoTexto}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Placas:</span>
          <span class="info-value"><strong>${placas}</strong></span>
        </div>
      </div>

      <!-- DETALLE DEL SERVICIO SOLICITADO -->
      <div class="card-section">
        <h3 class="section-title">📝 Detalle de la Cita</h3>
        <div class="info-row">
          <span class="info-label">Motivo:</span>
          <span class="info-value"><strong>${motivo}</strong></span>
        </div>
        <div class="highlight-box">
          <p class="highlight-box-title">Observaciones del Cliente</p>
          <p class="highlight-box-content">${observaciones}</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">Este es un mensaje automático generado por <strong>AutoMecanic</strong>.</p>
      <p style="margin: 0;">Puedes consultar o gestionar esta cita en tu panel de administración.</p>
      <p style="margin: 12px 0 0; color: #94a3b8; font-size: 11px;">© ${anioActual} AutoMecanic. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/* ============================================================
   RESOLVER CORREO DEL ADMINISTRADOR
============================================================ */

/**
 * Intenta obtener el correo del administrador:
 * 1. Desde VITE_ADMIN_EMAIL.
 * 2. Si no está configurado, busca en la tabla usuario (id_rol = 1).
 */
export const resolverCorreoAdmin = async () => {
  const { adminEmail } = obtenerConfiguracionBrevo()

  if (adminEmail && adminEmail.includes('@')) {
    return adminEmail.trim()
  }

  try {
    const { data: adminUser, error } = await supabase
      .from('usuario')
      .select('correo, nombre')
      .eq('id_rol', 1)
      .eq('estatus', 'Activo')
      .limit(1)
      .maybeSingle()

    if (!error && adminUser?.correo) {
      return adminUser.correo.trim()
    }
  } catch (err) {
    console.warn('[Brevo] No se pudo consultar el correo del administrador desde la base de datos:', err)
  }

  return null
}

/* ============================================================
   ENVIAR CORREO MEDIANTE API DE BREVO
============================================================ */

/**
 * Envía un correo transaccional utilizando el API REST v3 de Brevo.
 * Endpoint: POST https://api.brevo.com/v3/smtp/email
 */
export const enviarCorreoBrevo = async ({
  toEmail,
  toName = 'Administrador AutoMecanic',
  subject,
  htmlContent,
  replyTo = null
}) => {
  const { apiKey, senderEmail, senderName } = obtenerConfiguracionBrevo()

  if (!apiKey) {
    console.warn(
      '[Brevo] Falta configurar VITE_BREVO_API_KEY en tu archivo .env. El correo no pudo ser enviado.'
    )
    return {
      success: false,
      error: 'VITE_BREVO_API_KEY no está configurada.'
    }
  }

  if (!senderEmail) {
    console.warn(
      '[Brevo] Falta configurar VITE_BREVO_SENDER_EMAIL en tu archivo .env. Debe ser un correo verificado en tu cuenta de Brevo.'
    )
    return {
      success: false,
      error: 'VITE_BREVO_SENDER_EMAIL no está configurada.'
    }
  }

  if (!toEmail) {
    console.warn(
      '[Brevo] No se especificó el correo electrónico de destino para el administrador.'
    )
    return {
      success: false,
      error: 'Correo de destino no especificado.'
    }
  }

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [
      {
        email: toEmail,
        name: toName
      }
    ],
    subject,
    htmlContent
  }

  if (replyTo && replyTo.email) {
    payload.replyTo = {
      email: replyTo.email,
      name: replyTo.name || replyTo.email
    }
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const mensajeError =
        data?.message || data?.error || `Error HTTP ${response.status} de Brevo`
      console.error('[Brevo] Error al enviar correo:', mensajeError, data)
      return {
        success: false,
        error: mensajeError,
        data
      }
    }

    console.log('[Brevo] Correo enviado exitosamente al administrador:', data)
    return {
      success: true,
      messageId: data?.messageId,
      data
    }
  } catch (error) {
    console.error('[Brevo] Error de red o conexión al enviar correo:', error)
    return {
      success: false,
      error: error?.message || 'Error de conexión con el API de Brevo'
    }
  }
}

/* ============================================================
   FUNCIÓN PRINCIPAL: NOTIFICAR AL ADMINISTRADOR NUEVA CITA
============================================================ */

/**
 * Notifica al administrador cuando un cliente agenda una nueva cita.
 *
 * @param {Object} params
 * @param {Object} params.cita - Objeto con los datos de la cita insertada (id_cita, fecha, hora, motivo, observaciones, etc.)
 * @param {Object} params.cliente - Objeto con los datos del cliente y su usuario (nombre, teléfono, correo)
 * @param {Object} params.vehiculo - Objeto con los datos del vehículo (marca, modelo, placas)
 */
export const enviarNotificacionNuevaCitaAdmin = async ({
  cita,
  cliente,
  vehiculo
}) => {
  try {
    // 1. Intentar enviar vía Edge Function de Supabase (notificar-cita-admin)
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
        'notificar-cita-admin',
        {
          body: {
            id_cita: cita?.id_cita,
            cita,
            cliente,
            vehiculo
          }
        }
      )

      if (!edgeError && edgeData) {
        console.log('[Supabase Edge Function] Notificación enviada con éxito:', edgeData)
        return { success: true, via: 'edge-function', data: edgeData }
      }
    } catch {
      // Si la Edge Function no está disponible, continuar con fallback
    }

    // 2. Envío directo mediante API REST de Brevo (utiliza variables en .env)
    const adminEmail = await resolverCorreoAdmin()

    if (!adminEmail) {
      console.warn(
        '[Brevo] No se pudo determinar el correo del administrador. Configura VITE_ADMIN_EMAIL en el archivo .env.'
      )
      return {
        success: false,
        error: 'No se encontró el correo del administrador.'
      }
    }

    const nombreCliente = obtenerNombreCompletoCliente(cliente)
    const vehiculoDesc = obtenerDescripcionVehiculo(vehiculo)
    const placas = vehiculo?.placas ? ` (${vehiculo.placas})` : ''

    const subject = `📅 Nueva Cita: ${nombreCliente} - ${vehiculoDesc}${placas}`
    const htmlContent = generarPlantillaCitaAdmin({
      cita,
      cliente,
      vehiculo
    })

    const replyTo = cliente?.usuario?.correo
      ? {
          email: cliente.usuario.correo,
          name: nombreCliente
        }
      : null

    return await enviarCorreoBrevo({
      toEmail: adminEmail,
      toName: 'Administrador AutoMecanic',
      subject,
      htmlContent,
      replyTo
    })
  } catch (error) {
    console.error('[Brevo] Excepción al notificar nueva cita al administrador:', error)
    return {
      success: false,
      error: error?.message || 'Excepción no controlada al enviar notificación'
    }
  }
}
