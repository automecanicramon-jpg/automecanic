import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.109.0";

type Row = Record<string, any>;
type AdminClient = SupabaseClient<any, "public", "public", any, any>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Row, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (value: unknown) => {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value ?? "").replace(/[&<>"']/g, character =>
    entities[character] ?? character
  );
};

const fullName = (user?: Row | null) =>
  [user?.nombre, user?.apellido_paterno, user?.apellido_materno]
    .filter(Boolean)
    .join(" ")
    .trim();

const unique = <T>(values: T[]): T[] =>
  [...new Set(values.filter(value => value !== null && value !== undefined))];

const check = (error: { message?: string } | null, label: string) => {
  if (error) {
    console.error(`[generar-reportes-mensuales] ${label}:`, error);
    throw new Error(`${label}: ${error.message || "Error de base de datos."}`);
  }
};

const getPreviousMonth = (now: Date) => {
  const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const month = previousMonth.getUTCMonth() + 1;
  const year = previousMonth.getUTCFullYear();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

  return { month, year, start, end };
};

const updateDelivery = async (
  adminClient: AdminClient,
  month: number,
  year: number,
  updates: Row,
) => {
  const { error } = await adminClient
    .from("reporte_entrega_mensual")
    .update({ ...updates, fecha_actualizacion: new Date().toISOString() })
    .eq("mes", month)
    .eq("anio", year);
  check(error, "No fue posible actualizar el estado de la entrega mensual");
};

const fetchRows = async (
  adminClient: AdminClient,
  table: string,
  query: (builder: any) => any,
  label: string,
): Promise<Row[]> => {
  const result = await query(adminClient.from(table));
  check(result.error, label);
  return (result.data || []) as Row[];
};

const saveReport = async (
  adminClient: AdminClient,
  record: Row,
) => {
  const { data: existing, error: existingError } = await adminClient
    .from("reporte_generado")
    .select("id_reporte")
    .eq("tipo_reporte", record.tipo_reporte)
    .eq("mes", record.mes)
    .eq("anio", record.anio)
    .eq("id_mecanico", record.id_mecanico)
    .eq("id_vehiculo", record.id_vehiculo)
    .order("fecha_generacion", { ascending: false })
    .limit(1)
    .maybeSingle();
  check(existingError, "No fue posible consultar el reporte mensual existente");

  const result = existing
    ? await adminClient
      .from("reporte_generado")
      .update(record)
      .eq("id_reporte", existing.id_reporte)
    : await adminClient
      .from("reporte_generado")
      .insert(record);
  check(result.error, "No fue posible guardar el reporte mensual");
};

const sendAdminEmail = async (
  recipients: Row[],
  subject: string,
  htmlContent: string,
) => {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") || "AutoMecanic Reportes";

  if (!apiKey || !senderEmail) {
    throw new Error("Faltan BREVO_API_KEY o BREVO_SENDER_EMAIL para notificar por correo.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: recipients.map(user => ({
        email: user.correo,
        name: fullName(user) || "Administrador",
      })),
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    console.error("[generar-reportes-mensuales] Brevo rechazó el correo:", responseBody);
    throw new Error(`No fue posible enviar el correo a los administradores (${response.status}).`);
  }
};

serve(async request => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método no permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization") || "";
  if (!supabaseUrl || !serviceRoleKey || authorization !== `Bearer ${serviceRoleKey}`) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let month = 0;
  let year = 0;
  try {
    const requestBody = await request.text();
    let payload: Row = {};
    if (requestBody.trim()) {
      try {
        payload = JSON.parse(requestBody);
      } catch {
        return jsonResponse({ error: "El cuerpo de la solicitud no es JSON válido." }, 400);
      }
    }

    const hasMonth = payload.mes !== undefined;
    const hasYear = payload.anio !== undefined;
    if (hasMonth !== hasYear) {
      return jsonResponse({ error: "Debes indicar mes y año juntos." }, 400);
    }

    const periodRange = hasMonth
      ? {
        month: Number(payload.mes),
        year: Number(payload.anio),
        ...(() => {
          const monthValue = Number(payload.mes);
          const yearValue = Number(payload.anio);
          const first = `${yearValue}-${String(monthValue).padStart(2, "0")}-01`;
          const lastDay = new Date(Date.UTC(yearValue, monthValue, 0)).getUTCDate();
          return {
            start: first,
            end: `${yearValue}-${String(monthValue).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
          };
        })(),
      }
      : getPreviousMonth(new Date());
    month = periodRange.month;
    year = periodRange.year;
    if (!Number.isInteger(month) || month < 1 || month > 12 ||
      !Number.isInteger(year) || year < 2000) {
      return jsonResponse({ error: "El mes o año del reporte no es válido." }, 400);
    }

    const { data: delivery, error: deliveryError } = await adminClient
      .from("reporte_entrega_mensual")
      .select("*")
      .eq("mes", month)
      .eq("anio", year)
      .maybeSingle();
    check(deliveryError, "No fue posible consultar el estado de la entrega mensual");

    if (delivery?.estado === "COMPLETADO") {
      return jsonResponse({
        message: "Los reportes de este periodo ya fueron entregados.",
        mes: month,
        anio: year,
        total_reportes: delivery.total_reportes,
      });
    }

    if (!delivery) {
      const { error } = await adminClient
        .from("reporte_entrega_mensual")
        .insert({ mes: month, anio: year, estado: "PROCESANDO" });
      check(error, "No fue posible iniciar la entrega mensual");
    } else {
      await updateDelivery(adminClient, month, year, {
        estado: "PROCESANDO",
        ultimo_error: null,
      });
    }

    const { data: mechanics, error: mechanicsError } = await adminClient
      .from("mecanico")
      .select("id_mecanico, id_usuario, especialidad");
    check(mechanicsError, "No fue posible consultar los mecánicos");

    if (!mechanics?.length) {
      throw new Error("No hay mecánicos para preparar los reportes.");
    }

    const mechanicUserIds = unique(mechanics.map(mechanic => mechanic.id_usuario));
    const { data: mechanicUsers, error: mechanicUsersError } = await adminClient
      .from("usuario")
      .select("id_usuario, id_rol, nombre, apellido_paterno, apellido_materno, correo")
      .in("id_usuario", mechanicUserIds);
    check(mechanicUsersError, "No fue posible consultar los perfiles de mecánicos");

    const { data: admins, error: adminsError } = await adminClient
      .from("usuario")
      .select("id_usuario, nombre, apellido_paterno, apellido_materno, correo")
      .eq("id_rol", 1);
    check(adminsError, "No fue posible consultar los administradores");
    const emailRecipients = (admins || []).filter(user =>
      typeof user.correo === "string" && user.correo.includes("@")
    );
    if (!admins?.length || !emailRecipients.length) {
      throw new Error("No se encontraron administradores con correo válido.");
    }

    const mechanicUserMap = new Map(
      (mechanicUsers || []).map(user => [String(user.id_usuario), user]),
    );
    const completedMechanics = mechanics.map(mechanic => ({
      ...mechanic,
      usuario: mechanicUserMap.get(String(mechanic.id_usuario)) || null,
    }));
    const mechanicIds = mechanics.map(mechanic => mechanic.id_mecanico);

    const vehicles = await fetchRows(
      adminClient,
      "vehiculo",
      builder => builder
        .select("id_vehiculo, id_cliente, id_mecanico, no_economico, placas, marca, modelo, anio_modelo, tipo_unidad, kilometraje_actual, estatus")
        .in("id_mecanico", mechanicIds),
      "No fue posible consultar las unidades de los mecánicos",
    );
    const clientIds = unique(vehicles.map(vehicle => vehicle.id_cliente));
    const clients = clientIds.length
      ? await fetchRows(
        adminClient,
        "cliente",
        builder => builder.select("id_cliente, id_usuario, direccion").in("id_cliente", clientIds),
        "No fue posible consultar los clientes",
      )
      : [];
    const clientUserIds = unique(clients.map(client => client.id_usuario));
    const { data: clientUsers, error: clientUsersError } = clientUserIds.length
      ? await adminClient
        .from("usuario")
        .select("id_usuario, nombre, apellido_paterno, apellido_materno, correo, telefono")
        .in("id_usuario", clientUserIds)
      : { data: [], error: null };
    check(clientUsersError, "No fue posible consultar los perfiles de clientes");

    const clientUserMap = new Map(
      (clientUsers || []).map(user => [String(user.id_usuario), user]),
    );
    const completedClients: Row[] = clients.map(client => ({
      ...client,
      usuario: clientUserMap.get(String(client.id_usuario)) || null,
    }));
    const clientMap = new Map(
      completedClients.map(client => [String(client.id_cliente), client]),
    );
    const mechanicMap = new Map(
      completedMechanics.map(mechanic => [String(mechanic.id_mecanico), mechanic]),
    );
    const completedVehicles: Row[] = vehicles.map(vehicle => ({
      ...vehicle,
      cliente: clientMap.get(String(vehicle.id_cliente)) || null,
      mecanico: mechanicMap.get(String(vehicle.id_mecanico)) || null,
    }));
    const serviceRows = await fetchRows(
      adminClient,
      "servicio",
      builder => builder
        .select("*")
        .in("id_mecanico", mechanicIds)
        .gte("fecha_servicio", periodRange.start)
        .lte("fecha_servicio", periodRange.end)
        .order("fecha_servicio", { ascending: true }),
      "No fue posible consultar los servicios del periodo",
    );
    const serviceIds = serviceRows.map(service => service.id_servicio);
    const [motors, transmissions, tireDetails] = serviceIds.length
      ? await Promise.all([
        fetchRows(adminClient, "servicio_motor", builder =>
          builder.select("*").in("id_servicio", serviceIds), "No fue posible consultar los detalles de motor"),
        fetchRows(adminClient, "servicio_transmision", builder =>
          builder.select("*").in("id_servicio", serviceIds), "No fue posible consultar los detalles de transmisión"),
        fetchRows(adminClient, "detalle_llanta", builder =>
          builder.select("*").in("id_servicio", serviceIds), "No fue posible consultar las inspecciones de llantas"),
      ])
      : [[], [], []];
    const tireTypeIds = unique(tireDetails.map(tire => tire.id_llanta));
    const tireTypes = tireTypeIds.length
      ? await fetchRows(adminClient, "tipo_llanta", builder =>
        builder.select("id_tipo, posicion, tipo_unidad, numero_llanta").in("id_tipo", tireTypeIds),
      "No fue posible consultar los tipos de llanta")
      : [];
    const motorMap = new Map(motors.map(row => [String(row.id_servicio), row]));
    const transmissionMap = new Map(transmissions.map(row => [String(row.id_servicio), row]));
    const tireTypeMap = new Map(tireTypes.map(row => [String(row.id_tipo), row]));
    const tireMap = new Map<string, Row[]>();

    for (const tire of tireDetails) {
      const type = tireTypeMap.get(String(tire.id_llanta)) || null;
      const enrichedTire = {
        ...tire,
        tipo_llanta: type,
        posicion: type?.posicion || null,
        numero_llanta: type?.numero_llanta || null,
        tipo_unidad: type?.tipo_unidad || null,
      };
      const key = String(tire.id_servicio);
      tireMap.set(key, [...(tireMap.get(key) || []), enrichedTire]);
    }

    const completedServices: Row[] = serviceRows.map(service => ({
      ...service,
      vehiculo: completedVehicles.find(vehicle =>
        String(vehicle.id_vehiculo) === String(service.id_vehiculo)
      ) || null,
      mecanico: mechanicMap.get(String(service.id_mecanico)) || null,
      motor: motorMap.get(String(service.id_servicio)) || null,
      transmision: transmissionMap.get(String(service.id_servicio)) || null,
      llantas: tireMap.get(String(service.id_servicio)) || [],
    }));
    const periodLabel = `${new Intl.DateTimeFormat("es-MX", {
      month: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)))} ${year}`;
    let totalReports = 0;

    for (const mechanic of completedMechanics) {
      const mechanicVehicles = completedVehicles.filter(vehicle =>
        String(vehicle.id_mecanico) === String(mechanic.id_mecanico)
      );

      for (const vehicle of mechanicVehicles) {
        const services = completedServices.filter(service =>
          String(service.id_mecanico) === String(mechanic.id_mecanico) &&
          String(service.id_vehiculo) === String(vehicle.id_vehiculo)
        );
        const reportData = {
          rango: { desde: periodRange.start, hasta: periodRange.end, tipo: "mes" },
          filtros: {
            mes: String(month),
            anio: String(year),
            idMecanico: mechanic.id_mecanico,
            idVehiculos: [vehicle.id_vehiculo],
            vehicleScope: "seleccionados",
            vehicleIds: [vehicle.id_vehiculo],
          },
          vehiculoSeleccionado: vehicle,
          servicios: services,
          citas: [],
          alertas: [],
          mantenimientos: [],
          vehiculos: [vehicle],
          clientes: vehicle.cliente ? [vehicle.cliente] : [],
          mecanicos: [mechanic],
          usuarios: [mechanic.usuario, vehicle.cliente?.usuario].filter(Boolean),
          tiposLlanta: tireTypes.filter(type =>
            services.some(service => service.llantas.some((tire: Row) =>
              String(tire.id_llanta) === String(type.id_tipo)
            ))
          ),
          resumen: {
            servicios: services.length,
            vehiculos: services.length ? 1 : 0,
            mecanicos: services.length ? 1 : 0,
            citas: 0,
            citasAtendidas: 0,
            citasVencidas: 0,
            alertas: 0,
            llantasInspeccionadas: services.reduce((total, service) =>
              total + service.llantas.length, 0
            ),
            serviciosMotor: services.filter(service => service.motor).length,
            serviciosTransmision: services.filter(service => service.transmision).length,
          },
        };

        for (const type of ["servicios", "llantas"]) {
          await saveReport(adminClient, {
            tipo_reporte: type,
            id_mecanico: mechanic.id_mecanico,
            id_vehiculo: vehicle.id_vehiculo,
            mes: month,
            anio: year,
            periodo: periodLabel,
            orientacion: type === "llantas" ? "landscape" : "portrait",
            generado_automaticamente: true,
            datos: reportData,
          });
        }

        totalReports += 2;
      }
    }

    const reportMessage =
      `Los reportes mensuales de servicios e inspección de llantas de ${periodLabel} ya están disponibles en el módulo Reportes. Se prepararon ${totalReports} reportes para ${completedMechanics.length} mecánicos.`;
    const { data: deliveryState, error: deliveryStateError } = await adminClient
      .from("reporte_entrega_mensual")
      .select("notificaciones_creadas, correos_enviados")
      .eq("mes", month)
      .eq("anio", year)
      .single();
    check(deliveryStateError, "No fue posible consultar el avance de las notificaciones");
    if (!deliveryState) {
      throw new Error("No se encontró el registro de la entrega mensual.");
    }

    if (!deliveryState.notificaciones_creadas) {
      for (const admin of admins || []) {
        const { data: existingAlert, error: alertCheckError } = await adminClient
          .from("alerta")
          .select("id_alerta")
          .eq("id_usuario", admin.id_usuario)
          .eq("tipo_alerta", "REPORTES_MENSUALES_DISPONIBLES")
          .eq("mensaje", reportMessage)
          .limit(1)
          .maybeSingle();
        check(alertCheckError, "No fue posible verificar la notificación de reportes");

        if (!existingAlert) {
          const { error } = await adminClient.from("alerta").insert({
            id_vehiculo: null,
            id_usuario: admin.id_usuario,
            tipo_alerta: "REPORTES_MENSUALES_DISPONIBLES",
            nivel: "INFO",
            mensaje: reportMessage,
            estado: "PENDIENTE",
            fecha_programada: new Date().toISOString(),
            fecha_lectura: null,
          });
          check(error, "No fue posible crear la alerta de reportes para el administrador");
        }
      }

      await updateDelivery(adminClient, month, year, { notificaciones_creadas: true });
    }

    if (!deliveryState.correos_enviados) {
      const appUrl = Deno.env.get("APP_URL");
      const linkLine = appUrl
        ? `<p><a href="${escapeHtml(appUrl)}">Abrir AutoMecanic</a> y consulta el módulo Reportes para ver o descargar cada reporte.</p>`
        : "<p>Ingresa a AutoMecanic y abre el módulo Reportes para ver o descargar cada reporte.</p>";
      await sendAdminEmail(
        emailRecipients,
        `Reportes mensuales disponibles: ${periodLabel}`,
        `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#1f2937">
          <h2 style="color:#166534">Reportes mensuales disponibles</h2>
          <p>Ya están disponibles los reportes de servicios e inspección de llantas correspondientes a <strong>${escapeHtml(periodLabel)}</strong>.</p>
          <p>Se generaron ${totalReports} reportes individuales por mecánico y unidad.</p>
          ${linkLine}
        </div>`,
      );
      await updateDelivery(adminClient, month, year, { correos_enviados: true });
    }

    await updateDelivery(adminClient, month, year, {
      estado: "COMPLETADO",
      total_reportes: totalReports,
      ultimo_error: null,
    });

    return jsonResponse({
      message: "Los reportes mensuales se generaron y notificaron a los administradores.",
      mes: month,
      anio: year,
      total_reportes: totalReports,
    });
  } catch (error) {
    console.error("[generar-reportes-mensuales] Error:", error);
    if (month && year) {
      try {
        await updateDelivery(adminClient, month, year, {
          estado: "ERROR",
          ultimo_error: error instanceof Error ? error.message : "Error inesperado",
        });
      } catch (updateError) {
        console.error("[generar-reportes-mensuales] No se pudo registrar el error:", updateError);
      }
    }
    return jsonResponse({
      error: error instanceof Error ? error.message : "No fue posible generar la entrega mensual.",
    }, 500);
  }
});
