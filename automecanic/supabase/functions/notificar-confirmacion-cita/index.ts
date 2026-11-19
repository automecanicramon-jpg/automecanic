import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.109.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);

const formatearFecha = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const formatearHora = (value: string) => {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return value;
  const ampm = hours >= 12 ? "p. m." : "a. m.";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
};

serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Método no permitido." }, 405);
  }

  try {
    const authorization = request.headers.get("Authorization");
    const token = authorization?.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const senderName = Deno.env.get("BREVO_SENDER_NAME") ||
      "AutoMecanic Notificaciones";

    if (!token || !supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: "No fue posible validar la sesión." }, 401);
    }

    if (!brevoApiKey || !senderEmail) {
      console.error(
        "[notificar-confirmacion-cita] Faltan BREVO_API_KEY o BREVO_SENDER_EMAIL.",
      );
      return jsonResponse({
        error: "El servicio de correo no está configurado.",
      }, 500);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();

    if (authError || !authData.user) {
      return jsonResponse({ error: "La sesión no es válida." }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: mechanicUser, error: mechanicUserError } = await adminClient
      .from("usuario")
      .select("id_usuario, id_rol, nombre, apellido_paterno, apellido_materno")
      .eq("auth_id", authData.user.id)
      .maybeSingle();

    if (mechanicUserError) throw mechanicUserError;
    if (!mechanicUser || Number(mechanicUser.id_rol) !== 2) {
      return jsonResponse({ error: "Solo un mecánico puede enviar esta notificación." }, 403);
    }

    const { data: mechanic, error: mechanicError } = await adminClient
      .from("mecanico")
      .select("id_mecanico")
      .eq("id_usuario", mechanicUser.id_usuario)
      .maybeSingle();

    if (mechanicError) throw mechanicError;
    if (!mechanic) {
      return jsonResponse({ error: "No se encontró el perfil del mecánico." }, 403);
    }

    const payload = await request.json().catch(() => ({}));
    const appointmentId = Number(payload?.id_cita);
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return jsonResponse({ error: "El identificador de la cita no es válido." }, 400);
    }

    const { data: appointment, error: appointmentError } = await adminClient
      .from("cita")
      .select("id_cita, id_cliente, id_vehiculo, id_mecanico, fecha, hora, motivo, estado")
      .eq("id_cita", appointmentId)
      .eq("id_mecanico", mechanic.id_mecanico)
      .maybeSingle();

    if (appointmentError) throw appointmentError;
    if (!appointment || appointment.estado !== "EN_ATENCION") {
      return jsonResponse({
        error: "La cita no está asignada a este mecánico o no fue confirmada.",
      }, 403);
    }

    const { data: customer, error: customerError } = await adminClient
      .from("cliente")
      .select("id_usuario")
      .eq("id_cliente", appointment.id_cliente)
      .maybeSingle();

    if (customerError) throw customerError;
    if (!customer?.id_usuario) {
      return jsonResponse({ error: "No se encontró el cliente de la cita." }, 404);
    }

    const { data: customerUser, error: customerUserError } = await adminClient
      .from("usuario")
      .select("nombre, apellido_paterno, apellido_materno, correo")
      .eq("id_usuario", customer.id_usuario)
      .maybeSingle();

    if (customerUserError) throw customerUserError;
    if (!customerUser?.correo || !customerUser.correo.includes("@")) {
      return jsonResponse({ error: "El cliente no tiene un correo válido." }, 400);
    }

    const { data: vehicle, error: vehicleError } = await adminClient
      .from("vehiculo")
      .select("marca, modelo, placas")
      .eq("id_vehiculo", appointment.id_vehiculo)
      .maybeSingle();

    if (vehicleError) throw vehicleError;

    const customerName = [
      customerUser.nombre,
      customerUser.apellido_paterno,
      customerUser.apellido_materno,
    ].filter(Boolean).join(" ").trim() || "Cliente";
    const mechanicName = [
      mechanicUser.nombre,
      mechanicUser.apellido_paterno,
      mechanicUser.apellido_materno,
    ].filter(Boolean).join(" ").trim() || "Tu mecánico";
    const vehicleName = [
      vehicle?.marca,
      vehicle?.modelo,
    ].filter(Boolean).join(" ").trim() || "tu vehículo";
    const date = formatearFecha(appointment.fecha);
    const time = formatearHora(appointment.hora);
    const subject = "El mecánico revisó tu solicitud de cita";
    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b">
        <h2 style="color:#0f172a">Tu solicitud de cita fue revisada</h2>
        <p>Hola ${escapeHtml(customerName)},</p>
        <p><strong>${escapeHtml(mechanicName)}</strong> ya revisó tu solicitud y confirmó que comenzará la atención de tu cita.</p>
        <p><strong>Fecha:</strong> ${escapeHtml(date)}<br>
        <strong>Hora:</strong> ${escapeHtml(time)}<br>
        <strong>Vehículo:</strong> ${escapeHtml(vehicleName)}${vehicle?.placas ? ` (${escapeHtml(vehicle.placas)})` : ""}<br>
        <strong>Motivo:</strong> ${escapeHtml(appointment.motivo || "Sin motivo especificado")}</p>
        <p>También puedes consultar el aviso en el módulo de Notificaciones de AutoMecanic.</p>
      </div>
    `;

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: customerUser.correo, name: customerName }],
        subject,
        htmlContent,
      }),
    });
    const emailResult = await emailResponse.json().catch(() => null);

    if (!emailResponse.ok) {
      console.error(
        "[notificar-confirmacion-cita] Brevo rechazó el correo:",
        emailResponse.status,
        emailResult,
      );
      return jsonResponse({
        error: emailResult?.message || "Brevo no pudo enviar el correo.",
      }, 502);
    }

    return jsonResponse({ success: true, messageId: emailResult?.messageId });
  } catch (error) {
    console.error("[notificar-confirmacion-cita] Error:", error);
    return jsonResponse({ error: "No fue posible enviar el correo de confirmación." }, 500);
  }
});
