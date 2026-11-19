import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.109.0";

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
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const authorization = request.headers.get("Authorization");

  if (
    !serviceRoleKey ||
    !supabaseUrl ||
    authorization !== `Bearer ${serviceRoleKey}`
  ) {
    return respond({ success: false, error: "Solicitud no autorizada." }, 401);
  }

  const apiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") || "AutoMecanic Notificaciones";

  if (!apiKey || !senderEmail) {
    console.error("[notificar-accion-mecanico] Faltan BREVO_API_KEY o BREVO_SENDER_EMAIL.");
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
      .select("id_alerta, id_usuario, tipo_alerta, mensaje, fecha_programada")
      .eq("id_alerta", alertId)
      .eq("tipo_alerta", "ACCION_MECANICO")
      .maybeSingle();

    if (alertError) {
      throw alertError;
    }

    if (!alert) {
      return respond({ success: false, error: "No se encontró la alerta de acción del mecánico." }, 404);
    }

    const { data: admin, error: adminError } = await adminClient
      .from("usuario")
      .select("nombre, apellido_paterno, apellido_materno, correo")
      .eq("id_usuario", alert.id_usuario)
      .eq("id_rol", 1)
      .eq("estatus", "Activo")
      .maybeSingle();

    if (adminError) {
      throw adminError;
    }

    if (!admin?.correo) {
      return respond({ success: false, error: "El administrador destinatario no tiene un correo activo." }, 409);
    }

    const adminName = [
      admin.nombre,
      admin.apellido_paterno,
      admin.apellido_materno,
    ].filter(Boolean).join(" ").trim() || "Administrador";
    const safeAdminName = escapeHtml(adminName);
    const safeMessage = escapeHtml(alert.mensaje || "Se registró una acción del mecánico.");
    const appUrl = Deno.env.get("APP_URL");
    const safeAppUrl = appUrl ? escapeHtml(appUrl) : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head><meta charset="UTF-8"><title>Actividad del mecánico</title></head>
        <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b">
          <main style="max-width:600px;margin:auto;padding:28px;background:#fff;border:1px solid #e2e8f0;border-radius:12px">
            <p style="margin:0 0 8px;color:#15803d;font-weight:700">AUTOMECANIC · ACTIVIDAD DEL MECÁNICO</p>
            <h1 style="margin:0 0 20px;font-size:22px">Hola, ${safeAdminName}</h1>
            <p style="margin:0 0 12px">Se registró una acción en el sistema:</p>
            <div style="padding:16px;background:#f8fafc;border-left:4px solid #16a34a;border-radius:6px;line-height:1.6">
              ${safeMessage}
            </div>
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
        to: [{ email: admin.correo, name: adminName }],
        subject: "AutoMecanic: nueva acción del mecánico",
        htmlContent,
      }),
    });

    const responseBody = await response.json().catch(() => null);
    if (!response.ok) {
      console.error(
        "[notificar-accion-mecanico] Brevo rechazó el correo:",
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
    console.error("[notificar-accion-mecanico] Error procesando el correo:", error);
    return respond({
      success: false,
      error: error instanceof Error ? error.message : "No fue posible enviar el correo.",
    }, 500);
  }
});
