// Supabase Edge Function: notificar-cita-admin
// Deno Runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.109.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* ============================================================
   UTILIDADES DE FORMATO
============================================================ */

const formatearFecha = (valor: string | undefined): string => {
  if (!valor) return "—";
  try {
    const partes = String(valor).split("-");
    if (partes.length === 3) {
      const anio = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const dia = Number(partes[2]);
      const fecha = new Date(anio, mes, dia);
      if (!Number.isNaN(fecha.getTime())) {
        return new Intl.DateTimeFormat("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(fecha);
      }
    }
  } catch {
    // Fallback
  }
  return String(valor);
};

const formatearHora = (valor: string | undefined): string => {
  if (!valor) return "—";
  try {
    const partes = String(valor).slice(0, 5).split(":");
    if (partes.length >= 2) {
      let horas = Number(partes[0]);
      const minutos = partes[1];
      const ampm = horas >= 12 ? "PM" : "AM";
      horas = horas % 12;
      horas = horas ? horas : 12;
      return `${horas}:${minutos} ${ampm}`;
    }
  } catch {
    // Fallback
  }
  return String(valor);
};

/* ============================================================
   PLANTILLA HTML DEL CORREO
============================================================ */

const generarHtmlCorreo = ({
  idCita,
  nombreCliente,
  telefonoCliente,
  correoCliente,
  vehiculoDesc,
  placas,
  fechaTexto,
  horaTexto,
  motivo,
  observaciones,
}: {
  idCita: string | number;
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente: string;
  vehiculoDesc: string;
  placas: string;
  fechaTexto: string;
  horaTexto: string;
  motivo: string;
  observaciones: string;
}) => {
  const anioActual = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Cita Agendada</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
    }
    .email-container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
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
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      text-transform: capitalize;
    }
    .badge-status {
      display: inline-block;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }
    .card-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-row {
      display: table;
      width: 100%;
      margin-bottom: 8px;
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
    }
    .info-value {
      display: table-cell;
      width: 65%;
      font-size: 14px;
      color: #0f172a;
      font-weight: 600;
    }
    .highlight-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 14px 16px;
      margin-top: 10px;
    }
    .highlight-box-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #1e40af;
      margin: 0 0 4px 0;
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
        <div>
          <span class="badge-status">Cita #${idCita}</span>
        </div>
      </div>

      <!-- DATOS DEL CLIENTE -->
      <div class="card-section">
        <h3 class="section-title">👤 Datos del Cliente</h3>
        <div class="info-row">
          <span class="info-label">Nombre:</span>
          <span class="info-value">${nombreCliente}</span>
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
          <span class="info-value">${vehiculoDesc}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Placas:</span>
          <span class="info-value">${placas}</span>
        </div>
      </div>

      <!-- DETALLE DEL SERVICIO -->
      <div class="card-section">
        <h3 class="section-title">📝 Detalle de la Solicitud</h3>
        <div class="info-row">
          <span class="info-label">Motivo:</span>
          <span class="info-value">${motivo}</span>
        </div>
        <div class="highlight-box">
          <p class="highlight-box-title">Observaciones del Cliente</p>
          <p class="highlight-box-content">${observaciones}</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">Mensaje automático enviado al administrador del sistema.</p>
      <p style="margin: 0;">Puedes gestionar esta cita en tu panel de administración de AutoMecanic.</p>
      <p style="margin: 12px 0 0; color: #94a3b8; font-size: 11px;">© ${anioActual} AutoMecanic. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/* ============================================================
   HANDLER PRINCIPAL
============================================================ */

serve(async (req: Request) => {
  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Obtener Secrets de entorno
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL");
    const BREVO_SENDER_NAME =
      Deno.env.get("BREVO_SENDER_NAME") || "AutoMecanic Notificaciones";
    let adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (!BREVO_API_KEY) {
      console.error("[notificar-cita-admin] Falta secret: BREVO_API_KEY");
      return new Response(
        JSON.stringify({
          error:
            "Falta configurar el secret BREVO_API_KEY en Supabase Edge Functions.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!BREVO_SENDER_EMAIL) {
      console.error("[notificar-cita-admin] Falta secret: BREVO_SENDER_EMAIL");
      return new Response(
        JSON.stringify({
          error:
            "Falta configurar el secret BREVO_SENDER_EMAIL (correo verificado en Brevo) en Supabase Edge Functions.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parsear el cuerpo de la petición
    const body = await req.json().catch(() => ({}));
    let { id_cita, cita, cliente, vehiculo } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Si se pasó id_cita y faltan datos, enriquecer desde la base de datos
    const idCitaNum = Number(id_cita || cita?.id_cita);

    if (idCitaNum && (!cita || !cliente || !vehiculo)) {
      const { data: citaDb } = await supabaseAdmin
        .from("cita")
        .select("*")
        .eq("id_cita", idCitaNum)
        .maybeSingle();

      if (citaDb) {
        cita = { ...citaDb, ...cita };
      }

      if (cita?.id_cliente && !cliente) {
        const { data: clienteDb } = await supabaseAdmin
          .from("cliente")
          .select("id_cliente, id_usuario, usuario(*)")
          .eq("id_cliente", cita.id_cliente)
          .maybeSingle();
        cliente = clienteDb;
      }

      if (cita?.id_vehiculo && !vehiculo) {
        const { data: vehiculoDb } = await supabaseAdmin
          .from("vehiculo")
          .select("*")
          .eq("id_vehiculo", cita.id_vehiculo)
          .maybeSingle();
        vehiculo = vehiculoDb;
      }
    }

    // 4. Si ADMIN_EMAIL no está en las variables de entorno, buscar en tabla usuario
    if (!adminEmail) {
      const { data: adminUser } = await supabaseAdmin
        .from("usuario")
        .select("correo")
        .eq("id_rol", 1)
        .eq("estatus", "Activo")
        .limit(1)
        .maybeSingle();

      if (adminUser?.correo) {
        adminEmail = adminUser.correo;
      }
    }

    if (!adminEmail) {
      console.error(
        "[notificar-cita-admin] No se pudo encontrar el correo del administrador."
      );
      return new Response(
        JSON.stringify({
          error:
            "No se encontró el correo del administrador. Configura el secret ADMIN_EMAIL en Supabase.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Preparar variables para el correo
    const idCitaFinal = cita?.id_cita || idCitaNum || "N/A";
    const usuarioCliente = cliente?.usuario;
    const nombreCliente = [
      usuarioCliente?.nombre,
      usuarioCliente?.apellido_paterno,
      usuarioCliente?.apellido_materno,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || "Cliente";

    const correoCliente = usuarioCliente?.correo || "";
    const telefonoCliente = usuarioCliente?.telefono || "Sin teléfono";

    const vehiculoDesc =
      [vehiculo?.marca, vehiculo?.modelo].filter(Boolean).join(" ").trim() ||
      "Vehículo no especificado";

    const placas = vehiculo?.placas || "Sin placas";
    const fechaTexto = formatearFecha(cita?.fecha);
    const horaTexto = formatearHora(cita?.hora);
    const motivo = cita?.motivo || "Revisión general";
    const observaciones = cita?.observaciones || "Sin observaciones adicionales";

    const subject = `📅 Nueva Cita: ${nombreCliente} - ${vehiculoDesc} (${placas})`;
    const htmlContent = generarHtmlCorreo({
      idCita: idCitaFinal,
      nombreCliente,
      telefonoCliente,
      correoCliente: correoCliente || "No proporcionado",
      vehiculoDesc,
      placas,
      fechaTexto,
      horaTexto,
      motivo,
      observaciones,
    });

    // 6. Enviar a Brevo Transactional Email API v3
    const brevoPayload: Record<string, unknown> = {
      sender: {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email: adminEmail.trim(),
          name: "Administrador AutoMecanic",
        },
      ],
      subject,
      htmlContent,
    };

    if (correoCliente && correoCliente.includes("@")) {
      brevoPayload.replyTo = {
        email: correoCliente.trim(),
        name: nombreCliente,
      };
    }

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(brevoPayload),
    });

    const brevoData = await brevoResponse.json().catch(() => null);

    if (!brevoResponse.ok) {
      console.error(
        "[notificar-cita-admin] Error devuelto por Brevo:",
        brevoResponse.status,
        brevoData
      );
      return new Response(
        JSON.stringify({
          error:
            brevoData?.message ||
            brevoData?.error ||
            `Error ${brevoResponse.status} de Brevo`,
          details: brevoData,
        }),
        {
          status: brevoResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      "[notificar-cita-admin] Correo enviado exitosamente mediante Brevo:",
      brevoData
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificación enviada al administrador.",
        messageId: brevoData?.messageId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[notificar-cita-admin] Excepción no controlada:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Error interno en la Edge Function",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
