// Supabase Edge Function: enviar-correo-cita
// Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.109.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL");
    const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") || "AutoMecanic Notificaciones";
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

    if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
      return new Response(
        JSON.stringify({
          error: "Faltan las variables BREVO_API_KEY o BREVO_SENDER_EMAIL en los secrets de Supabase.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { cita, cliente, vehiculo } = await req.json();

    if (!cita) {
      return new Response(
        JSON.stringify({ error: "No se proporcionaron los datos de la cita." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determinar correo del administrador destinatario
    let destinoAdmin = ADMIN_EMAIL;
    if (!destinoAdmin) {
      // Consultar usuario administrador en Supabase
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: adminUser } = await supabaseClient
        .from("usuario")
        .select("correo")
        .eq("id_rol", 1)
        .eq("estatus", "Activo")
        .limit(1)
        .maybeSingle();

      destinoAdmin = adminUser?.correo;
    }

    if (!destinoAdmin) {
      return new Response(
        JSON.stringify({ error: "No se pudo determinar el correo del administrador." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nombreCliente = [
      cliente?.usuario?.nombre,
      cliente?.usuario?.apellido_paterno,
      cliente?.usuario?.apellido_materno,
    ].filter(Boolean).join(" ") || "Cliente";

    const vehiculoDesc = [vehiculo?.marca, vehiculo?.modelo].filter(Boolean).join(" ") || "Vehículo no especificado";
    const placas = vehiculo?.placas ? ` (${vehiculo.placas})` : "";
    const subject = `📅 Nueva Cita: ${nombreCliente} - ${vehiculoDesc}${placas}`;

    // Llamada directa al API de Brevo
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: destinoAdmin,
            name: "Administrador AutoMecanic",
          },
        ],
        replyTo: cliente?.usuario?.correo
          ? {
              email: cliente.usuario.correo,
              name: nombreCliente,
            }
          : undefined,
        subject,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a; margin-top: 0;">📅 Nueva Cita Agendada #${cita?.id_cita}</h2>
            <p style="color: #64748b;">Un cliente ha solicitado una cita en el taller.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p><strong>Fecha y Hora:</strong> ${cita?.fecha} a las ${cita?.hora}</p>
            <p><strong>Cliente:</strong> ${nombreCliente} (${cliente?.usuario?.telefono || "Sin tel."} / ${cliente?.usuario?.correo || "Sin correo"})</p>
            <p><strong>Vehículo:</strong> ${vehiculoDesc} - Placas: ${vehiculo?.placas || "Sin placas"}</p>
            <p><strong>Motivo:</strong> ${cita?.motivo || "No especificado"}</p>
            <p><strong>Observaciones:</strong> ${cita?.observaciones || "Sin observaciones"}</p>
          </div>
        `,
      }),
    });

    const brevoData = await brevoRes.json();

    return new Response(JSON.stringify(brevoData), {
      status: brevoRes.ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
