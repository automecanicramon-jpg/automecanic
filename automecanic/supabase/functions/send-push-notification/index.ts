import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.109.0";
import webpush from "npm:web-push@3.6.7";

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

serve(async request => {
  if (request.method !== "POST") {
    return respond({ success: false, error: "Método no permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT");

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    authorization !== `Bearer ${serviceRoleKey}`
  ) {
    return respond({ success: false, error: "Solicitud no autorizada." }, 401);
  }

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error("Faltan secretos VAPID para enviar notificaciones push.");
    return respond({
      success: false,
      error: "El servicio de notificaciones push no está configurado.",
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
      .select("id_alerta, id_usuario, tipo_alerta, mensaje")
      .eq("id_alerta", alertId)
      .maybeSingle();

    if (alertError) throw alertError;
    if (!alert?.id_usuario) {
      return respond({ success: false, error: "No se encontró el destinatario de la alerta." }, 404);
    }

    const { data: user, error: userError } = await adminClient
      .from("usuario")
      .select("estatus")
      .eq("id_usuario", alert.id_usuario)
      .maybeSingle();

    if (userError) throw userError;
    if (!user || user.estatus !== "Activo") {
      return respond({ success: true, sent: 0, reason: "inactive_user" });
    }

    const [
      subscriptionsResult,
      unreadResult,
    ] = await Promise.all([
      adminClient
        .from("push_subscription")
        .select("endpoint, p256dh, auth")
        .eq("id_usuario", alert.id_usuario),
      adminClient
        .from("alerta")
        .select("id_alerta", { count: "exact", head: true })
        .eq("id_usuario", alert.id_usuario)
        .neq("estado", "LEIDA"),
    ]);

    if (subscriptionsResult.error) throw subscriptionsResult.error;
    if (unreadResult.error) throw unreadResult.error;

    const subscriptions = subscriptionsResult.data || [];

    if (!subscriptions.length) {
      return respond({ success: true, sent: 0, reason: "no_subscriptions" });
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey,
    );

    const payload = JSON.stringify({
      title: "AutoMecanic",
      body: alert.mensaje || "Tienes una nueva notificación.",
      badgeCount: Number(unreadResult.count || 0),
      icon: "/automecanic-icon-192.png",
      badge: "/automecanic-icon-192.png",
      tag: `automecanic-alert-${alert.id_alerta}`,
      url: "/",
    });

    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
          { TTL: 60 * 60 },
        );
        sent += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number(error.statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          const { error: deleteError } = await adminClient
            .from("push_subscription")
            .delete()
            .eq("id_usuario", alert.id_usuario)
            .eq("endpoint", subscription.endpoint);

          if (deleteError) {
            console.error("No se pudo retirar una suscripción push vencida:", deleteError);
          }
        } else {
          console.error("Error enviando notificación push:", error);
        }

        failed += 1;
      }
    }

    return respond({ success: true, sent, failed });
  } catch (error) {
    console.error("Error procesando notificación push:", error);
    return respond({
      success: false,
      error: error instanceof Error
        ? error.message
        : "No fue posible enviar la notificación push.",
    }, 500);
  }
});
