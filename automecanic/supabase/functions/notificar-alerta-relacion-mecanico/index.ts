import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.109.0";

const recipientRolesByAlertType: Record<string, number | number[]> = {
  CITA_NUEVA: 2,
  TRANSMISION_CLIENTE: 2,
  CITA_REPROGRAMACION_RESPUESTA: [1, 2],
  CITA_CANCELADA_CLIENTE: 2,
  ACCION_MECANICO_CLIENTE: 3,
  CITA_CONFIRMADA_MECANICO: 3,
  CITA_REPROGRAMACION_PROPUESTA: 3,
  CITA_RECHAZADA_MECANICO: 3,
  CITA_CANCELADA: 3,
  CITA_VISTA_MECANICO: 3,
  TRANSMISION_VISTA_MECANICO: 3,
  OBSERVACION_TRANSMISION_MECANICO: 3,
};

const titleByAlertType: Record<string, string> = {
  CITA_NUEVA: "Nueva solicitud de cita",
  TRANSMISION_CLIENTE: "Nueva observación de transmisión",
  CITA_REPROGRAMACION_RESPUESTA: "Respuesta a una propuesta de cita",
  CITA_CANCELADA_CLIENTE: "Cita cancelada por el cliente",
  ACCION_MECANICO_CLIENTE: "Actividad del mecánico en tu vehículo",
  CITA_CONFIRMADA_MECANICO: "Solicitud de cita revisada",
  CITA_REPROGRAMACION_PROPUESTA: "Propuesta para cambiar una cita",
  CITA_RECHAZADA_MECANICO: "Aviso sobre una solicitud de cita",
  CITA_CANCELADA: "Cita cancelada",
  CITA_VISTA_MECANICO: "Solicitud de cita vista por el mecánico",
  TRANSMISION_VISTA_MECANICO: "Observación vista por el mecánico",
  OBSERVACION_TRANSMISION_MECANICO: "Actualización de una observación",
};

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);

serve(async request => {
  if (request.method !== "POST") {
    return respond({ success: false, error: "Método no permitido." }, 405);
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const configuredServiceRoleKey = Deno.env.get("automecanic_service_role_key");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const authorization = request.headers.get("Authorization");
  const acceptedServiceRoleKeys = [
    serviceRoleKey,
    configuredServiceRoleKey,
  ].filter((key): key is string => Boolean(key));

  if (
    !supabaseUrl ||
    !authorization ||
    !acceptedServiceRoleKeys.some(key => authorization === `Bearer ${key}`)
  ) {
    return respond({ success: false, error: "Solicitud no autorizada." }, 401);
  }

  const apiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") || "AutoMecanic Notificaciones";

  if (!apiKey || !senderEmail) {
    console.error("[notificar-alerta-relacion-mecanico] Faltan secretos de Brevo.");
    return respond({
      success: false,
      error: "No está configurado el servicio de correo.",
    }, 500);
  }

  try {
    const body = await request.json();
    const alertId = Number(body.id_alerta);

    if (!Number.isInteger(alertId) || alertId <= 0) {
      return respond({ success: false, error: "El identificador de alerta no es válido." }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: alert, error: alertError } = await adminClient
      .from("alerta")
      .select("id_alerta, id_usuario, tipo_alerta, mensaje, fecha_registro")
      .eq("id_alerta", alertId)
      .maybeSingle();

    if (alertError) throw alertError;
    if (!alert) {
      return respond({ success: false, error: "No se encontró la alerta." }, 404);
    }

    const configuredRecipientRoles = recipientRolesByAlertType[alert.tipo_alerta];
    if (!configuredRecipientRoles) {
      return respond({ success: false, error: "El tipo de alerta no admite este correo." }, 400);
    }
    const recipientRoles = Array.isArray(configuredRecipientRoles)
      ? configuredRecipientRoles
      : [configuredRecipientRoles];

    const { data: recipient, error: recipientError } = await adminClient
      .from("usuario")
      .select("id_usuario, id_rol, nombre, apellido_paterno, apellido_materno, correo, estatus")
      .eq("id_usuario", alert.id_usuario)
      .in("id_rol", recipientRoles)
      .eq("estatus", "Activo")
      .maybeSingle();

    if (recipientError) throw recipientError;
    if (!recipient?.correo) {
      return respond({ success: false, error: "El destinatario no tiene un correo activo." }, 409);
    }

    const recipientName = [
      recipient.nombre,
      recipient.apellido_paterno,
      recipient.apellido_materno,
    ].filter(Boolean).join(" ").trim() ||
      (Number(recipient.id_rol) === 1
        ? "Administrador"
        : Number(recipient.id_rol) === 2
          ? "Mecánico"
          : "Cliente");
    const title = titleByAlertType[alert.tipo_alerta] || "Nueva notificación";
    const safeRecipientName = escapeHtml(recipientName);
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(alert.mensaje || "Tienes una nueva notificación en AutoMecanic.");
    const appUrl = Deno.env.get("APP_URL");
    const safeAppUrl = appUrl && /^https?:\/\//i.test(appUrl)
      ? escapeHtml(appUrl)
      : "";
    const registeredAt = alert.fecha_registro
      ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }).format(new Date(alert.fecha_registro))
      : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head><meta charset="UTF-8"><title>${safeTitle}</title></head>
        <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b">
          <main style="max-width:600px;margin:auto;padding:28px;background:#fff;border:1px solid #e2e8f0;border-radius:12px">
            <p style="margin:0 0 8px;color:#15803d;font-weight:700">AUTOMECANIC · NOTIFICACIÓN</p>
            <h1 style="margin:0 0 20px;font-size:22px">Hola, ${safeRecipientName}</h1>
            <h2 style="margin:0 0 12px;font-size:18px">${safeTitle}</h2>
            <div style="padding:16px;background:#f8fafc;border-left:4px solid #16a34a;border-radius:6px;line-height:1.6">${safeMessage}</div>
            ${registeredAt ? `<p style="color:#64748b;font-size:13px">Registrado: ${escapeHtml(registeredAt)}</p>` : ""}
            ${safeAppUrl ? `<p style="margin:20px 0 0"><a href="${safeAppUrl}" style="color:#15803d">Abrir AutoMecanic</a></p>` : ""}
          </main>
        </body>
      </html>
    `.trim();

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: recipient.correo, name: recipientName }],
        subject: `AutoMecanic: ${title}`,
        htmlContent,
      }),
    });

    const responseBody = await response.json().catch(() => null);
    if (!response.ok) {
      console.error(
        "[notificar-alerta-relacion-mecanico] Brevo rechazó el correo:",
        response.status,
        responseBody,
      );
      return respond({
        success: false,
        error: responseBody?.message || `Brevo respondió con HTTP ${response.status}.`,
      }, 502);
    }

    return respond({ success: true, id_alerta: alertId });
  } catch (error) {
    console.error("[notificar-alerta-relacion-mecanico] Error procesando el correo:", error);
    return respond({
      success: false,
      error: error instanceof Error ? error.message : "No fue posible enviar el correo.",
    }, 500);
  }
});
